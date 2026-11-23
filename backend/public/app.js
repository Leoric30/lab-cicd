(() => {
  'use strict';

  const form = document.getElementById('login');
  const msg = document.getElementById('msg');
  const button = form.querySelector('button[type="submit"]');

  const COLORS = {
    ok: '#16a34a',
    error: '#dc2626',
    info: '#374151',
  };

  function show(text, kind) {
    msg.textContent = text;
    msg.style.color = COLORS[kind] || '';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const username = String(data.get('username') ?? '');
    const password = String(data.get('password') ?? '');

    button.disabled = true;
    show('Verificando...', 'info');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (res.ok && body && body.ok) {
        show(`Bienvenido, ${body.user}`, 'ok');
      } else {
        const error = body && typeof body.error === 'string'
          ? body.error
          : `Error inesperado (HTTP ${res.status})`;
        show(error, 'error');
      }
    } catch {
      show('No se pudo conectar con el servidor', 'error');
    } finally {
      button.disabled = false;
    }
  });
})();
