// Descargar la ficha en PDF: abre el diálogo de impresión del navegador ("Guardar como PDF")
// con una versión limpia de la página: sin menú, barras fijas, chat ni formulario.
// Uso: window.AQFichaPDF({ titulo: 'Nombre del proyecto' }).
(function () {
  if (window.AQFichaPDF) return;

  var css = [
    '#aq-print-head{display:none}',
    '@media print{',
    '@page{size:A4;margin:14mm 12mm}',
    'html,body{background:#FFFFFF!important}',
    '*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;animation:none!important;transition:none!important}',
    'header,footer,iframe,.aqc,#aq-comparar,#aq-alertas,#aq-progress,#aq-cursor,#aq-intro,a[href="Aquaterra%20Proyectos.dc.html"],[data-screen-label="04 Consulta"],[data-screen-label="05 Otros proyectos"],[data-noprint]{display:none!important}',
    '[style*="position:fixed"],[style*="position: fixed"]{display:none!important}',
    '[data-fx],[data-stagger]>*,[data-accent]{opacity:1!important;filter:none!important;transform:none!important;clip-path:none!important}',
    '[data-tilt]{transform:none!important}',
    '[data-theme]{min-height:0!important;background:#FFFFFF!important}',
    'html,body{cursor:auto!important}',
    'section,article{padding-top:0!important;padding-bottom:12px!important}',
    'section:first-of-type{padding-top:0!important}',
    'a{text-decoration:none!important}',
    'button{display:none!important}',
    'h1,h2,h3{break-after:avoid}',
    '#aq-print-head{display:flex!important;justify-content:space-between;align-items:baseline;gap:16px;padding:0 0 10px;margin:0 0 14px;border-bottom:1px solid #D2D2D7;font:12px/1.4 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Helvetica,sans-serif;color:#424245}',
    '#aq-print-head b{font-size:14px;color:#1D1D1F}',
    '}'
  ].join('');

  function cabecera(titulo) {
    var h = document.getElementById('aq-print-head');
    if (!h) {
      h = document.createElement('div');
      h.id = 'aq-print-head';
      document.body.insertBefore(h, document.body.firstChild);
    }
    var marca = (window.MARCA && window.MARCA.nombre) || 'Aquaterra';
    var fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    var url = location.href.replace(/^https?:\/\//, '');
    h.innerHTML = '';
    var a = document.createElement('span');
    a.innerHTML = '<b></b> · ficha de proyecto';
    a.firstChild.textContent = marca;
    var b = document.createElement('span');
    b.textContent = (titulo ? titulo + ' · ' : '') + fecha + ' · ' + url;
    h.appendChild(a);
    h.appendChild(b);
  }

  window.AQFichaPDF = function (opts) {
    opts = opts || {};
    if (!document.getElementById('aq-print-css')) {
      var st = document.createElement('style');
      st.id = 'aq-print-css';
      st.textContent = css;
      document.head.appendChild(st);
    }
    // Lo que todavía no apareció en pantalla está oculto por la animación de entrada: se muestra todo antes de imprimir.
    var sel = '[data-fx],[data-stagger],[data-accent][data-mark]';
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { el.setAttribute('data-in', ''); });
    cabecera(opts.titulo);
    var prev = document.title;
    if (opts.titulo) document.title = opts.titulo + ' | ' + ((window.MARCA && window.MARCA.nombre) || 'Aquaterra');
    var fin = function () { document.title = prev; window.removeEventListener('afterprint', fin); if (opts.despues) opts.despues(); };
    window.addEventListener('afterprint', fin);
    // Un respiro para que se apliquen los cambios (p. ej. pasar a modo día) antes de abrir el diálogo.
    setTimeout(function () { window.print(); }, 250);
  };
})();
