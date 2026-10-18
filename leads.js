// Envío de leads desde la web. El formulario solo tiene que llamar:
//   window.enviarLead({ nombre, email, whatsapp, monto, objetivo, mensaje, proyecto })
// Devuelve una promesa: { ok: true } o lanza un Error con un mensaje para mostrar.
// Agrega por su cuenta la página, el referrer y los utm_* de la visita.
// Recuerda en este navegador el nombre y contacto enviados: window.contactoGuardado() los devuelve
// para precompletar otros formularios (y que el servidor sume todo al mismo perfil de lead).
(function () {
  var KEY = 'aquaterra-utm';
  var utm = {};
  try {
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { if (q.get(k)) utm[k] = q.get(k); });
    if (Object.keys(utm).length) sessionStorage.setItem(KEY, JSON.stringify(utm));
    else utm = JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch (e) {}

  var CKEY = 'aquaterra-contacto';
  window.contactoGuardado = function () {
    try { return JSON.parse(localStorage.getItem(CKEY) || 'null') || {}; } catch (e) { return {}; }
  };

  window.enviarLead = function (datos) {
    var body = Object.assign({}, utm, {
      pagina: location.pathname + location.search,
      referrer: document.referrer || null
    }, datos || {});
    return fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) throw new Error(j.error || 'No pudimos enviar tu solicitud. Escríbenos por WhatsApp.');
          try {
            var prev = window.contactoGuardado();
            localStorage.setItem(CKEY, JSON.stringify({
              nombre: body.nombre || prev.nombre || '', email: body.email || prev.email || '', whatsapp: body.whatsapp || body.tel || prev.whatsapp || ''
            }));
          } catch (e) {}
          return j;
        });
      });
  };
})();
