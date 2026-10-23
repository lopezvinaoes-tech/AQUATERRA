// Formulario de asesoría en dos pasos, el mismo en toda la web.
//   Paso 1: monto y objetivo con botones grandes (sin datos personales).
//   Paso 2: nombre y WhatsApp.
// Se incluye con <script src="./asesoria.js" defer></script> después de leads.js y prefijos.js.
// API:
//   AQAsesoria.abrir({ origen, proyecto, monto, objetivo })  → ventana (en móvil, hoja desde abajo).
//   AQAsesoria.montar(el, { origen, proyecto })              → el mismo formulario dentro de un panel oscuro.
//   AQAsesoria.guia({ origen })                              → ventana de la guía gratuita en PDF (pide nombre y email).
// Los enlaces a index.html#asesoria o con data-asesoria abren la ventana sin salir de la página.
// Con data-barra en la etiqueta, en móvil aparece una barra fija abajo al pasar la primera pantalla.
(function () {
  if (window.AQAsesoria) return;

  var MONTOS = ['Hasta USD 50.000', 'USD 50.000 – 100.000', 'USD 100.000 – 250.000', 'Más de USD 250.000'];
  var OBJS = ['Renta por alquiler', 'Revalorización', 'Vivienda propia', 'Aún no lo sé'];
  var GUIA_PDF = '/guia-invertir-paraguay-desde-espana-2026.pdf';
  var script = document.currentScript;
  var conBarra = !!(script && script.hasAttribute('data-barra'));
  var P = function () { return window.AQPrefijos; };
  var marca = function () { return (window.MARCA && window.MARCA.nombre) || 'Aquaterra'; };
  var waNum = function () { return String((window.MARCA && window.MARCA.whatsapp) || '').replace(/\D/g, ''); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function noche() {
    var t = document.querySelector('[data-theme]');
    return !!t && t.getAttribute('data-theme') === 'noche';
  }
  function origenPorDefecto() {
    var t = (document.title.split('|')[0] || '').trim();
    return /index\.html$|\/$/.test(location.pathname) ? 'Agenda una asesoría' : 'Agenda una asesoría (' + t + ')';
  }

  var css = [
    '.aqf{--ink:#1D1D1F;--mute:#6E6E73;--line:rgba(0,0,0,.12);--field:#F5F5F7;--chip:rgba(118,118,128,.12);--chipInk:#1D1D1F;--on:#1D1D1F;--onInk:#FFFFFF;--btn:#0071E3;--btnInk:#FFFFFF;--link:#0066CC;--err:#D70015;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif}',
    '.aqf[data-noche]{--ink:#F5F5F7;--mute:#98989D;--line:rgba(255,255,255,.14);--field:#2C2C2E;--chip:rgba(118,118,128,.24);--chipInk:#F5F5F7;--on:#C9F15D;--onInk:#1D1D1F;--btn:#C9F15D;--btnInk:#1D1D1F;--link:#E4F7B0;--err:#FF6961}',
    '.aqf[data-oscuro]{--ink:#F5F5F7;--mute:rgba(245,245,247,.68);--line:rgba(245,245,247,.16);--field:rgba(255,255,255,.04);--chip:rgba(255,255,255,.06);--chipInk:#F5F5F7;--on:#C9F15D;--onInk:#1D1D1F;--btn:#C9F15D;--btnInk:#1D1D1F;--link:#E4F7B0;--err:#FF9F8F}',
    '.aqf-paso{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--mute);margin:0 0 14px}',
    '.aqf-paso i{flex:0 0 auto;display:block;width:44px;height:4px;border-radius:2px;background:var(--line);overflow:hidden;position:relative}',
    '.aqf-paso i:after{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--p,50%);background:#C9F15D;border-radius:2px;transition:width .3s}',
    '.aqf-q{margin:18px 0 10px;font-size:17px;font-weight:600;letter-spacing:-.01em}',
    '.aqf-q:first-of-type{margin-top:0}',
    '.aqf-ops{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.aqf-op{min-height:54px;padding:8px 14px;border-radius:14px;border:1px solid var(--line);background:var(--chip);color:var(--chipInk);font-size:15px;font-weight:500;line-height:1.25;text-align:left;cursor:pointer;font-family:inherit;transition:background .2s,color .2s,border-color .2s}',
    '.aqf-op:hover{border-color:var(--mute)}',
    '.aqf-op[aria-pressed="true"]{background:var(--on);color:var(--onInk);border-color:var(--on);font-weight:600}',
    '.aqf-res{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:0 0 16px;font-size:14px;color:var(--mute)}',
    '.aqf-res b{color:var(--ink);font-weight:600}',
    '.aqf-res button{padding:0;border:0;background:none;color:var(--link);font-size:14px;cursor:pointer;font-family:inherit;text-decoration:underline;text-underline-offset:2px}',
    '.aqf-g{display:flex;flex-direction:column;gap:12px}',
    '.aqf-l{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--mute);min-width:0}',
    '.aqf-i{width:100%;height:52px;padding:0 16px;border-radius:14px;border:1px solid var(--line);background:var(--field);color:var(--ink);font-size:16px;font-weight:400;font-family:inherit;outline:none;-webkit-appearance:none;appearance:none}',
    '.aqf-i::placeholder{color:var(--mute)}',
    '.aqf-tel{display:flex;gap:8px}',
    '.aqf-tel .aqf-i{flex:1;min-width:0}',
    '.aqf-pre{height:52px;padding:0 12px;border-radius:14px;border:1px solid var(--line);background:var(--field);color:var(--ink);font-size:15px;font-weight:400}',
    '.aqf-pre:focus-within,.aqf-i:focus{border-color:#C9F15D;box-shadow:0 0 0 3px rgba(201,241,93,.3)}',
    '.aqf-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}',
    '.aqf-ck{display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.45;color:var(--mute);cursor:pointer}',
    '.aqf-ck input{width:18px;height:18px;margin:1px 0 0;flex:0 0 auto;accent-color:#C9F15D}',
    '.aqf-err{margin:0;font-size:14px;color:var(--err)}',
    '.aqf-b{width:100%;height:56px;margin-top:18px;border:0;border-radius:999px;background:var(--btn);color:var(--btnInk);font-size:17px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s}',
    '.aqf-g .aqf-b{margin-top:6px}',
    '.aqf-b:hover{opacity:.9}',
    '.aqf-b:disabled{opacity:.4;cursor:default}',
    '.aqf-sin{margin:10px 0 0;text-align:center;font-size:13px;font-weight:500;color:var(--mute)}',
    '.aqf-legal{margin:10px 0 0;text-align:center;font-size:12px;line-height:1.5;color:var(--mute)}',
    '.aqf-legal a,.aqf-ok a{color:var(--link);text-decoration:underline;text-underline-offset:2px}',
    '.aqf-ok{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:8px 0}',
    '.aqf-ok>i{width:56px;height:56px;border-radius:50%;background:#C9F15D;color:#1D1D1F;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:24px;font-weight:700}',
    '.aqf-ok h3{margin:0;font-size:24px;letter-spacing:-.02em;font-weight:700}',
    '.aqf-ok p{margin:0;max-width:380px;font-size:15px;line-height:1.5;color:var(--mute)}',
    '.aqf-ok .aqf-b{display:flex;align-items:center;justify-content:center;text-decoration:none;color:var(--btnInk)}',
    '.aqf-ok .aqf-b2{background:transparent;color:var(--ink);border:1px solid var(--line);margin-top:4px}',
    '@media (max-width:420px){.aqf-op{font-size:14px;padding:8px 12px}}',
    // Ventana
    '.aqf-ov{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.42);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:calc(20px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));overflow:auto;overscroll-behavior:contain;opacity:0;pointer-events:none;transition:opacity .25s}',
    '.aqf-ov[data-open]{opacity:1;pointer-events:auto}',
    '.aqf-pn{position:relative;width:100%;max-width:540px;margin:auto 0;background:#FFFFFF;border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.35);padding:clamp(22px,4vw,36px);transform:translateY(14px);transition:transform .35s cubic-bezier(.16,1,.3,1)}',
    '.aqf-pn[data-noche]{background:#1C1C1E}',
    '.aqf-ov[data-open] .aqf-pn{transform:none}',
    '.aqf-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px}',
    '.aqf-h{margin:0;font-size:clamp(24px,3vw,30px);line-height:1.1;letter-spacing:-.03em;font-weight:700}',
    '.aqf-sub{margin:6px 0 0;font-size:15px;line-height:1.45;color:var(--mute)}',
    '.aqf-cl{flex:0 0 auto;width:38px;height:38px;border:0;border-radius:50%;background:var(--chip);color:var(--ink);font-size:21px;line-height:1;cursor:pointer}',
    '@media (max-width:560px){.aqf-ov{align-items:flex-end;padding:0}.aqf-pn{margin:auto 0 0;border-radius:24px 24px 0 0;padding-bottom:calc(24px + env(safe-area-inset-bottom));max-height:92vh;overflow:auto}}',
    // Barra fija en móvil
    '.aqf-bar{position:fixed;left:0;right:0;bottom:0;z-index:89;display:none;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:rgba(255,255,255,.86);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-top:1px solid rgba(0,0,0,.08);transform:translateY(110%);transition:transform .35s cubic-bezier(.16,1,.3,1)}',
    '.aqf-bar[data-noche]{background:rgba(28,28,30,.86);border-top-color:rgba(255,255,255,.1)}',
    '.aqf-bar[data-on]{transform:none}',
    '.aqf-bar a,.aqf-bar button{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;height:48px;border-radius:999px;border:0;font-size:16px;font-weight:600;font-family:inherit;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent}',
    '.aqf-bar button{background:#1D1D1F;color:#FFFFFF}',
    '.aqf-bar[data-noche] button{background:#C9F15D;color:#1D1D1F}',
    '.aqf-bar a{flex:0 0 auto;padding:0 18px;background:#25D366;color:#FFFFFF}',
    '@media (max-width:760px){.aqf-bar{display:flex}html.aqf-con-barra .aqc-btn{bottom:calc(88px + env(safe-area-inset-bottom))!important}}'
  ].join('');

  // ---------- Formulario de asesoría (una instancia por ventana o panel) ----------
  function Formulario(host, opts, alCerrar) {
    var f = { paso: 1, monto: '', objetivo: '', nombre: '', whatsapp: '', pre: P() ? P().porDefecto() : 'ES', empresa_web: '' };
    var enviando = false, enviado = false, error = '';
    this.reset = function (o) {
      opts = o || {};
      if (enviado) { enviado = false; f.paso = 1; f.monto = ''; f.objetivo = ''; }
      if (MONTOS.indexOf(opts.monto) !== -1) f.monto = opts.monto;
      if (OBJS.indexOf(opts.objetivo) !== -1) f.objetivo = opts.objetivo;
      f.paso = f.monto && f.objetivo && opts.monto ? 2 : 1;
      error = '';
      precompletar(); render();
    };
    function precompletar() {
      if (f.nombre || f.whatsapp || typeof window.contactoGuardado !== 'function') return;
      var c = window.contactoGuardado();
      f.nombre = c.nombre || '';
      if (c.whatsapp) { if (P()) { var t = P().separar(c.whatsapp); f.pre = t.c; f.whatsapp = t.num; } else f.whatsapp = c.whatsapp; }
    }
    function ops(lista, valor, campo) {
      return '<div class="aqf-ops" role="group">' + lista.map(function (o) {
        return '<button type="button" class="aqf-op" data-campo="' + campo + '" data-v="' + esc(o) + '" aria-pressed="' + (o === valor) + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
    }
    function html() {
      if (enviado) {
        var wa = waNum();
        return '<div class="aqf-ok" role="status"><i aria-hidden="true">✓</i><h3>¡Listo, ' + esc(f.nombre.split(' ')[0]) + '!</h3>' +
          '<p>Te escribiremos por WhatsApp en menos de 24 h para fijar el día y la hora de tu llamada gratuita.</p>' +
          '<p>Mientras tanto, llévate la guía gratuita <b>Cómo invertir en Paraguay desde España 2026</b>.</p>' +
          '<a class="aqf-b" href="' + GUIA_PDF + '" download data-guia-directa>Descargar la guía (PDF)</a>' +
          (wa ? '<a class="aqf-b aqf-b2" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">Escribirnos ya por WhatsApp</a>' : '') +
          '</div>';
      }
      if (f.paso === 1) {
        return '<p class="aqf-paso"><i style="--p:50%"></i>Paso 1 de 2</p>' +
          '<p class="aqf-q">¿Cuánto te gustaría invertir?</p>' + ops(MONTOS, f.monto, 'monto') +
          '<p class="aqf-q">¿Qué buscas con la inversión?</p>' + ops(OBJS, f.objetivo, 'objetivo') +
          '<button type="button" class="aqf-b" data-act="seguir"' + (f.monto && f.objetivo ? '' : ' disabled') + '>Continuar ›</button>' +
          '<p class="aqf-sin">Sin compromiso · Respondemos en menos de 24 h · Horario de España</p>';
      }
      return '<p class="aqf-paso"><i style="--p:100%"></i>Paso 2 de 2</p>' +
        '<p class="aqf-res"><span><b>' + esc(f.monto) + '</b> · <b>' + esc(f.objetivo) + '</b></span><button type="button" data-act="volver">Cambiar</button></p>' +
        '<form class="aqf-g" novalidate>' +
        '<label class="aqf-l">Nombre<input class="aqf-i" name="nombre" autocomplete="name" placeholder="Tu nombre" value="' + esc(f.nombre) + '"></label>' +
        '<label class="aqf-l">WhatsApp<span class="aqf-tel">' + (P() ? P().html({ name: 'pre', valor: f.pre, cls: 'aqf-pre' }) : '') +
        '<input class="aqf-i" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="Número" value="' + esc(f.whatsapp) + '"></span></label>' +
        '<input class="aqf-hp" name="empresa_web" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        (error ? '<p class="aqf-err" role="alert">' + esc(error) + '</p>' : '') +
        '<button type="submit" class="aqf-b"' + (enviando ? ' disabled' : '') + '>' + (enviando ? 'Enviando…' : 'Reservar mi llamada gratis') + '</button>' +
        '</form>' +
        '<p class="aqf-sin">Sin compromiso · Respondemos en menos de 24 h · Horario de España</p>' +
        '<p class="aqf-legal">Usamos tus datos solo para atender tu solicitud. Más información en la <a href="privacidad.html" target="_blank">política de privacidad</a>.</p>';
    }
    function render() {
      host.innerHTML = html();
      if (f.paso === 2 && !enviado && !f.nombre && window.matchMedia('(min-width:561px)').matches) {
        var n = host.querySelector('input[name=nombre]'); if (n && host.closest('.aqf-ov')) setTimeout(function () { n.focus(); }, 60);
      }
    }
    function leer(form) {
      f.nombre = (form.elements.nombre.value || '').trim();
      f.whatsapp = (form.elements.whatsapp.value || '').trim();
      if (form.elements.pre) f.pre = form.elements.pre.value;
      f.empresa_web = form.elements.empresa_web.value;
    }
    function enviar(form) {
      leer(form);
      error = f.nombre.length < 2 ? 'Escribe tu nombre.' : f.whatsapp.replace(/\D/g, '').length < 6 ? 'Escribe tu número de WhatsApp para que podamos contactarte.' : '';
      if (error) { render(); return; }
      if (typeof window.enviarLead !== 'function') { error = 'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.'; render(); return; }
      enviando = true; render();
      window.enviarLead({
        nombre: f.nombre, whatsapp: P() ? P().unir(f.pre, f.whatsapp) : f.whatsapp,
        monto: f.monto, objetivo: f.objetivo, proyecto: opts.proyecto || null,
        origen: opts.origen || origenPorDefecto(), empresa_web: f.empresa_web
      }).then(function () {
        if (P()) P().recordar(f.pre);
        enviando = false; enviado = true; render();
        if (window.gtag) try { window.gtag('event', 'generate_lead', { method: 'asesoria' }); } catch (e) {}
      }, function (e) {
        enviando = false; error = (e && e.message) || 'No pudimos enviar tu solicitud. Inténtalo de nuevo.'; render();
      });
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b || !host.contains(b)) return;
      var campo = b.getAttribute('data-campo');
      if (campo) {
        f[campo] = b.getAttribute('data-v'); error = '';
        render();
        if (f.monto && f.objetivo && campo === 'objetivo') { f.paso = 2; render(); }
        return;
      }
      var act = b.getAttribute('data-act');
      if (act === 'seguir' && f.monto && f.objetivo) { f.paso = 2; render(); }
      else if (act === 'volver') { var form = host.querySelector('form'); if (form) leer(form); f.paso = 1; render(); }
    });
    host.addEventListener('submit', function (e) { e.preventDefault(); if (!enviando) enviar(e.target); });
    host.addEventListener('click', function (e) {
      if (e.target.closest('[data-guia-directa]') && window.gtag) try { window.gtag('event', 'file_download', { file_name: 'guia' }); } catch (x) {}
    });
    this.reset(opts);
  }

  // ---------- Guía gratuita ----------
  function FormGuia(host) {
    var f = { nombre: '', email: '', novedades: false, empresa_web: '' }, opts = {};
    var enviando = false, enviado = false, error = '';
    this.reset = function (o) {
      opts = o || {}; error = '';
      if (!f.nombre && !f.email && typeof window.contactoGuardado === 'function') { var c = window.contactoGuardado(); f.nombre = c.nombre || ''; f.email = c.email || ''; }
      render();
    };
    function html() {
      if (enviado) {
        return '<div class="aqf-ok" role="status"><i aria-hidden="true">✓</i><h3>Tu guía está lista</h3>' +
          '<p>Si la descarga no empieza sola, pulsa el botón. También puedes reservar una llamada gratuita para revisar tu caso.</p>' +
          '<a class="aqf-b" href="' + GUIA_PDF + '" download>Descargar la guía (PDF)</a>' +
          '<button type="button" class="aqf-b aqf-b2" data-act="asesoria">Reservar mi llamada gratis</button></div>';
      }
      return '<form class="aqf-g" novalidate>' +
        '<label class="aqf-l">Nombre<input class="aqf-i" name="nombre" autocomplete="name" placeholder="Tu nombre" value="' + esc(f.nombre) + '"></label>' +
        '<label class="aqf-l">Email<input class="aqf-i" name="email" type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com" value="' + esc(f.email) + '"></label>' +
        '<input class="aqf-hp" name="empresa_web" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<label class="aqf-ck"><input type="checkbox" name="novedades"' + (f.novedades ? ' checked' : '') + '><span>Quiero recibir por email proyectos nuevos y novedades del mercado. Puedo darme de baja cuando quiera.</span></label>' +
        (error ? '<p class="aqf-err" role="alert">' + esc(error) + '</p>' : '') +
        '<button type="submit" class="aqf-b"' + (enviando ? ' disabled' : '') + '>' + (enviando ? 'Preparando…' : 'Descargar la guía gratis') + '</button>' +
        '</form>' +
        '<p class="aqf-legal">Guardamos tu nombre y email para atender tu solicitud y, solo si marcas la casilla, enviarte novedades. Más información en la <a href="privacidad.html" target="_blank">política de privacidad</a>.</p>';
    }
    function render() { host.innerHTML = html(); }
    function descargar() {
      var a = document.createElement('a'); a.href = GUIA_PDF; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
    }
    host.addEventListener('submit', function (e) {
      e.preventDefault(); if (enviando) return;
      var form = e.target;
      f.nombre = (form.elements.nombre.value || '').trim(); f.email = (form.elements.email.value || '').trim();
      f.novedades = form.elements.novedades.checked; f.empresa_web = form.elements.empresa_web.value;
      error = f.nombre.length < 2 ? 'Escribe tu nombre.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? 'Escribe un email válido.' : '';
      if (error) { render(); return; }
      if (typeof window.enviarLead !== 'function') { error = 'No pudimos enviarte la guía. Inténtalo de nuevo en unos minutos.'; render(); return; }
      enviando = true; render();
      window.enviarLead({
        nombre: f.nombre, email: f.email, origen: opts.origen || 'Guía gratuita',
        mensaje: 'Descargó la guía «Cómo invertir en Paraguay desde España 2026».' + (f.novedades ? ' Acepta recibir novedades.' : ''),
        consentimiento: f.novedades, empresa_web: f.empresa_web
      }).then(function () {
        enviando = false; enviado = true; render(); descargar();
        if (window.gtag) try { window.gtag('event', 'generate_lead', { method: 'guia' }); } catch (x) {}
      }, function (er) {
        enviando = false; error = (er && er.message) || 'No pudimos enviarte la guía. Inténtalo de nuevo.'; render();
      });
    });
    host.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="asesoria"]')) { cerrar(); setTimeout(function () { abrir({ origen: 'Guía gratuita' }); }, 50); }
    });
  }

  // ---------- Ventana ----------
  var ov, pn, cuerpo, tit, sub, form, guia, modo = '', abierta = false, ultimoFoco = null;
  function montarVentana() {
    if (ov) return;
    var root = document.createElement('div');
    root.id = 'aq-asesoria';
    root.innerHTML = '<div class="aqf-ov" role="dialog" aria-modal="true" aria-labelledby="aqf-title" aria-hidden="true"><div class="aqf-pn aqf">' +
      '<div class="aqf-hd"><div><h2 class="aqf-h" id="aqf-title"></h2><p class="aqf-sub"></p></div><button type="button" class="aqf-cl" data-act="cerrar" aria-label="Cerrar">×</button></div>' +
      '<div class="aqf-cuerpo"></div><div class="aqf-cuerpo"></div></div></div>';
    document.body.appendChild(root);
    ov = root.firstChild; pn = ov.firstChild;
    tit = pn.querySelector('.aqf-h'); sub = pn.querySelector('.aqf-sub');
    cuerpo = pn.querySelectorAll('.aqf-cuerpo');
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-act="cerrar"]')) cerrar();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierta) cerrar(); });
  }
  function mostrar(m) {
    modo = m;
    if (noche()) pn.setAttribute('data-noche', ''); else pn.removeAttribute('data-noche');
    cuerpo[0].style.display = m === 'asesoria' ? '' : 'none';
    cuerpo[1].style.display = m === 'guia' ? '' : 'none';
    ultimoFoco = document.activeElement;
    abierta = true;
    ov.setAttribute('data-open', ''); ov.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    setTimeout(function () { var c = pn.querySelector('.aqf-cl'); if (c) c.focus({ preventScroll: true }); }, 80);
  }
  function abrir(o) {
    montarVentana(); o = o || {};
    tit.textContent = 'Reserva tu llamada gratis de 20 min';
    sub.textContent = o.proyecto ? 'Para hablar de ' + o.proyecto + '. Dos preguntas rápidas y te contactamos.' : 'Dos preguntas rápidas para preparar tu caso antes de la llamada.';
    if (!form) form = new Formulario(cuerpo[0], o); else form.reset(o);
    mostrar('asesoria');
  }
  function abrirGuia(o) {
    montarVentana(); o = o || {};
    tit.textContent = 'Guía gratuita: invertir en Paraguay desde España 2026';
    sub.textContent = 'Costes, impuestos, cómo comprar sin viajar y qué documentos pedir, con sus fuentes. La descargas al momento.';
    if (!guia) { guia = new FormGuia(cuerpo[1]); }
    guia.reset(o);
    mostrar('guia');
  }
  function cerrar() {
    if (!ov) return;
    abierta = false;
    ov.removeAttribute('data-open'); ov.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (ultimoFoco && ultimoFoco.focus) try { ultimoFoco.focus({ preventScroll: true }); } catch (e) {}
  }

  // ---------- Panel en la página ----------
  function montar(el, o) {
    if (!el) return null;
    el.classList.add('aqf'); el.setAttribute('data-oscuro', '');
    var fo = new Formulario(el, o || {});
    return { reset: function (x) { fo.reset(x); } };
  }

  // ---------- Barra fija en móvil ----------
  function barra() {
    var b = document.createElement('div');
    b.className = 'aqf-bar';
    var wa = waNum();
    b.innerHTML = '<button type="button">Llamada gratuita</button>' +
      (wa ? '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener" aria-label="WhatsApp">WhatsApp</a>' : '');
    document.body.appendChild(b);
    b.querySelector('button').addEventListener('click', function () { abrir({ origen: origenPorDefecto() + ' · barra móvil' }); });
    var on = false, raf = 0;
    function check() {
      raf = 0;
      var y = window.scrollY, h = window.innerHeight;
      var fin = document.documentElement.scrollHeight - h - y < h * 0.9; // el formulario y el pie ya están a la vista
      var form = document.getElementById('contacto');
      var cerca = form && form.getBoundingClientRect().top < h;
      var v = y > h * 0.8 && !fin && !cerca && !abierta;
      if (noche()) b.setAttribute('data-noche', ''); else b.removeAttribute('data-noche');
      if (v !== on) {
        on = v;
        if (v) { b.setAttribute('data-on', ''); document.documentElement.classList.add('aqf-con-barra'); }
        else { b.removeAttribute('data-on'); document.documentElement.classList.remove('aqf-con-barra'); }
      }
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(check); }, { passive: true });
    window.addEventListener('resize', check);
    check();
  }

  // Enlaces a la asesoría o a la guía desde cualquier página: se abren aquí mismo.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    var a = e.target.closest('a[href$="#asesoria"], [data-asesoria], [data-guia]');
    if (!a) return;
    e.preventDefault();
    if (a.hasAttribute('data-guia')) abrirGuia({ origen: a.getAttribute('data-guia') || 'Guía gratuita' });
    else abrir({ origen: a.getAttribute('data-asesoria') || origenPorDefecto() });
  });

  function iniciar() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    if (conBarra) barra();
    if (location.hash === '#guia') abrirGuia({});
  }

  window.AQAsesoria = { abrir: abrir, guia: abrirGuia, montar: montar, cerrar: cerrar, MONTOS: MONTOS, OBJS: OBJS };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
