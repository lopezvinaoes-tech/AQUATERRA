// Moneda en la que se muestran los precios: USD (la de las fuentes), EUR o guaraníes (PYG).
// window.AQMoneda.actual() → 'USD' | 'EUR' | 'PYG'; .poner('EUR') la cambia y la recuerda en este navegador.
// .fmt(usd) devuelve el importe ya convertido y formateado; .fmtPyg(g) hace lo mismo desde guaraníes.
// .nota() explica el cambio usado y su fecha. Avisa de cada cambio con el evento 'aq-moneda' en window.
// El cambio es orientativo: se pide a open.er-api.com (y, si falla, a la API de monedas de jsDelivr)
// y se guarda 12 horas. Sin cambio disponible, los precios se quedan en USD.
(function () {
  if (window.AQMoneda) return;

  var KEY = 'aquaterra-moneda';
  var KEY_T = 'aquaterra-cambio';
  var DOCE_H = 12 * 3600 * 1000;
  var LISTA = ['USD', 'EUR', 'PYG'];
  var cur = 'USD';
  var tasas = null; // { EUR: euros por dólar, PYG: guaraníes por dólar, fecha: Date, fuente: '' }

  try { var g = localStorage.getItem(KEY); if (LISTA.indexOf(g) !== -1) cur = g; } catch (e) {}
  try {
    var t = JSON.parse(localStorage.getItem(KEY_T) || 'null');
    if (t && t.EUR && t.PYG && Date.now() - t.guardado < DOCE_H) tasas = { EUR: t.EUR, PYG: t.PYG, fecha: new Date(t.fecha), fuente: t.fuente };
  } catch (e) {}

  function avisar() { try { window.dispatchEvent(new Event('aq-moneda')); } catch (e) {} }

  function guardar(eur, pyg, fecha, fuente) {
    if (!(eur > 0) || !(pyg > 0)) return false;
    tasas = { EUR: eur, PYG: pyg, fecha: fecha, fuente: fuente };
    try { localStorage.setItem(KEY_T, JSON.stringify({ EUR: eur, PYG: pyg, fecha: fecha.toISOString(), fuente: fuente, guardado: Date.now() })); } catch (e) {}
    avisar();
    return true;
  }

  function pedir() {
    if (!window.fetch) return;
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.rates && guardar(j.rates.EUR, j.rates.PYG, new Date((j.time_last_update_unix || 0) * 1000 || Date.now()), 'ExchangeRate-API')) return;
        throw new Error('sin datos');
      })
      .catch(function () {
        return fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j && j.usd) guardar(j.usd.eur, j.usd.pyg, j.date ? new Date(j.date + 'T12:00:00Z') : new Date(), 'Currency API'); });
      })
      .catch(function () {});
  }
  if (!tasas) pedir();

  function miles(n, loc) { return Math.round(n).toLocaleString(loc || 'es-PY'); }

  // Moneda que se puede mostrar ahora mismo: la elegida si ya hay cambio, si no USD.
  function efectiva() { return cur !== 'USD' && !tasas ? 'USD' : cur; }

  function fmt(usd, aprox) {
    if (usd == null || isNaN(usd)) return '';
    var c = efectiva();
    var pre = aprox || c !== 'USD' ? '≈ ' : '';
    if (c === 'EUR') return pre + miles(usd * tasas.EUR, 'es-ES') + ' €';
    if (c === 'PYG') { var g = usd * tasas.PYG, paso = g >= 1e7 ? 1e5 : 1e3; return pre + 'G. ' + miles(Math.round(g / paso) * paso); }
    return (aprox ? '≈ ' : '') + 'USD ' + miles(usd);
  }

  // Precios publicados en guaraníes: se muestran tal cual en PYG y convertidos en USD o EUR.
  function fmtPyg(g) {
    var c = efectiva();
    if (c === 'PYG' || !tasas) return 'G. ' + miles(g);
    var usd = g / tasas.PYG;
    return c === 'EUR' ? '≈ ' + miles(usd * tasas.EUR, 'es-ES') + ' €' : '≈ USD ' + miles(usd);
  }

  function nota() {
    var c = efectiva();
    if (cur !== 'USD' && !tasas) return 'Cargando el tipo de cambio… mientras tanto, los precios se muestran en USD.';
    if (c === 'USD') return 'Precios en dólares, como los publica cada fuente.';
    var d = tasas.fecha;
    var fecha = d && !isNaN(d) ? d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'hoy';
    var par = c === 'EUR' ? '1 USD = ' + tasas.EUR.toLocaleString('es-ES', { maximumFractionDigits: 4 }) + ' €' : '1 USD = G. ' + miles(tasas.PYG);
    return 'Convertido desde USD al cambio orientativo del ' + fecha + ' (' + par + '). Tu banco aplicará el suyo.';
  }

  // Precio de entrada de un proyecto de window.PROYECTOS en la moneda elegida, o '' si no publica uno vigente.
  function precio(p) {
    if (p.precio) return fmt(p.precio);
    if (p.precioPyg) return fmtPyg(p.precioPyg);
    return p.precioTxt || '';
  }

  // Último precio publicado (precioPub) como referencia, p. ej. 'Lotes desde ≈ 64.000 €'.
  function precioPub(p) {
    var r = p.precioPub;
    if (!r) return '';
    var v = fmt(r.usd);
    if (r.hasta) v += '–' + fmt(r.hasta).replace(/^≈ /, '').replace(/^(USD|G.) /, '');
    return (r.pre || '') + v + (r.suf || '');
  }

  window.AQMoneda = {
    precio: precio,
    precioPub: precioPub,
    LISTA: LISTA,
    actual: function () { return cur; },
    efectiva: efectiva,
    poner: function (c) {
      if (LISTA.indexOf(c) === -1 || c === cur) return;
      cur = c;
      try { localStorage.setItem(KEY, c); } catch (e) {}
      if (c !== 'USD' && !tasas) pedir();
      avisar();
    },
    tasas: function () { return tasas; },
    fmt: fmt,
    fmtPyg: fmtPyg,
    nota: nota
  };
  avisar();
})();
