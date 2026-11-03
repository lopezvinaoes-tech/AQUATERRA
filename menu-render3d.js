// Desplegable «Render 3D» del menú (escritorio y móvil), el mismo en todas las páginas.
// El enlace del menú no lleva a la página: abre una lista de opciones y cada opción abre
// la página del render en su pestaña (#ejemplo abre directamente la casa de ejemplo en 3D).
// El panel vive fuera de la app de React, así que los repintados de la página no lo tocan.
(function () {
  var PAGE = 'Aquaterra%20Render%203D.dc.html';
  var OPCIONES = [
    ['ejemplo', 'Ver un ejemplo en 3D', 'Una casa ya amueblada para recorrer'],
    ['subir', 'Subir mi plano', 'Archivo .json, imagen para calcar o modelo .glb'],
    ['crear', 'Dibujar un plano', 'Estancias sobre una cuadrícula de 1 m'],
    ['plantillas', 'Plantillas', 'Casa, departamento y loft listos para editar'],
    ['estandares', 'Estándares de subida', 'Formatos, medidas y reglas del plano']
  ];
  var SEL = 'a[href*="Render%203D.dc.html"]';
  var panel = null, ancla = null;

  function esDelMenu(a) { return a.hasAttribute('data-nav') || !!a.closest('[data-aq-menu]'); }
  function noche(a) { var t = a.closest('[data-theme]'); return t ? t.getAttribute('data-theme') === 'noche' : document.documentElement.getAttribute('data-modo') === 'noche'; }

  function estilos() {
    if (document.getElementById('aq-r3d-menu-css')) return;
    var s = document.createElement('style');
    s.id = 'aq-r3d-menu-css';
    s.textContent =
      SEL.replace(']', '][data-nav]') + '{display:inline-flex;align-items:center;gap:4px}' +
      SEL.replace(']', '][data-nav]') + ' .aq-r3d-car{display:inline-block;width:7px;height:7px;margin-top:-3px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);transition:transform .25s;opacity:.7}' +
      SEL.replace(']', '][data-nav][aria-expanded="true"]') + ' .aq-r3d-car{transform:translateY(3px) rotate(225deg)}' +
      '#aq-r3d-menu{position:fixed;z-index:120;width:min(340px,calc(100vw - 24px));padding:8px;border-radius:18px;display:flex;flex-direction:column;gap:2px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Helvetica,sans-serif;backdrop-filter:saturate(180%) blur(24px);-webkit-backdrop-filter:saturate(180%) blur(24px);opacity:0;transform:translateY(-6px) scale(.98);transform-origin:top center;transition:opacity .18s,transform .22s cubic-bezier(.16,1,.3,1)}' +
      '#aq-r3d-menu[data-in]{opacity:1;transform:none}' +
      '#aq-r3d-menu a{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:12px;text-decoration:none;color:inherit}' +
      '#aq-r3d-menu a b{font-size:15px;font-weight:600;letter-spacing:-0.01em}' +
      '#aq-r3d-menu a span{font-size:13px;opacity:.68}' +
      '#aq-r3d-menu .aq-r3d-k{display:flex;align-items:center;gap:8px;padding:6px 12px 4px;font:600 11px/1.3 "JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.05em;text-transform:uppercase;opacity:.75}' +
      '#aq-r3d-menu .aq-r3d-k::before{content:"";width:7px;height:7px;border-radius:1.5px;background:#C9F15D;transform:rotate(45deg)}' +
      '@media (prefers-reduced-motion:reduce){#aq-r3d-menu{transition:none}}';
    document.head.appendChild(s);
  }

  // Flecha del desplegable en el enlace de escritorio (se repone si React repinta el enlace).
  function flechas() {
    document.querySelectorAll(SEL).forEach(function (a) {
      if (!esDelMenu(a)) return;
      a.setAttribute('aria-haspopup', 'menu');
      if (!a.hasAttribute('aria-expanded')) a.setAttribute('aria-expanded', 'false');
      if (a.hasAttribute('data-nav') && !a.querySelector('.aq-r3d-car')) {
        var c = document.createElement('span'); c.className = 'aq-r3d-car'; c.setAttribute('aria-hidden', 'true'); a.appendChild(c);
      }
    });
  }

  function cerrar() {
    if (!panel) return;
    var p = panel; panel = null;
    if (ancla) ancla.setAttribute('aria-expanded', 'false');
    ancla = null;
    p.removeAttribute('data-in');
    setTimeout(function () { p.remove(); }, 200);
  }

  function abrir(a) {
    cerrar();
    var n = noche(a), r = a.getBoundingClientRect(), movil = !a.hasAttribute('data-nav');
    var p = document.createElement('div');
    p.id = 'aq-r3d-menu';
    p.setAttribute('role', 'menu');
    p.setAttribute('aria-label', 'Render 3D');
    p.style.background = n ? 'rgba(33,35,41,0.96)' : 'rgba(255,255,255,0.96)';
    p.style.color = n ? '#ECECEE' : '#1D1D1F';
    p.style.boxShadow = n ? 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 24px 60px -20px rgba(0,0,0,0.6)' : '0 0 0 1px rgba(0,0,0,0.06), 0 24px 60px -20px rgba(0,0,0,0.3)';
    var hover = n ? 'rgba(150,152,160,0.20)' : 'rgba(118,118,128,0.12)';
    p.innerHTML = '<span class="aq-r3d-k">Render 3D de planos</span>';
    OPCIONES.forEach(function (o) {
      var l = document.createElement('a');
      l.href = PAGE + '#' + o[0];
      l.setAttribute('role', 'menuitem');
      l.innerHTML = '<b></b><span></span>';
      l.firstChild.textContent = o[1]; l.lastChild.textContent = o[2];
      l.addEventListener('mouseenter', function () { l.style.background = hover; });
      l.addEventListener('mouseleave', function () { l.style.background = ''; });
      l.addEventListener('focus', function () { l.style.background = hover; });
      l.addEventListener('blur', function () { l.style.background = ''; });
      // En la propia página del render basta con cambiar de pestaña (o abrir el ejemplo).
      l.addEventListener('click', function () { cerrar(); var m = document.querySelector('[data-aq-menu]'); if (m) { var b = document.querySelector('button[aria-label="Menú"]'); if (b) b.click(); } });
      p.appendChild(l);
    });
    document.body.appendChild(p);
    var w = p.offsetWidth, vw = document.documentElement.clientWidth;
    var left = movil ? 12 : Math.max(12, Math.min(vw - w - 12, r.left + r.width / 2 - w / 2));
    var top = movil ? Math.min(r.bottom + 6, window.innerHeight - p.offsetHeight - 12) : r.bottom + 14;
    p.style.left = left + 'px'; p.style.top = Math.max(12, top) + 'px';
    requestAnimationFrame(function () { p.setAttribute('data-in', ''); });
    panel = p; ancla = a;
    a.setAttribute('aria-expanded', 'true');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest(SEL);
    if (a && esDelMenu(a)) {
      e.preventDefault(); e.stopPropagation();
      if (panel && ancla === a) cerrar(); else abrir(a);
      return;
    }
    if (panel && !panel.contains(e.target)) cerrar();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (!panel) {
      var a = document.activeElement;
      if (a && a.matches && a.matches(SEL) && esDelMenu(a) && (e.key === 'ArrowDown')) { e.preventDefault(); abrir(a); var f = panel && panel.querySelector('a'); if (f) f.focus(); }
      return;
    }
    var items = Array.prototype.slice.call(panel.querySelectorAll('a')), i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { var back = ancla; e.stopPropagation(); cerrar(); if (back) back.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
    else if (e.key === 'Tab' && (i === items.length - 1 && !e.shiftKey || i === 0 && e.shiftKey)) cerrar();
  }, true);
  window.addEventListener('resize', cerrar);
  window.addEventListener('scroll', function () { if (ancla && ancla.hasAttribute('data-nav')) cerrar(); }, { passive: true });

  estilos();
  var pend = 0;
  new MutationObserver(function () { if (pend) return; pend = requestAnimationFrame(function () { pend = 0; flechas(); }); }).observe(document.documentElement, { childList: true, subtree: true });
  flechas();
})();
