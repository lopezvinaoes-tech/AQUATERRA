// Prefijo telefónico para los campos de WhatsApp de todos los formularios.
//   AQPrefijos.lista            → [{ c: 'ES', n: 'España', p: '+34' }, …]
//   AQPrefijos.porDefecto()     → código de país sugerido (el último elegido, o según zona horaria e idioma).
//   AQPrefijos.unir('ES', '612 34 56 78') → '+34 612345678'. Si el número ya trae + o 00, se respeta tal cual.
//   AQPrefijos.separar('+595 981 123456') → { c: 'PY', num: '981123456' } (para precompletar).
//   AQPrefijos.corto('ES')      → '🇪🇸 +34' (lo que se ve con el selector cerrado).
//   AQPrefijos.html({ name, valor, cls }) → selector listo para formularios sin React; se actualiza solo.
//   AQPrefijos.recordar('ES')   → guarda la elección para el próximo formulario.
(function () {
  if (window.AQPrefijos) return;

  var lista = [
    ['ES', 'España', '+34'], ['PY', 'Paraguay', '+595'], ['AR', 'Argentina', '+54'], ['UY', 'Uruguay', '+598'],
    ['BR', 'Brasil', '+55'], ['CL', 'Chile', '+56'], ['BO', 'Bolivia', '+591'], ['PE', 'Perú', '+51'],
    ['CO', 'Colombia', '+57'], ['EC', 'Ecuador', '+593'], ['VE', 'Venezuela', '+58'], ['MX', 'México', '+52'],
    ['CR', 'Costa Rica', '+506'], ['PA', 'Panamá', '+507'], ['GT', 'Guatemala', '+502'], ['DO', 'República Dominicana', '+1'],
    ['CU', 'Cuba', '+53'], ['US', 'Estados Unidos', '+1'], ['CA', 'Canadá', '+1'], ['PT', 'Portugal', '+351'],
    ['AD', 'Andorra', '+376'], ['FR', 'Francia', '+33'], ['IT', 'Italia', '+39'], ['DE', 'Alemania', '+49'],
    ['GB', 'Reino Unido', '+44'], ['IE', 'Irlanda', '+353'], ['NL', 'Países Bajos', '+31'], ['BE', 'Bélgica', '+32'],
    ['CH', 'Suiza', '+41'], ['AT', 'Austria', '+43'], ['SE', 'Suecia', '+46'], ['NO', 'Noruega', '+47'],
    ['DK', 'Dinamarca', '+45'], ['PL', 'Polonia', '+48'], ['RO', 'Rumanía', '+40'], ['IL', 'Israel', '+972'],
    ['AE', 'Emiratos Árabes', '+971'], ['MA', 'Marruecos', '+212'], ['CN', 'China', '+86'], ['JP', 'Japón', '+81'],
    ['AU', 'Australia', '+61']
  ].map(function (x) { return { c: x[0], n: x[1], p: x[2] }; });
  var porCodigo = {};
  lista.forEach(function (x) { porCodigo[x.c] = x; });

  var KEY = 'aquaterra-prefijo';
  var ZONAS = { 'America/Asuncion': 'PY', 'Europe/Madrid': 'ES', 'Atlantic/Canary': 'ES', 'Africa/Ceuta': 'ES', 'America/Montevideo': 'UY',
    'America/Sao_Paulo': 'BR', 'America/Santiago': 'CL', 'America/La_Paz': 'BO', 'America/Lima': 'PE', 'America/Bogota': 'CO',
    'America/Mexico_City': 'MX', 'Europe/Lisbon': 'PT', 'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Rome': 'IT', 'Europe/Berlin': 'DE' };

  function bandera(c) {
    return String.fromCodePoint.apply(null, c.split('').map(function (l) { return 0x1F1E6 + l.charCodeAt(0) - 65; }));
  }

  // La sugerencia por zona horaria e idioma se calcula una sola vez (Intl es lento la primera vez y los formularios la piden varias).
  var sugerido = null;
  function porDefecto() {
    try { var g = localStorage.getItem(KEY); if (porCodigo[g]) return g; } catch (e) {}
    return sugerido || (sugerido = sugerir());
  }

  function sugerir() {
    try {
      var z = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (ZONAS[z]) return ZONAS[z];
      if (/^America\/(Argentina|Buenos_Aires|Cordoba|Mendoza)/.test(z)) return 'AR';
    } catch (e) {}
    var langs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var r = (String(langs[i]).split('-')[1] || '').toUpperCase();
      if (porCodigo[r]) return r;
    }
    return 'ES';
  }

  function recordar(c) {
    try { if (porCodigo[c]) localStorage.setItem(KEY, c); } catch (e) {}
  }

  function unir(c, num) {
    var s = String(num || '').trim();
    var d = s.replace(/\D/g, '');
    if (!d) return '';
    if (s.charAt(0) === '+') return '+' + d;
    if (/^00/.test(d)) return '+' + d.slice(2);
    var x = porCodigo[c] || porCodigo.ES;
    return x.p + ' ' + d.replace(/^0+/, '');
  }

  function separar(full) {
    var s = String(full || '').trim();
    var d = s.replace(/\D/g, '');
    var def = porDefecto();
    if (s.charAt(0) !== '+' && !/^00/.test(s)) return { c: def, num: s };
    if (/^00/.test(s)) d = d.slice(2);
    var mejor = null;
    lista.forEach(function (x) {
      var p = x.p.slice(1);
      if (d.indexOf(p) !== 0) return;
      if (!mejor || p.length > mejor.p.length - 1 || (p.length === mejor.p.length - 1 && x.c === def)) mejor = x;
    });
    return mejor ? { c: mejor.c, num: d.slice(mejor.p.length - 1) } : { c: def, num: s };
  }

  function corto(c) {
    var x = porCodigo[c] || porCodigo.ES;
    return bandera(x.c) + ' ' + x.p;
  }

  // Opciones para un <select> de React: [{ c, t }].
  var opciones = lista.map(function (x) { return { c: x.c, t: bandera(x.c) + ' ' + x.n + ' (' + x.p + ')' }; });

  // Con el selector cerrado se ve solo "🇪🇸 +34": el <select> real va encima, transparente, y abre la lista completa.
  var css = '.aqp{position:relative;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;cursor:pointer}' +
    '.aqp::after{content:"";width:6px;height:6px;margin-top:-3px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);opacity:.55}' +
    '.aqp>select{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px;border:0;color:#1D1D1F;background:#FFFFFF;-webkit-appearance:none;appearance:none}' +
    '.aqp:focus-within{outline:2px solid rgba(201,241,93,.6);outline-offset:2px}';
  function estilos() {
    if (document.getElementById('aqp-css') || !document.head) return;
    var st = document.createElement('style');
    st.id = 'aqp-css';
    st.textContent = css;
    document.head.appendChild(st);
  }
  estilos();
  if (!document.getElementById('aqp-css')) document.addEventListener('DOMContentLoaded', estilos);

  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }

  function html(o) {
    o = o || {};
    var v = porCodigo[o.valor] ? o.valor : porDefecto();
    return '<span class="aqp ' + esc(o.cls || '') + '"><span data-aqp-v>' + esc(corto(v)) + '</span>' +
      '<select name="' + esc(o.name || 'prefijo') + '" aria-label="Prefijo del teléfono" data-aqp>' +
      opciones.map(function (x) { return '<option value="' + x.c + '"' + (x.c === v ? ' selected' : '') + '>' + esc(x.t) + '</option>'; }).join('') +
      '</select></span>';
  }

  // Selectores creados con html(): actualizan su etiqueta y recuerdan la elección.
  document.addEventListener('change', function (e) {
    var sel = e.target;
    if (!sel || !sel.hasAttribute || !sel.hasAttribute('data-aqp')) return;
    var v = sel.parentNode && sel.parentNode.querySelector('[data-aqp-v]');
    if (v) v.textContent = corto(sel.value);
    recordar(sel.value);
  }, true);

  window.AQPrefijos = { lista: lista, opciones: opciones, porDefecto: porDefecto, recordar: recordar, unir: unir, separar: separar, corto: corto, html: html, bandera: bandera };
})();
