// Envío de leads desde la web. El formulario solo tiene que llamar:
//   window.enviarLead({ nombre, email, whatsapp, monto, objetivo, mensaje, proyecto })
// Devuelve una promesa: { ok: true } o lanza un Error con un mensaje para mostrar.
// Agrega por su cuenta la página, el referrer y los utm_* de la visita.
// Recuerda en este navegador el nombre y contacto enviados: window.contactoGuardado() los devuelve
// para precompletar otros formularios (y que el servidor sume todo al mismo perfil de lead).
// Respeta el aviso de cookies (cookies.js): los utm solo se guardan entre páginas con permiso de
// 'medicion' y el contacto solo se recuerda con permiso de 'preferencias'.
(function () {
  function permite(cat) { return !!(window.AQCookies && window.AQCookies.ok(cat)); }
  var KEY = 'aquaterra-utm';
  var utm = {};
  try {
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { if (q.get(k)) utm[k] = q.get(k); });
    if (Object.keys(utm).length) { if (permite('medicion')) sessionStorage.setItem(KEY, JSON.stringify(utm)); }
    else if (permite('medicion')) utm = JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch (e) {}
  // Si acepta la medición estando ya en la página, se guardan los utm con los que llegó.
  window.addEventListener('aq-consent', function () {
    try { if (permite('medicion') && Object.keys(utm).length) sessionStorage.setItem(KEY, JSON.stringify(utm)); } catch (e) {}
  });

  var CKEY = 'aquaterra-contacto';
  window.contactoGuardado = function () {
    if (!permite('preferencias')) return {};
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
          if (!r.ok) throw new Error(j.error || 'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.');
          if (permite('preferencias')) try {
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
