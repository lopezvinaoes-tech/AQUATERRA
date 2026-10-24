// Aviso de cookies (RGPD + ePrivacy / LSSI art. 22.2, guía de la AEPD).
// Se incluye con <script src="./cookies.js" defer></script> antes de leads.js en cada página.
// - Nada opcional se guarda ni se carga hasta que la persona acepta su categoría.
// - "Rechazar" está al mismo nivel que "Aceptar" y cerrar el aviso con ✕ equivale a rechazar.
// - La elección se recuerda 12 meses; después (o si cambian las categorías) se vuelve a preguntar.
// API: window.AQCookies.ok('preferencias' | 'medicion' | 'terceros') → true/false,
//      window.AQCookies.permitir(cat), window.AQCookies.abrir() abre la configuración.
//      Cada cambio dispara el evento 'aq-consent' en window.
// Microsoft Clarity (mapas de calor y grabaciones) solo se carga con permiso de 'medicion'.
// Formularios y chat van con data-clarity-mask para que no se grabe lo que escribe nadie.
// Cualquier elemento con data-aq-cookies abre la configuración al hacer clic (p. ej. en el pie).
(function () {
  if (window.AQCookies) return;

  var KEY = 'aquaterra-consentimiento';
  var VERSION = 2; // 2: Medición incluye Microsoft Clarity, hay que volver a preguntar.
  var DURACION = 365 * 24 * 3600 * 1000;
  var CATS = [
    { id: 'necesarias', t: 'Necesarias', d: 'Hacen funcionar la web y recuerdan lo que tú eliges: modo día o noche, el prefijo de teléfono, los proyectos que comparas, la conversación del chat y esta misma elección. No se pueden desactivar.', fija: true },
    { id: 'preferencias', t: 'Preferencias', d: 'Recordar en este navegador tu nombre y contacto tras enviar un formulario, para no tener que escribirlos otra vez.' },
    { id: 'medicion', t: 'Medición', d: 'Saber de qué campaña o enlace llegaste (parámetros utm), contar las consultas que recibimos y ver con Microsoft Clarity dónde se hace clic y hasta dónde se baja en cada página, para mejorar la web. Lo que escribes en formularios y chat no se graba. No usamos publicidad.' },
    { id: 'terceros', t: 'Mapas de Google', d: 'Mostrar el mapa de Google Maps en la ficha de cada proyecto. Google puede instalar sus propias cookies al cargarlo.' }
  ];
  var OPCIONALES = ['preferencias', 'medicion', 'terceros'];
  // Lo que se borra al retirar cada permiso.
  var LIMPIAR = { preferencias: [['local', 'aquaterra-contacto']], medicion: [['session', 'aquaterra-utm']] };
  var CLARITY_ID = 'z2okpcj7rj';

  function leer() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && c.v === VERSION && Date.now() - new Date(c.fecha).getTime() < DURACION) return c;
    } catch (e) {}
    return null;
  }
  var consent = leer();

  function ok(cat) { return cat === 'necesarias' || !!(consent && consent[cat]); }

  function guardar(elec) {
    var antes = consent;
    consent = { v: VERSION, fecha: new Date().toISOString() };
    OPCIONALES.forEach(function (c) { consent[c] = !!elec[c]; });
    try { localStorage.setItem(KEY, JSON.stringify(consent)); } catch (e) {}
    OPCIONALES.forEach(function (c) {
      if (consent[c] || !LIMPIAR[c]) return;
      LIMPIAR[c].forEach(function (x) { try { (x[0] === 'local' ? localStorage : sessionStorage).removeItem(x[1]); } catch (e) {} });
    });
    // Si algún día se añade Google Analytics, queda informado con Consent Mode.
    if (typeof window.gtag === 'function') {
      try { window.gtag('consent', 'update', { analytics_storage: consent.medicion ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }); } catch (e) {}
    }
    clarity();
    try { window.dispatchEvent(new CustomEvent('aq-consent', { detail: { antes: antes, ahora: consent } })); } catch (e) {}
  }

  // Microsoft Clarity: se carga al dar permiso de medición y se apaga (y borra sus cookies) al retirarlo.
  var clarityCargado = false, mascaraObs;
  function enmascarar(n) {
    if (!n.querySelectorAll) return;
    if (n.matches && n.matches('form, .aqc')) n.setAttribute('data-clarity-mask', 'true');
    n.querySelectorAll('form, .aqc').forEach(function (el) { el.setAttribute('data-clarity-mask', 'true'); });
  }
  function clarity() {
    if (!ok('medicion')) {
      if (clarityCargado && typeof window.clarity === 'function') try { window.clarity('consent', false); } catch (e) {}
      ['_clck', '_clsk', 'CLID', 'MUID'].forEach(function (n) {
        var h = location.hostname;
        document.cookie = n + '=; Max-Age=0; path=/';
        document.cookie = n + '=; Max-Age=0; path=/; domain=' + h;
        document.cookie = n + '=; Max-Age=0; path=/; domain=.' + h.split('.').slice(-2).join('.');
      });
      return;
    }
    if (clarityCargado) { try { window.clarity('consent'); } catch (e) {} return; }
    if (!document.body) { document.addEventListener('DOMContentLoaded', clarity); return; }
    clarityCargado = true;
    // El observador va antes que Clarity para que marque los formularios nuevos antes de que se graben.
    enmascarar(document.body);
    mascaraObs = new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(enmascarar); }); });
    mascaraObs.observe(document.body, { childList: true, subtree: true });
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    window.clarity('consent');
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
    document.head.appendChild(s);
  }

  function todas(v) { var o = {}; OPCIONALES.forEach(function (c) { o[c] = v; }); return o; }

  var css = [
    '.aqk,.aqk *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif}',
    '.aqk-bar{position:fixed;left:20px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:100;width:440px;max-width:calc(100vw - 40px);padding:20px 20px 18px;border-radius:22px;background:#1D1D1F;color:#F5F5F7;box-shadow:0 24px 70px rgba(0,0,0,.35);opacity:0;transform:translateY(16px);transition:opacity .3s,transform .3s}',
    '.aqk-show .aqk-bar{opacity:1;transform:none}',
    '.aqk-bar h2{display:flex;align-items:center;gap:10px;margin:0 32px 8px 0;font-size:17px;font-weight:600;letter-spacing:-.02em}',
    '.aqk-bar h2:before{content:"";width:10px;height:10px;flex:none;background:#C9F15D;transform:rotate(45deg);border-radius:2px}',
    '.aqk-bar p{margin:0 0 16px;font-size:14px;line-height:1.5;color:rgba(245,245,247,.8)}',
    '.aqk a{color:#E4F7B0;text-decoration:underline;text-underline-offset:2px}',
    '.aqk-row{display:flex;flex-wrap:wrap;gap:8px}',
    '.aqk-b{flex:1 1 0;min-height:44px;padding:0 16px;border-radius:999px;border:1px solid rgba(245,245,247,.28);background:transparent;color:#F5F5F7;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background .2s,border-color .2s}',
    '.aqk-b:hover{border-color:#F5F5F7}',
    '.aqk-main{background:#F5F5F7;border-color:#F5F5F7;color:#1D1D1F}',
    '.aqk-main:hover{background:#fff}',
    '.aqk-link{flex-basis:100%;min-height:36px;border:0;background:none;color:rgba(245,245,247,.8);font-size:13px;font-weight:500;text-decoration:underline;text-underline-offset:2px;cursor:pointer}',
    '.aqk-x{position:absolute;top:12px;right:12px;width:32px;height:32px;border:0;border-radius:50%;background:rgba(255,255,255,.1);color:#F5F5F7;font-size:15px;line-height:1;cursor:pointer}',
    '.aqk-b:focus-visible,.aqk-link:focus-visible,.aqk-x:focus-visible,.aqk-sw input:focus-visible+span{outline:2px solid #C9F15D;outline-offset:2px}',
    '.aqk-ov{position:fixed;inset:0;z-index:101;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.5);opacity:0;pointer-events:none;transition:opacity .25s}',
    '.aqk-cfg .aqk-ov{opacity:1;pointer-events:auto}',
    '.aqk-cfg .aqk-bar{display:none}',
    '.aqk-dlg{position:relative;width:520px;max-width:100%;max-height:calc(100vh - 32px);overflow-y:auto;overscroll-behavior:contain;padding:24px 22px 20px;border-radius:22px;background:#1D1D1F;color:#F5F5F7;box-shadow:0 24px 70px rgba(0,0,0,.4)}',
    '.aqk-dlg h2{margin:0 36px 6px 0;font-size:21px;font-weight:600;letter-spacing:-.025em}',
    '.aqk-dlg>p{margin:0 0 16px;font-size:14px;line-height:1.5;color:rgba(245,245,247,.75)}',
    '.aqk-cat{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;padding:14px 0;border-top:1px solid rgba(245,245,247,.12)}',
    '.aqk-cat b{display:block;font-size:15px;font-weight:600;margin-bottom:4px}',
    '.aqk-cat small{display:block;font-size:13px;line-height:1.45;color:rgba(245,245,247,.7)}',
    '.aqk-sw{position:relative;flex:none;width:48px;height:28px;margin-top:2px}',
    '.aqk-sw input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}',
    '.aqk-sw span{position:absolute;inset:0;border-radius:999px;background:rgba(245,245,247,.22);transition:background .2s;pointer-events:none}',
    '.aqk-sw span:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}',
    '.aqk-sw input:checked+span{background:#C9F15D}',
    '.aqk-sw input:checked+span:after{transform:translateX(20px);background:#1D1D1F}',
    '.aqk-sw input:disabled{cursor:default}',
    '.aqk-sw input:disabled+span{opacity:.55}',
    '.aqk-dlg .aqk-row{margin-top:16px}',
    '@media (max-width:560px){.aqk-bar{left:12px;right:12px;width:auto;max-width:none;bottom:calc(12px + env(safe-area-inset-bottom))}.aqk-ov{align-items:flex-end;padding:0}.aqk-dlg{border-radius:22px 22px 0 0;padding-bottom:calc(20px + env(safe-area-inset-bottom));max-height:92vh}}',
    '@media (prefers-reduced-motion:reduce){.aqk-bar,.aqk-ov{transition:none}}'
  ].join('\n');

  var root, ultimoFoco;

  function montar() {
    if (root) return;
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    root = document.createElement('div');
    root.className = 'aqk';
    var cats = CATS.map(function (c) {
      return '<div class="aqk-cat"><div><b id="aqk-t-' + c.id + '">' + c.t + '</b><small>' + c.d + '</small></div>' +
        '<label class="aqk-sw"><input type="checkbox" role="switch" data-cat="' + c.id + '" aria-labelledby="aqk-t-' + c.id + '"' + (c.fija ? ' checked disabled' : '') + '><span></span></label></div>';
    }).join('');
    root.innerHTML =
      '<section class="aqk-bar" role="region" aria-label="Aviso de cookies" hidden>' +
        '<button class="aqk-x" type="button" data-k="rechazar" aria-label="Cerrar y rechazar las opcionales">✕</button>' +
        '<h2>Tu privacidad</h2>' +
        '<p>Usamos almacenamiento propio para que la web funcione y, solo si lo aceptas, para recordar tus datos de contacto, medir de dónde llegan las visitas y cómo se usa la web, y mostrar mapas de Google. Puedes cambiarlo cuando quieras. <a href="cookies.html">Política de cookies</a></p>' +
        '<div class="aqk-row"><button class="aqk-b" type="button" data-k="rechazar">Rechazar</button><button class="aqk-b aqk-main" type="button" data-k="aceptar">Aceptar</button>' +
        '<button class="aqk-link" type="button" data-k="configurar">Configurar</button></div>' +
      '</section>' +
      '<div class="aqk-ov" aria-hidden="true" inert><section class="aqk-dlg" role="dialog" aria-modal="true" aria-labelledby="aqk-h">' +
        '<button class="aqk-x" type="button" data-k="cerrar" aria-label="Cerrar">✕</button>' +
        '<h2 id="aqk-h">Configurar cookies</h2>' +
        '<p>Elige qué permites. Las necesarias no guardan nada para seguirte. Más detalle en la <a href="cookies.html">política de cookies</a>.</p>' +
        cats +
        '<div class="aqk-row"><button class="aqk-b" type="button" data-k="rechazar">Rechazar todo</button><button class="aqk-b" type="button" data-k="guardar">Guardar selección</button><button class="aqk-b aqk-main" type="button" data-k="aceptar">Aceptar todo</button></div>' +
      '</section></div>';
    document.body.appendChild(root);

    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]');
      if (b) accion(b.getAttribute('data-k'));
      else if (e.target.classList.contains('aqk-ov')) accion(consent ? 'cerrar' : 'volver');
    });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('aqk-cfg')) accion(consent ? 'cerrar' : 'volver');
      if (e.key === 'Tab' && root.classList.contains('aqk-cfg')) atraparFoco(e);
    });
  }

  function atraparFoco(e) {
    var f = root.querySelectorAll('.aqk-dlg button, .aqk-dlg a, .aqk-dlg input:not([disabled])');
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }

  function accion(k) {
    if (k === 'aceptar') { guardar(todas(true)); ocultar(); }
    else if (k === 'rechazar') { guardar(todas(false)); ocultar(); }
    else if (k === 'guardar') {
      var elec = {};
      root.querySelectorAll('.aqk-dlg input[data-cat]').forEach(function (i) { elec[i.getAttribute('data-cat')] = i.checked; });
      guardar(elec); ocultar();
    }
    else if (k === 'configurar') abrir();
    else if (k === 'cerrar') ocultar();
    else if (k === 'volver') { cerrarCfg(); mostrarBarra(); }
  }

  function mostrarBarra() {
    var bar = root.querySelector('.aqk-bar');
    bar.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('aqk-show'); }); });
  }

  function cerrarCfg() {
    root.classList.remove('aqk-cfg');
    var ov = root.querySelector('.aqk-ov');
    ov.setAttribute('aria-hidden', 'true'); ov.setAttribute('inert', '');
  }

  function ocultar() {
    cerrarCfg();
    root.classList.remove('aqk-show');
    root.querySelector('.aqk-bar').hidden = true;
    if (ultimoFoco && ultimoFoco.focus) try { ultimoFoco.focus(); } catch (e) {}
    ultimoFoco = null;
  }

  function abrir() {
    montar();
    if (!ultimoFoco) ultimoFoco = document.activeElement;
    root.querySelectorAll('.aqk-dlg input[data-cat]').forEach(function (i) { i.checked = ok(i.getAttribute('data-cat')); });
    var ov = root.querySelector('.aqk-ov');
    ov.removeAttribute('inert'); ov.setAttribute('aria-hidden', 'false');
    root.classList.add('aqk-cfg');
    var x = root.querySelector('.aqk-dlg .aqk-x');
    setTimeout(function () { x.focus(); }, 30);
  }

  window.AQCookies = {
    ok: ok,
    permitir: function (cat) { var e = {}; OPCIONALES.forEach(function (c) { e[c] = ok(c); }); e[cat] = true; guardar(e); if (root) ocultar(); },
    abrir: abrir
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-aq-cookies]');
    if (t) { e.preventDefault(); ultimoFoco = t; abrir(); }
  });

  function init() {
    if (consent) { clarity(); return; }
    montar();
    mostrarBarra();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
