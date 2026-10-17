// Envío de leads desde la web. El formulario solo tiene que llamar:
//   window.enviarLead({ nombre, email, whatsapp, monto, objetivo, mensaje, proyecto })
// Devuelve una promesa: { ok: true } o lanza un Error con un mensaje para mostrar.
// Agrega por su cuenta la página, el referrer y los utm_* de la visita.
(function () {
  var KEY = 'aquaterra-utm';
  var utm = {};
  try {
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { if (q.get(k)) utm[k] = q.get(k); });
    if (Object.keys(utm).length) sessionStorage.setItem(KEY, JSON.stringify(utm));
    else utm = JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch (e) {}

  window.enviarLead = function (datos) {
    var body = Object.assign({}, utm, {
      pagina: location.pathname + location.search,
      referrer: document.referrer || null
    }, datos || {});
    return fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) throw new Error(j.error || 'No pudimos enviar tu solicitud. Escríbenos por WhatsApp.');
          return j;
        });
      });
  };
})();
