// Alertas de proyectos: el visitante deja su contacto y qué busca, y se guarda como lead
// (origen "Alerta de proyectos") para avisarle cuando entre un proyecto que encaje.
// Se incluye con <script src="./alertas.js" defer></script> después de leads.js.
// API: window.AQAlertas.abrir({ ciudad, tipo, monto, dorm }) con lo que ya eligió en los filtros.
(function () {
  if (window.AQAlertas) return;

  var CIUDADES = ['Asunción', 'San Bernardino', 'Hernandarias', 'Itauguá', 'Cualquier zona'];
  var TIPOS = ['Departamento', 'Barrio cerrado', 'Country', 'Casa', 'Lote', 'Cualquier tipo'];
  var MONTOS = ['Hasta USD 50.000', 'USD 50.000 – 100.000', 'USD 100.000 – 200.000', 'Más de USD 200.000'];
  var OBJS = ['Renta por alquiler', 'Revalorización', 'Vivienda propia', 'Aún no lo sé'];
  var root, ov, pn, abierto = false, enviando = false, enviado = false, error = '';
  var f = {};
  var P = function () { return window.AQPrefijos; };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function noche() {
    var t = document.querySelector('[data-theme]');
    return !!t && t.getAttribute('data-theme') === 'noche';
  }

  var css = [
    '.aqa-ov{position:fixed;inset:0;z-index:96;background:rgba(0,0,0,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:calc(20px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));overflow:auto;overscroll-behavior:contain;opacity:0;pointer-events:none;transition:opacity .25s}',
    '.aqa-ov[data-open]{opacity:1;pointer-events:auto}',
    '.aqa-pn{--bg:#FFFFFF;--ink:#1D1D1F;--mute:#6E6E73;--line:rgba(0,0,0,.12);--chip:rgba(118,118,128,.12);--field:#F5F5F7;--link:#0066CC;position:relative;width:100%;max-width:520px;margin:auto 0;background:var(--bg);color:var(--ink);border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.35);padding:clamp(22px,4vw,36px);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;transform:translateY(14px);transition:transform .35s cubic-bezier(.16,1,.3,1)}',
    '.aqa-ov[data-open] .aqa-pn{transform:none}',
    '.aqa-pn[data-noche]{--bg:#1C1C1E;--ink:#F5F5F7;--mute:#98989D;--line:rgba(255,255,255,.14);--chip:rgba(118,118,128,.24);--field:#2C2C2E;--link:#2997FF}',
    '.aqa-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px}',
    '.aqa-kick{display:block;font-size:13px;font-weight:600;color:var(--mute);margin-bottom:6px}',
    '.aqa-h{margin:0;font-size:clamp(26px,3.2vw,34px);line-height:1.06;letter-spacing:-0.03em;font-weight:700}',
    '.aqa-h em{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-0.01em;color:#86868B}',
    '.aqa-p{margin:0 0 18px;font-size:15px;line-height:1.5;color:var(--mute)}',
    '.aqa-cl{flex:0 0 auto;width:38px;height:38px;border:0;border-radius:50%;background:var(--chip);color:var(--ink);font-size:21px;line-height:1;cursor:pointer}',
    '.aqa-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '.aqa-l{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--mute);min-width:0}',
    '.aqa-l.full{grid-column:1/-1}',
    '.aqa-i{width:100%;height:46px;padding:0 14px;border-radius:12px;border:1px solid var(--line);background:var(--field);color:var(--ink);font-size:16px;font-weight:400;font-family:inherit;outline:none;-webkit-appearance:none;appearance:none}',
    '.aqa-tel{display:flex;gap:8px}',
    '.aqa-tel .aqa-i{flex:1;min-width:0}',
    '.aqa-pre{height:46px;padding:0 12px;border-radius:12px;border:1px solid var(--line);background:var(--field);color:var(--ink);font-size:15px;font-weight:400}',
    '.aqa-pre:focus-within{border-color:#C9F15D;box-shadow:0 0 0 3px rgba(201,241,93,.3)}',
    '.aqa-i:focus{border-color:#C9F15D;box-shadow:0 0 0 3px rgba(201,241,93,.3)}',
    'select.aqa-i{background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);background-position:calc(100% - 18px) 20px,calc(100% - 13px) 20px;background-size:5px 5px;background-repeat:no-repeat;padding-right:32px}',
    '.aqa-ck{grid-column:1/-1;display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.45;color:var(--mute);cursor:pointer}',
    '.aqa-ck input{width:18px;height:18px;margin:1px 0 0;flex:0 0 auto;accent-color:#0071E3}',
    '.aqa-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}',
    '.aqa-err{grid-column:1/-1;margin:0;font-size:14px;color:#D70015}',
    '.aqa-pn[data-noche] .aqa-err{color:#FF6961}',
    '.aqa-b{grid-column:1/-1;height:50px;border:0;border-radius:999px;background:#0071E3;color:#FFFFFF;font-size:17px;font-weight:500;cursor:pointer;font-family:inherit}',
    '.aqa-b:hover{background:#0077ED}',
    '.aqa-b:disabled{opacity:.5;cursor:default}',
    '.aqa-ok{display:flex;flex-direction:column;align-items:flex-start;gap:12px}',
    '.aqa-ok i{width:14px;height:14px;background:#C9F15D;transform:rotate(45deg);border-radius:2px}',
    '@media (max-width:480px){.aqa-g{grid-template-columns:1fr}.aqa-ov{align-items:flex-end;padding:0}.aqa-pn{margin:auto 0 0;border-radius:24px 24px 0 0;padding-bottom:calc(24px + env(safe-area-inset-bottom))}}'
  ].join('');

  function opts(list, v, vacio) {
    return (vacio ? '<option value="">' + esc(vacio) + '</option>' : '') +
      list.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
  }

  function html() {
    var hd = '<div class="aqa-hd"><div><span class="aqa-kick">Alertas</span><h2 class="aqa-h" id="aqa-title">Te avisamos <em>cuando llegue.</em></h2></div>' +
      '<button type="button" class="aqa-cl" data-act="cerrar" aria-label="Cerrar">×</button></div>';
    if (enviado) {
      return hd + '<div class="aqa-ok"><i aria-hidden="true"></i><p class="aqa-p" style="margin:0;color:inherit;font-size:17px">Listo, ' + esc(f.nombre.split(' ')[0]) + '. Cuando entre un proyecto que encaje con lo que buscas, te escribimos.</p>' +
        '<button type="button" class="aqa-b" data-act="cerrar" style="width:100%">Seguir viendo proyectos</button></div>';
    }
    return hd + '<p class="aqa-p">Cuéntanos qué buscas y te escribimos cuando entre un proyecto que encaje.</p>' +
      '<form class="aqa-g" novalidate>' +
      '<label class="aqa-l full">Nombre<input class="aqa-i" name="nombre" autocomplete="name" value="' + esc(f.nombre) + '" required></label>' +
      '<label class="aqa-l">Email<input class="aqa-i" name="email" type="email" inputmode="email" autocomplete="email" value="' + esc(f.email) + '"></label>' +
      '<label class="aqa-l">WhatsApp<span class="aqa-tel">' + (P() ? P().html({ name: 'pre', valor: f.pre, cls: 'aqa-pre' }) : '') +
      '<input class="aqa-i" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="Número" value="' + esc(f.whatsapp) + '"></span></label>' +
      '<label class="aqa-l">Zona<select class="aqa-i" name="ciudad">' + opts(CIUDADES, f.ciudad) + '</select></label>' +
      '<label class="aqa-l">Tipo<select class="aqa-i" name="tipo">' + opts(TIPOS, f.tipo) + '</select></label>' +
      '<label class="aqa-l">Presupuesto<select class="aqa-i" name="monto">' + opts(MONTOS, f.monto, 'Elige un rango') + '</select></label>' +
      '<label class="aqa-l">Objetivo<select class="aqa-i" name="objetivo">' + opts(OBJS, f.objetivo, 'Elige una opción') + '</select></label>' +
      '<input class="aqa-hp" name="empresa_web" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="aqa-ck"><input type="checkbox" name="consentimiento"' + (f.consentimiento ? ' checked' : '') + '><span>Acepto que me contacten por email o WhatsApp sobre proyectos que encajen con lo que busco. Puedo pedir la baja cuando quiera.</span></label>' +
      (error ? '<p class="aqa-err" role="alert">' + esc(error) + '</p>' : '') +
      '<button type="submit" class="aqa-b"' + (enviando ? ' disabled' : '') + '>' + (enviando ? 'Guardando…' : 'Activar alerta') + '</button>' +
      '</form>';
  }

  function render() {
    if (!pn) return;
    if (noche()) pn.setAttribute('data-noche', ''); else pn.removeAttribute('data-noche');
    pn.innerHTML = html();
  }

  function leerForm(form) {
    ['nombre', 'email', 'whatsapp', 'ciudad', 'tipo', 'monto', 'objetivo'].forEach(function (k) { f[k] = (form.elements[k].value || '').trim(); });
    if (form.elements.pre) f.pre = form.elements.pre.value;
    f.consentimiento = form.elements.consentimiento.checked;
    f.empresa_web = form.elements.empresa_web.value;
  }

  function validar() {
    if (f.nombre.length < 2) return 'Escribe tu nombre.';
    if (!f.email && f.whatsapp.replace(/\D/g, '').length < 6) return 'Déjanos un email o un WhatsApp para avisarte.';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return 'El email no parece válido.';
    if (f.whatsapp && f.whatsapp.replace(/\D/g, '').length < 6) return 'El WhatsApp no parece válido.';
    if (!f.consentimiento) return 'Marca la casilla para que podamos escribirte.';
    return '';
  }

  function enviar(form) {
    leerForm(form);
    error = validar();
    if (error) { render(); return; }
    if (typeof window.enviarLead !== 'function') { error = 'No pudimos guardar tu alerta. Inténtalo de nuevo en unos minutos.'; render(); return; }
    enviando = true; render();
    var busca = [
      'Zona: ' + f.ciudad,
      'Tipo: ' + f.tipo,
      f.monto ? 'Presupuesto: ' + f.monto : null,
      f.dorm ? 'Dormitorios: ' + f.dorm : null
    ].filter(Boolean).join(' · ');
    window.enviarLead({
      nombre: f.nombre, email: f.email || null, whatsapp: (P() ? P().unir(f.pre, f.whatsapp) : f.whatsapp) || null,
      monto: f.monto || null, objetivo: f.objetivo || null,
      mensaje: 'Quiere recibir avisos de proyectos nuevos. ' + busca,
      origen: 'Alerta de proyectos', consentimiento: true, empresa_web: f.empresa_web
    }).then(function () {
      enviando = false; enviado = true; render();
      if (window.gtag) try { window.gtag('event', 'generate_lead', { method: 'alerta_proyectos' }); } catch (e) {}
    }, function (e) {
      enviando = false; error = (e && e.message) || 'No pudimos guardar tu alerta. Intenta de nuevo.'; render();
    });
  }

  function abrir(pref) {
    pref = pref || {};
    if (!enviado) {
      f.ciudad = CIUDADES.indexOf(pref.ciudad) !== -1 ? pref.ciudad : (f.ciudad || 'Cualquier zona');
      f.tipo = TIPOS.indexOf(pref.tipo) !== -1 ? pref.tipo : (f.tipo || 'Cualquier tipo');
      if (MONTOS.indexOf(pref.monto) !== -1) f.monto = pref.monto;
      f.dorm = pref.dorm || '';
    }
    if (!f.nombre && !f.email && !f.whatsapp && typeof window.contactoGuardado === 'function') {
      var c = window.contactoGuardado();
      f.nombre = c.nombre || ''; f.email = c.email || ''; f.whatsapp = c.whatsapp || '';
      if (P() && f.whatsapp) { var t = P().separar(f.whatsapp); f.pre = t.c; f.whatsapp = t.num; }
    }
    abierto = true; error = '';
    render();
    ov.setAttribute('data-open', '');
    ov.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    var first = pn.querySelector('input[name=nombre]') || pn.querySelector('.aqa-cl');
    if (first && window.matchMedia('(min-width:561px)').matches) setTimeout(function () { first.focus(); }, 150);
  }
  function cerrar() {
    abierto = false;
    ov.removeAttribute('data-open');
    ov.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }

  function montar() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    root = document.createElement('div');
    root.id = 'aq-alertas';
    root.innerHTML = '<div class="aqa-ov" role="dialog" aria-modal="true" aria-labelledby="aqa-title" aria-hidden="true"><div class="aqa-pn"></div></div>';
    document.body.appendChild(root);
    ov = root.firstChild; pn = ov.firstChild;
    f = { nombre: '', email: '', whatsapp: '', ciudad: 'Cualquier zona', tipo: 'Cualquier tipo', monto: '', objetivo: '', dorm: '', consentimiento: false };
    root.addEventListener('click', function (e) {
      if (e.target === ov) { cerrar(); return; }
      var t = e.target.closest('[data-act]');
      if (t && t.getAttribute('data-act') === 'cerrar') cerrar();
    });
    root.addEventListener('submit', function (e) { e.preventDefault(); if (!enviando) enviar(e.target); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierto) cerrar(); });
  }

  window.AQAlertas = { abrir: function (p) { if (ov) abrir(p); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
