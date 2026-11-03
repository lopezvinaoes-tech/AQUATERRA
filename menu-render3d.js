// Ventana emergente «Render 3D» del menú (escritorio y móvil), la misma en todas las páginas.
// El enlace del menú no lleva a la página: abre una ventana con las opciones y cada opción
// abre la página del render en su pestaña (#ejemplo abre directamente la casa de ejemplo en 3D).
// La ventana vive fuera de la app de React, así que los repintados de la página no la tocan.
(function () {
  var PAGE = 'Aquaterra%20Render%203D.dc.html';
  var ICO = {
    ejemplo: '<path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path><path d="M10 21v-6h4v6"></path>',
    subir: '<path d="M12 15V3"></path><path d="m7 8 5-5 5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>',
    crear: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path>',
    plantillas: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>',
    estandares: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6"></path><path d="M8 13h8M8 17h5"></path>'
  };
  var OPCIONES = [
    ['ejemplo', 'Ver un ejemplo en 3D', 'Una casa ya amueblada para recorrer por dentro.'],
    ['subir', 'Subir mi plano', 'Archivo .json, imagen del plano para calcar o modelo .glb.'],
    ['crear', 'Dibujar un plano', 'Traza las estancias sobre una cuadrícula de 1 m.'],
    ['plantillas', 'Plantillas', 'Casa, departamento y loft listos para editar.'],
    ['estandares', 'Estándares de subida', 'Formatos, medidas y reglas del plano.']
  ];
  var SEL = 'a[href*="Render%203D.dc.html"]';
  var raiz = null, origen = null;

  function esDelMenu(a) { return a.hasAttribute('data-nav') || !!a.closest('[data-aq-menu]'); }
  function noche(a) { var t = a && a.closest('[data-theme]'); return t ? t.getAttribute('data-theme') === 'noche' : document.documentElement.getAttribute('data-modo') === 'noche'; }

  function estilos() {
    if (document.getElementById('aq-r3d-css')) return;
    var s = document.createElement('style');
    s.id = 'aq-r3d-css';
    s.textContent =
      '#aq-r3d{position:fixed;inset:0;z-index:150;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Helvetica,sans-serif}' +
      '#aq-r3d .aq-r3d-fondo{position:absolute;inset:0;background:rgba(10,11,14,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity .25s}' +
      '#aq-r3d .aq-r3d-caja{position:relative;width:min(640px,100%);max-height:100%;overflow:auto;overscroll-behavior:contain;box-sizing:border-box;padding:clamp(22px,4vw,32px);border-radius:24px;display:flex;flex-direction:column;gap:18px;opacity:0;transform:translateY(16px) scale(.97);transition:opacity .25s,transform .35s cubic-bezier(.16,1,.3,1)}' +
      '#aq-r3d[data-in] .aq-r3d-fondo,#aq-r3d[data-in] .aq-r3d-caja{opacity:1;transform:none}' +
      '#aq-r3d .aq-r3d-k{align-self:flex-start;display:inline-flex;align-items:center;gap:9px;padding:6px 14px 6px 12px;border-radius:999px;font:600 12px/1.3 "JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.05em;text-transform:uppercase}' +
      '#aq-r3d .aq-r3d-k::before{content:"";width:7px;height:7px;border-radius:1.5px;background:#C9F15D;transform:rotate(45deg)}' +
      '#aq-r3d h2{margin:0;font-size:clamp(26px,3.4vw,34px);line-height:1.08;letter-spacing:-0.03em;font-weight:700;text-wrap:balance}' +
      '#aq-r3d h2 em{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-0.01em;color:#86868B}' +
      '#aq-r3d p{margin:0;font-size:16px;line-height:1.5;opacity:.75}' +
      '#aq-r3d .aq-r3d-lista{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:10px}' +
      '#aq-r3d .aq-r3d-op{display:flex;gap:14px;align-items:flex-start;padding:16px;border-radius:16px;text-decoration:none;color:inherit;transition:background .2s,transform .2s,box-shadow .2s}' +
      '#aq-r3d .aq-r3d-op:hover,#aq-r3d .aq-r3d-op:focus-visible{transform:translateY(-1px)}' +
      '#aq-r3d .aq-r3d-op:focus-visible{outline:2px solid #C9F15D;outline-offset:2px}' +
      '#aq-r3d .aq-r3d-ic{flex:none;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center}' +
      '#aq-r3d .aq-r3d-op b{display:block;font-size:16px;font-weight:600;letter-spacing:-0.01em}' +
      '#aq-r3d .aq-r3d-op span.t{display:block;margin-top:3px;font-size:14px;line-height:1.4;opacity:.7}' +
      '#aq-r3d .aq-r3d-op[data-dest]{grid-column:1 / -1}' +
      '#aq-r3d .aq-r3d-x{position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;color:inherit}' +
      '@media (prefers-reduced-motion:reduce){#aq-r3d .aq-r3d-fondo,#aq-r3d .aq-r3d-caja{transition:none}}';
    document.head.appendChild(s);
  }

  function marcar() {
    document.querySelectorAll(SEL).forEach(function (a) { if (esDelMenu(a) && a.getAttribute('aria-haspopup') !== 'dialog') a.setAttribute('aria-haspopup', 'dialog'); });
  }

  function cerrar(volver) {
    if (!raiz) return;
    var r = raiz, o = origen; raiz = null; origen = null;
    r.removeAttribute('data-in');
    document.documentElement.style.overflow = r._ov || '';
    setTimeout(function () { r.remove(); }, 260);
    if (volver && o && document.contains(o)) o.focus();
  }

  function abrir(a) {
    cerrar();
    var n = noche(a);
    var c = {
      caja: n ? '#212329' : '#FFFFFF', ink: n ? '#ECECEE' : '#1D1D1F',
      sombra: n ? 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 40px 90px -30px rgba(0,0,0,0.7)' : '0 40px 90px -30px rgba(0,0,0,0.45)',
      op: n ? 'rgba(150,152,160,0.14)' : '#F5F5F7', opH: n ? 'rgba(150,152,160,0.24)' : '#ECECF0',
      dest: n ? 'rgba(201,241,93,0.14)' : 'rgba(201,241,93,0.28)', destH: n ? 'rgba(201,241,93,0.22)' : 'rgba(201,241,93,0.4)',
      ic: n ? 'rgba(255,255,255,0.08)' : '#FFFFFF', icInk: n ? '#C9F15D' : '#3F6206',
      k: n ? 'rgba(201,241,93,0.14)' : 'rgba(201,241,93,0.22)', kInk: n ? '#E4F7B0' : '#3F5A06', kLine: n ? 'rgba(201,241,93,0.38)' : 'rgba(120,160,20,0.3)',
      x: n ? 'rgba(150,152,160,0.20)' : 'rgba(118,118,128,0.12)'
    };
    var r = document.createElement('div');
    r.id = 'aq-r3d';
    r.innerHTML =
      '<div class="aq-r3d-fondo" data-cerrar=""></div>' +
      '<div class="aq-r3d-caja" role="dialog" aria-modal="true" aria-labelledby="aq-r3d-t" aria-describedby="aq-r3d-d">' +
      '<button type="button" class="aq-r3d-x" data-cerrar="" aria-label="Cerrar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg></button>' +
      '<span class="aq-r3d-k">Render 3D</span>' +
      '<h2 id="aq-r3d-t">Tu plano, <em>en 3D.</em></h2>' +
      '<p id="aq-r3d-d">Elige cómo quieres empezar. Levantamos los muros, las puertas y los muebles y lo recorres desde el navegador.</p>' +
      '<div class="aq-r3d-lista"></div></div>';
    var caja = r.querySelector('.aq-r3d-caja'), lista = r.querySelector('.aq-r3d-lista');
    caja.style.background = c.caja; caja.style.color = c.ink; caja.style.boxShadow = c.sombra;
    var k = r.querySelector('.aq-r3d-k'); k.style.background = c.k; k.style.color = c.kInk; k.style.border = '1px solid ' + c.kLine;
    r.querySelector('.aq-r3d-x').style.background = c.x;
    OPCIONES.forEach(function (o, i) {
      var l = document.createElement('a'), dest = i === 0, bg = dest ? c.dest : c.op, bgH = dest ? c.destH : c.opH;
      l.className = 'aq-r3d-op';
      if (dest) l.setAttribute('data-dest', '');
      l.href = PAGE + '#' + o[0];
      l.innerHTML = '<span class="aq-r3d-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[o[0]] + '</svg></span><span><b></b><span class="t"></span></span>';
      l.querySelector('b').textContent = o[1]; l.querySelector('.t').textContent = o[2];
      var ic = l.querySelector('.aq-r3d-ic'); ic.style.background = c.ic; ic.style.color = c.icInk;
      l.style.background = bg;
      l.addEventListener('mouseenter', function () { l.style.background = bgH; });
      l.addEventListener('mouseleave', function () { l.style.background = bg; });
      l.addEventListener('focus', function () { l.style.background = bgH; });
      l.addEventListener('blur', function () { l.style.background = bg; });
      // En la propia página del render el enlace solo cambia el #: se cierra la ventana y cambia de pestaña.
      l.addEventListener('click', function () { cerrar(); });
      lista.appendChild(l);
    });
    r.addEventListener('click', function (e) { if (e.target.closest('[data-cerrar]')) cerrar(true); });
    // Si se abrió desde el menú del móvil, se cierra ese menú para dejar sola la ventana.
    if (a.closest('[data-aq-menu]')) { var b = document.querySelector('button[aria-label="Menú"]'); if (b) b.click(); }
    r._ov = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.appendChild(r);
    raiz = r; origen = a.hasAttribute('data-nav') ? a : null;
    requestAnimationFrame(function () { r.setAttribute('data-in', ''); var f = r.querySelector('.aq-r3d-op'); if (f) f.focus({ preventScroll: true }); });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest(SEL);
    if (a && esDelMenu(a) && !(raiz && raiz.contains(a))) { e.preventDefault(); e.stopPropagation(); abrir(a); }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (!raiz) return;
    if (e.key === 'Escape') { e.stopPropagation(); cerrar(true); return; }
    if (e.key !== 'Tab') return;
    // El foco no sale de la ventana mientras está abierta.
    var f = Array.prototype.slice.call(raiz.querySelectorAll('a,button')), i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  }, true);

  estilos();
  var pend = 0;
  new MutationObserver(function () { if (pend) return; pend = requestAnimationFrame(function () { pend = 0; marcar(); }); }).observe(document.documentElement, { childList: true, subtree: true });
  marcar();
})();
