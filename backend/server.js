const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const PORT = 3000;
const VERSION = process.env.APP_VERSION || 'dev';
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };

function requireEnv(name) {
  if (!process.env[name]) throw new Error(`Falta la variable de entorno ${name}`);
  return process.env[name];
}

const pool = new Pool({
  host: requireEnv('DB_HOST'),
  port: 5432,
  database: requireEnv('DB_NAME'),
  user: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDb(retries = 30) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Base de datos disponible');
      return;
    } catch (err) {
      console.log(`Esperando base de datos (${i}/${retries}): ${err.message}`);
      await sleep(2000);
    }
  }
  throw new Error('La base de datos no respondió a tiempo');
}

async function initDb() {
  await waitForDb();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
  const hash = await bcrypt.hash(requireEnv('ADMIN_PASSWORD'), 10);
  await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
    [process.env.ADMIN_USER || 'admin', hash]
  );
  console.log('Tabla users lista');
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function handleLogin(req, res) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10000) return sendJson(res, 413, { ok: false, error: 'Solicitud demasiado grande' });
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return sendJson(res, 400, { ok: false, error: 'JSON inválido' });
  }

  const { username, password } = data;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return sendJson(res, 400, { ok: false, error: 'Faltan usuario o contraseña' });
  }

  const result = await pool.query('SELECT password_hash FROM users WHERE username = $1', [username]);
  const valid = result.rowCount === 1 && (await bcrypt.compare(password, result.rows[0].password_hash));
  if (!valid) return sendJson(res, 401, { ok: false, error: 'Usuario o contraseña incorrectos' });

  return sendJson(res, 200, { ok: true, user: username });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return sendJson(res, 200, { status: 'ok', version: VERSION });
    }
    if (req.method === 'POST' && req.url === '/api/login') {
      return await handleLogin(req, res);
    }
    if (req.method === 'GET') {
      const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
      const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
      if (!filePath.startsWith(PUBLIC_DIR + path.sep)) return sendJson(res, 403, { ok: false, error: 'Prohibido' });
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        return res.end(fs.readFileSync(filePath));
      }
    }
    return sendJson(res, 404, { ok: false, error: 'No encontrado' });
  } catch (err) {
    console.error('Error en la petición:', err);
    return sendJson(res, 500, { ok: false, error: 'Error interno' });
  }
});

// El servidor solo empieza a escuchar cuando la base de datos está lista.
initDb()
  .then(() => server.listen(PORT, () => console.log(`Backend v${VERSION} en puerto ${PORT}`)))
  .catch((err) => {
    console.error('No se pudo iniciar:', err.message);
    process.exit(1);
  });
