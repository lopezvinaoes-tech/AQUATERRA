// Chat con IA de la web: botón flotante y ventana de conversación.
// Se incluye con <script src="./chat.js" defer></script> en cada página.
// Opcional: data-offset="80" en la etiqueta sube el botón (p. ej. si hay una barra fija abajo).
(function () {
  if (window.__aqChat) return;
  window.__aqChat = true;

  var KEY = 'aquaterra-chat';
  var script = document.currentScript;
  var offset = parseInt((script && script.getAttribute('data-offset')) || '0', 10) || 0;
  var marca = (window.MARCA && window.MARCA.nombre) || 'Aquaterra';
  var wa = String((window.MARCA && window.MARCA.whatsapp) || '').replace(/\D/g, '');
  var SALUDO = '¡Hola! Soy el asistente virtual de ' + marca + '. Te ayudo con dudas sobre invertir en Paraguay desde España: rentabilidad, impuestos, cómo comprar a distancia o qué proyecto encaja contigo. ¿Qué te gustaría saber?';
  var SUGERENCIAS = ['¿Qué rentabilidad puedo esperar?', '¿Puedo comprar sin viajar?', '¿Qué impuestos pagaría?', 'Tengo USD 60.000, ¿qué me recomiendas?'];

  var estado = { mensajes: [], lead: null, abierto: false };
  try { Object.assign(estado, JSON.parse(sessionStorage.getItem(KEY) || '{}')); } catch (e) {}
  function guardar() { try { sessionStorage.setItem(KEY, JSON.stringify(estado)); } catch (e) {} }

  var css = [
    '.aqc,.aqc *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif}',
    '.aqc-btn{position:fixed;right:20px;bottom:calc(20px + var(--aqc-off,0px) + env(safe-area-inset-bottom));z-index:90;display:flex;align-items:center;gap:10px;height:56px;padding:0 20px 0 16px;border:0;border-radius:28px;background:#1D1D1F;color:#fff;font-size:15px;font-weight:600;letter-spacing:-.01em;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.28);transition:transform .25s,box-shadow .25s,opacity .25s;-webkit-tap-highlight-color:transparent}',
    '.aqc-btn:hover{transform:translateY(-2px);box-shadow:0 14px 36px rgba(0,0,0,.32)}',
    '.aqc-btn:focus-visible,.aqc-x:focus-visible,.aqc-send:focus-visible,.aqc-chip:focus-visible{outline:2px solid #C9F15D;outline-offset:2px}',
    '.aqc-dot{width:30px;height:30px;border-radius:50%;background:#C9F15D;display:grid;place-items:center;flex:none}',
    '.aqc-dot svg{width:17px;height:17px}',
    '.aqc-pulse{position:absolute;top:8px;left:38px;width:10px;height:10px;border-radius:50%;background:#C9F15D;border:2px solid #1D1D1F}',
    '.aqc-open .aqc-btn,.aqc-menu .aqc-btn{opacity:0;pointer-events:none;transform:scale(.9)}',
    '.aqc-logo{display:none;width:100%;height:100%}',
    '.aqc-win{position:fixed;right:20px;bottom:calc(20px + var(--aqc-off,0px) + env(safe-area-inset-bottom));z-index:91;width:380px;max-width:calc(100vw - 32px);height:min(620px,calc(100vh - 120px));display:flex;flex-direction:column;background:#fff;color:#1D1D1F;border-radius:22px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.3);opacity:0;transform:translateY(16px) scale(.98);pointer-events:none;transition:opacity .25s,transform .25s}',
    '.aqc-open .aqc-win{opacity:1;transform:none;pointer-events:auto}',
    '.aqc-head{display:flex;align-items:center;gap:12px;padding:16px 16px 14px 18px;background:#1D1D1F;color:#fff}',
    '.aqc-head b{display:block;font-size:15px;letter-spacing:-.01em}',
    '.aqc-head small{display:flex;align-items:center;gap:6px;font-size:12px;color:#B8B8BD;margin-top:2px}',
    '.aqc-head small:before{content:"";width:7px;height:7px;border-radius:50%;background:#C9F15D}',
    '.aqc-x{margin-left:auto;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:18px;line-height:1;cursor:pointer}',
    '.aqc-body{flex:1;overflow-y:auto;padding:18px 16px 8px;background:#F5F5F7;overscroll-behavior:contain}',
    '.aqc-m{max-width:86%;margin:0 0 10px;padding:10px 14px;border-radius:18px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}',
    '.aqc-m a{color:inherit;text-decoration:underline;text-underline-offset:2px}',
    '.aqc-bot{background:#fff;border-bottom-left-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.06)}',
    '.aqc-bot a{color:#0B5CAD}',
    '.aqc-user{margin-left:auto;background:#1D1D1F;color:#fff;border-bottom-right-radius:6px}',
    '.aqc-ok{background:#E4F7B0;color:#1D1D1F}',
    '.aqc-err{background:#FFF1F0;color:#8A1F11}',
    '.aqc-typing{display:inline-flex;gap:4px;padding:14px 16px}',
    '.aqc-typing i{width:7px;height:7px;border-radius:50%;background:#86868B;animation:aqc-b 1.2s infinite}',
    '.aqc-typing i:nth-child(2){animation-delay:.15s}.aqc-typing i:nth-child(3){animation-delay:.3s}',
    '@keyframes aqc-b{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-3px)}}',
    '.aqc-chips{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px}',
    '.aqc-chip{border:1px solid #D2D2D7;background:#fff;color:#1D1D1F;border-radius:999px;padding:8px 12px;font-size:13px;cursor:pointer;text-align:left}',
    '.aqc-chip:hover{border-color:#1D1D1F}',
    '.aqc-foot{padding:10px 12px 12px;background:#fff;border-top:1px solid #E8E8ED}',
    '.aqc-form{display:flex;align-items:flex-end;gap:8px}',
    '.aqc-in{flex:1;resize:none;max-height:120px;min-height:44px;border:1px solid #D2D2D7;border-radius:22px;padding:11px 16px;font-size:16px;line-height:1.35;color:#1D1D1F;background:#fff;outline:none}',
    '.aqc-in:focus{border-color:#1D1D1F}',
    '.aqc-send{width:44px;height:44px;flex:none;border:0;border-radius:50%;background:#C9F15D;color:#1D1D1F;display:grid;place-items:center;cursor:pointer}',
    '.aqc-send:disabled{opacity:.45;cursor:default}',
    '.aqc-send svg{width:18px;height:18px}',
    '.aqc-legal{margin:8px 4px 0;font-size:11px;line-height:1.35;color:#86868B}',
    '.aqc-legal a{color:#6E6E73}',
    '@media (max-width:560px){.aqc-btn{right:16px;width:48px;height:48px;padding:0;justify-content:center;border-radius:50%;background:#0B0C0F;overflow:hidden}.aqc-btn>.aqc-dot,.aqc-btn>.aqc-txt,.aqc-pulse{display:none}.aqc-logo{display:block}.aqc-win{right:0;bottom:0;width:100%;max-width:none;height:100%;height:100dvh;border-radius:0}.aqc-head{padding-top:calc(14px + env(safe-area-inset-top))}.aqc-foot{padding-bottom:calc(12px + env(safe-area-inset-bottom))}}',
    '@media (prefers-reduced-motion:reduce){.aqc-btn,.aqc-win{transition:none}.aqc-typing i{animation:none}}'
  ].join('\n');

  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="#1D1D1F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  // Logo de la marca (el mismo que el favicon): en móvil el botón es solo este círculo.
  var LOGO = '<svg class="aqc-logo" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#0B0C0F"/><path d="M32 16 48 32 32 48 16 32Z" fill="#C9F15D"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Formato mínimo y seguro: **negrita** y [texto](url) con url http(s) o relativa.
  function formato(t) {
    return esc(t)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, function (_, txt, url) {
        var ext = /^https?:/.test(url) && url.indexOf(location.host) < 0;
        return '<a href="' + url + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + txt + '</a>';
      });
  }

  function init() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var root = document.createElement('div');
    root.className = 'aqc';
    if (offset) root.style.setProperty('--aqc-off', offset + 'px');
    root.innerHTML =
      '<button class="aqc-btn" type="button" aria-label="Abrir el asistente virtual"><span class="aqc-dot">' + ICON_CHAT + '</span>' +
      (estado.mensajes.length ? '' : '<span class="aqc-pulse"></span>') + '<span class="aqc-txt">¿Dudas? Pregúntame</span>' + LOGO + '</button>' +
      '<section class="aqc-win" role="dialog" aria-label="Asistente virtual de ' + esc(marca) + '" aria-hidden="true" inert>' +
        '<header class="aqc-head"><span class="aqc-dot">' + ICON_CHAT + '</span><div><b>Asistente ' + esc(marca) + '</b><small>Asistente con IA · responde al momento</small></div>' +
        '<button class="aqc-x" type="button" aria-label="Cerrar">✕</button></header>' +
        '<div class="aqc-body" aria-live="polite"></div>' +
        '<footer class="aqc-foot"><form class="aqc-form"><textarea class="aqc-in" rows="1" maxlength="2000" placeholder="Escribe tu pregunta…" aria-label="Tu mensaje"></textarea>' +
        '<button class="aqc-send" type="submit" aria-label="Enviar">' + ICON_SEND + '</button></form>' +
        '<p class="aqc-legal">Asistente con inteligencia artificial: puede equivocarse y no sustituye a un asesor. Si compartes tus datos, solo los usaremos para responder tu consulta.' +
        (wa ? ' ¿Prefieres hablar con una persona? <a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">WhatsApp</a>.' : '') + '</p></footer>' +
      '</section>';
    document.body.appendChild(root);

    var btn = root.querySelector('.aqc-btn');
    var win = root.querySelector('.aqc-win');
    var body = root.querySelector('.aqc-body');
    var form = root.querySelector('.aqc-form');
    var input = root.querySelector('.aqc-in');
    var send = root.querySelector('.aqc-send');
    var ocupado = false;

    function burbuja(texto, clase) {
      var d = document.createElement('div');
      d.className = 'aqc-m ' + clase;
      d.innerHTML = formato(texto);
      body.appendChild(d);
      return d;
    }
    function render() {
      body.innerHTML = '';
      burbuja(SALUDO, 'aqc-bot');
      estado.mensajes.forEach(function (m) { burbuja(m.content, m.role === 'user' ? 'aqc-user' : 'aqc-bot'); });
      if (!estado.mensajes.length) {
        var chips = document.createElement('div');
        chips.className = 'aqc-chips';
        SUGERENCIAS.forEach(function (s) {
          var c = document.createElement('button');
          c.type = 'button'; c.className = 'aqc-chip'; c.textContent = s;
          c.onclick = function () { enviar(s); };
          chips.appendChild(c);
        });
        body.appendChild(chips);
      }
      body.scrollTop = body.scrollHeight;
    }
    function abrir(v) {
      estado.abierto = v; guardar();
      root.classList.toggle('aqc-open', v);
      win.setAttribute('aria-hidden', v ? 'false' : 'true');
      win.inert = !v;
      var p = root.querySelector('.aqc-pulse'); if (p && v) p.remove();
      if (v) { render(); if (window.matchMedia('(min-width:561px)').matches) setTimeout(function () { input.focus(); }, 200); }
      else btn.focus({ preventScroll: true });
    }
    // Con el menú desplegable abierto (elemento data-aq-menu de cada página) el botón se oculta.
    function menu() { root.classList.toggle('aqc-menu', !!document.querySelector('[data-aq-menu]')); }
    new MutationObserver(menu).observe(document.body, { childList: true, subtree: true });
    menu();
    function ajustar() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }

    function enviar(texto) {
      texto = String(texto || '').trim();
      if (!texto || ocupado) return;
      ocupado = true; send.disabled = true;
      var chips = body.querySelector('.aqc-chips'); if (chips) chips.remove();
      estado.mensajes.push({ role: 'user', content: texto.slice(0, 2000) }); guardar();
      burbuja(texto, 'aqc-user');
      input.value = ''; ajustar();
      var typing = document.createElement('div');
      typing.className = 'aqc-m aqc-bot aqc-typing';
      typing.innerHTML = '<i></i><i></i><i></i>';
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      // Si el servidor no contesta en 75 s se corta la espera y se muestra el error.
      var corte = window.AbortController ? new AbortController() : null;
      var reloj = corte && setTimeout(function () { corte.abort(); }, 75000);
      fetch('/api/chat', {
        method: 'POST',
        signal: corte ? corte.signal : undefined,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensajes: estado.mensajes.slice(-40), lead: estado.lead, pagina: location.pathname + location.search })
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'No pude responder ahora.'); return j; }); })
        .then(function (j) {
          typing.remove();
          estado.mensajes.push({ role: 'assistant', content: j.respuesta });
          if (j.lead) estado.lead = j.lead;
          guardar();
          burbuja(j.respuesta, 'aqc-bot');
          if (j.guardado && window.gtag) try { window.gtag('event', 'generate_lead', { method: 'chat_ia' }); } catch (e) {}
        })
        .catch(function (e) {
          typing.remove();
          if (e.name === 'AbortError') e = new Error('El asistente está tardando demasiado. Prueba de nuevo en un momento.');
          // El mensaje no respondido se quita del historial para poder reintentar.
          estado.mensajes.pop(); guardar();
          burbuja(e.message + (wa ? ' También puedes escribirnos por [WhatsApp](https://wa.me/' + wa + ').' : ''), 'aqc-err');
          input.value = texto; ajustar();
        })
        .then(function () { clearTimeout(reloj); ocupado = false; send.disabled = false; body.scrollTop = body.scrollHeight; });
    }

    btn.onclick = function () { abrir(true); };
    root.querySelector('.aqc-x').onclick = function () { abrir(false); };
    form.onsubmit = function (e) { e.preventDefault(); enviar(input.value); };
    input.addEventListener('input', ajustar);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); enviar(input.value); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && estado.abierto) abrir(false); });
    // Cualquier enlace a #asistente abre el chat.
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href$="#asistente"]');
      if (a) { e.preventDefault(); abrir(true); }
    });
    window.abrirAsistente = function (pregunta) { abrir(true); if (pregunta) enviar(pregunta); };

    if (estado.abierto && window.matchMedia('(min-width:561px)').matches) abrir(true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
