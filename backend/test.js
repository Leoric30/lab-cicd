const assert = require('assert');
const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash('secreto123', 4);
  assert.strictEqual(await bcrypt.compare('secreto123', hash), true);
  assert.strictEqual(await bcrypt.compare('otra-clave', hash), false);
  console.log('Pruebas de contraseñas OK');
})();
