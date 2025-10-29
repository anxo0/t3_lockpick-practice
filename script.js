// script.js
// Simulación NUI para ejecutar el minijuego fuera de FiveM
// Coloca este archivo en la misma carpeta que tu index.html (ya tienes la línea <script src="script.js"></script> al final)

/* =========================
   Interceptar $.post para que las llamadas a
   "https://t3_lockpick/close", "/succeed", "/failed"
   no intenten hacer una petición real y en su lugar
   ejecuten la lógica local correspondiente.
   ========================= */
(function () {
  if (typeof $ === 'undefined') {
    console.warn('jQuery no está cargado. Asegúrate de que jQuery esté incluido en el HTML.');
    return;
  }

  const _origPost = $.post;
  $.post = function (url, data, cb, type) {
    try {
      if (typeof url === 'string' && url.startsWith('https://t3_lockpick/')) {
        const action = url.split('/').pop(); // "close", "succeed", "failed"
        console.log(`[simulator] Intercepted $.post -> ${action}`);
        // Manejo local, replicando lo que haría el cliente FiveM
        if (action === 'close') {
          // Cerrar UI
          document.getElementById('lock-container')?.classList.add('hide');
        } else if (action === 'succeed') {
          // Éxito: reproducir sonido de unlock si existe y esconder UI
          try { new Audio('sounds/unlock.mp3').play(); } catch (e) { /* noop */ }
          document.getElementById('lock-container')?.classList.add('hide');

          // Recargar página 1 segundo después
          setTimeout(() => {
            location.reload();
          }, 1000);

        } else if (action === 'failed') {
          // Fallo: reproducir sonido si existe y esconder UI
          try { new Audio('sounds/tap.wav').play(); } catch (e) { /* noop */ }
          document.getElementById('lock-container')?.classList.add('hide');

          // Recargar página 2 segundos después
          setTimeout(() => {
            location.reload();
          }, 1000);
        }
        // Devolver un objeto "thenable" para compatibilidad con el código que espera una promesa
        const d = $.Deferred();
        d.resolve();
        if (typeof cb === 'function') cb();
        return d.promise();
      } else {
        // Llamada normal a $.post
        return _origPost.apply(this, arguments);
      }
    } catch (err) {
      console.error('[simulator] Error en $.post intercept:', err);
      return _origPost.apply(this, arguments);
    }
  };
})();

/* =========================
   Auto-arranque: enviar un mensaje "startLockpick"
   al mismo formato que usa el código interno del index.html.
   ========================= */
(function () {
  // Parámetros que quieres simular al abrir la página
  const AUTO_START = true;        // si true, inicia en cuanto abra la página
  const AUTO_STRENGTH = 0.75;     // fuerza de la ganzúa (0..1)
  const AUTO_DIFFICULTY = 2;      // dificultad (1..7 en tu script)
  const AUTO_PINS = 4;            // número de pines (3..9)

  function sendStartMessage() {
    const msg = {
      action: 'startLockpick',
      data: {
        strength: AUTO_STRENGTH,
        difficulty: AUTO_DIFFICULTY,
        pins: AUTO_PINS
      }
    };
    console.log('[simulator] Enviando mensaje startLockpick ->', msg.data);
    // El código del index.html escucha window.addEventListener('message', ...)
    window.postMessage(msg, '*');
  }

  // Esperar a que el DOM esté listo y a que el listener del index.html
  // (que se registra en window.onload) se haya registrado.
  // Hacemos un pequeño reintento por 300ms para asegurar captura.
  if (AUTO_START) {
    let tries = 0;
    const maxTries = 30;
    const interval = setInterval(() => {
      tries++;
      // Enviamos el mensaje (el listener lo procesará cuando exista)
      sendStartMessage();
      if (tries >= maxTries) {
        clearInterval(interval);
      } else {
        // Si detectamos que el lock-container ya se muestra, dejar de enviar
        const shown = document.getElementById('lock-container') && !document.getElementById('lock-container').classList.contains('hide');
        if (shown) {
          clearInterval(interval);
        }
      }
    }, 10); // cada 10ms, hasta 300ms en total
  }
})();

/* =========================
   Opcional: atajos para depuración en el navegador:
   - Pulsar la tecla F1 abrirá la UI si está cerrada.
   - F2 cerrará la UI.
   (Esto no interfiere con el resto del script).
   ========================= */
(function () {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
      document.getElementById('lock-container')?.classList.remove('hide');
      // reenviar start para reconfigurar si hace falta
      window.postMessage({
        action: 'startLockpick',
        data: { strength: 0.95, difficulty: 2, pins: 4 }
      }, '*');
    } else if (e.key === 'F2') {
      document.getElementById('lock-container')?.classList.add('hide');
    }
  });
})();
