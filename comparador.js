// Comparador de proyectos: el visitante marca hasta 3 proyectos del catálogo y los ve lado a lado.
// Se incluye con <script src="./comparador.js" defer></script> después de proyectos.js.
// API: window.AQComparar.toggle(idx), .has(idx), .lista(), .abrir().
// También: .cambio() devuelve una promesa con los euros por dólar del día (o null).
// Opcional: data-offset="72" en la etiqueta sube la barra (p. ej. si hay una barra fija abajo).
// Avisa de cada cambio con el evento 'aq-comparar' en window. La selección se guarda en este navegador.
(function () {
  if (window.AQComparar) return;

  var MAX = 3;
  var KEY = 'aquaterra-comparar';
  var P = window.PROYECTOS || [];
  var sel = leer();
  var eurPorUsd = null;
  var pedido = null;
  var offset = parseInt((document.currentScript && document.currentScript.getAttribute('data-offset')) || '0', 10) || 0;
  var abierto = false;
  var root, tray, modal, toastEl, toastT;

  function leer() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v.filter(function (i) { return typeof i === 'number' && P[i]; }).slice(0, MAX) : [];
    } catch (e) { return []; }
  }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(sel)); } catch (e) {} }
  function avisar() {
    guardar();
    render();
    try { window.dispatchEvent(new CustomEvent('aq-comparar', { detail: sel.slice() })); } catch (e) {}
  }

  function has(i) { return sel.indexOf(i) !== -1; }
  function toggle(i) {
    if (!P[i]) return;
    if (has(i)) sel = sel.filter(function (x) { return x !== i; });
    else if (sel.length >= MAX) { toast('Puedes comparar hasta ' + MAX + ' proyectos. Quita uno para añadir otro.'); return; }
    else sel = sel.concat(i);
    avisar();
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function usd(n) { return 'USD ' + Math.round(n).toLocaleString('es-PY'); }
  function eur(n) { return '≈ ' + Math.round(n * eurPorUsd).toLocaleString('es-ES') + ' €'; }
  function noche() {
    var t = document.querySelector('[data-theme]');
    return !!t && t.getAttribute('data-theme') === 'noche';
  }

  // Cambio USD → EUR del día (Banco Central Europeo, vía Frankfurter). Si falla, no se muestra la fila en euros.
  function cargarCambio() {
    if (pedido) return pedido;
    if (!window.fetch) return (pedido = Promise.resolve(null));
    pedido = fetch('https://api.frankfurter.app/latest?from=USD&to=EUR')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.rates && j.rates.EUR) { eurPorUsd = j.rates.EUR; render(); } return eurPorUsd; })
      .catch(function () { return null; });
    return pedido;
  }

  var css = [
    '.aqv-tray{position:fixed;left:50%;bottom:calc(20px + var(--aqv-off,0px) + env(safe-area-inset-bottom));z-index:85;display:flex;align-items:center;gap:12px;max-width:min(560px,calc(100vw - 32px));padding:8px 8px 8px 18px;border-radius:999px;background:rgba(29,29,31,.92);color:#F5F5F7;box-shadow:0 14px 40px rgba(0,0,0,.3);backdrop-filter:saturate(180%) blur(20px);-webkit-backdrop-filter:saturate(180%) blur(20px);transform:translate(-50%,0);transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .35s;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif}',
    '.aqv-tray[hidden]{display:flex;opacity:0;pointer-events:none;transform:translate(-50%,24px)}',
    '.aqv-dots{display:flex;gap:6px;flex:0 0 auto}',
    '.aqv-dot{width:9px;height:9px;border-radius:2px;transform:rotate(45deg);background:rgba(245,245,247,.25)}',
    '.aqv-dot[data-on]{background:rgba(201,241,93,.55);box-shadow:0 0 0 1px #C9F15D}',
    '.aqv-tt{font-size:14px;line-height:1.3;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.aqv-tt b{font-weight:600}',
    '.aqv-go{flex:0 0 auto;height:40px;padding:0 18px;border:1px solid rgba(201,241,93,.38);border-radius:999px;background:rgba(201,241,93,.16);color:#E4F7B0;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:background .25s;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}',
    '.aqv-go:hover:not(:disabled){background:rgba(201,241,93,.26)}',
    '.aqv-go:disabled{border-color:transparent;background:rgba(245,245,247,.16);color:rgba(245,245,247,.6);cursor:default}',
    '.aqv-x{flex:0 0 auto;width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:rgba(245,245,247,.7);font-size:20px;line-height:1;cursor:pointer}',
    '.aqv-ov{position:fixed;inset:0;z-index:95;background:rgba(0,0,0,.45);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));overflow:auto;overscroll-behavior:contain;opacity:0;pointer-events:none;transition:opacity .25s}',
    '.aqv-ov[data-open]{opacity:1;pointer-events:auto}',
    '.aqv-pn{--bg:#FFFFFF;--ink:#1D1D1F;--mute:#6E6E73;--mute2:#424245;--line:rgba(0,0,0,.1);--chip:rgba(118,118,128,.12);--soft:#F5F5F7;--link:#0066CC;position:relative;width:100%;max-width:1080px;margin:auto 0;background:var(--bg);color:var(--ink);border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.35);padding:clamp(22px,3.4vw,40px);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;transform:translateY(14px);transition:transform .35s cubic-bezier(.16,1,.3,1)}',
    '.aqv-ov[data-open] .aqv-pn{transform:none}',
    '.aqv-pn[data-noche]{--bg:#212329;--ink:#ECECEE;--mute:#A4A7AE;--mute2:#CACCD1;--line:rgba(255,255,255,.10);--chip:rgba(150,152,160,.20);--soft:#2A2D34;--link:#2997FF}',
    '.aqv-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:22px}',
    '.aqv-kick{display:block;font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);margin-bottom:8px}',
    '.aqv-h{margin:0;font-size:clamp(28px,3.4vw,44px);line-height:1.04;letter-spacing:-0.035em;font-weight:700}',
    '.aqv-h em{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-0.01em;color:#86868B}',
    '.aqv-cl{flex:0 0 auto;width:40px;height:40px;border:0;border-radius:50%;background:var(--chip);color:var(--ink);font-size:22px;line-height:1;cursor:pointer}',
    '.aqv-add{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:20px}',
    '.aqv-add span{font-size:14px;color:var(--mute);margin-right:4px}',
    '.aqv-chip{height:36px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--ink);font-size:14px;font-weight:500;cursor:pointer;font-family:inherit}',
    '.aqv-chip:hover{background:var(--chip)}',
    '.aqv-empty{padding:40px 20px;border-radius:20px;background:var(--soft);text-align:center;font-size:17px;color:var(--mute2);line-height:1.5}',
    '.aqv-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 calc(-1 * clamp(22px,3.4vw,40px));padding:0 clamp(22px,3.4vw,40px)}',
    '.aqv-t{width:100%;min-width:calc(150px + var(--n,2) * 220px);border-collapse:separate;border-spacing:0;table-layout:fixed}',
    '.aqv-t th,.aqv-t td{text-align:left;vertical-align:top;padding:14px 16px;border-bottom:1px solid var(--line);font-size:15px;line-height:1.45}',
    '.aqv-t th[scope=row]{width:150px;font-size:13px;font-weight:600;color:var(--mute);position:sticky;left:0;background:var(--bg);z-index:1}',
    '',
    '.aqv-t thead td{border-bottom:0;padding-bottom:6px}',
    '.aqv-cv{position:relative;border-radius:18px;padding:16px 16px 18px;color:#F5F5F7;min-height:150px;display:flex;flex-direction:column;justify-content:space-between;gap:16px;overflow:hidden}',
    '.aqv-cv-top{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.aqv-tag{padding:5px 10px;border-radius:999px;font-size:12px;font-weight:600;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2)}',
    '.aqv-tag[data-pozo]{background:rgba(201,241,93,.14);border-color:rgba(201,241,93,.38);color:#E4F7B0}',
    '.aqv-rm{width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#F5F5F7;font-size:17px;line-height:1;cursor:pointer}',
    '.aqv-nm{margin:0;font-size:22px;line-height:1.1;font-weight:700;letter-spacing:-0.03em}',
    '.aqv-lc{display:flex;align-items:center;gap:7px;font-size:13px;color:rgba(245,245,247,.72);margin-top:6px}',
    '.aqv-lc i{width:7px;height:7px;background:#C9F15D;transform:rotate(45deg);border-radius:1px;flex:0 0 auto}',
    '.aqv-pr{font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;font-size:17px;font-weight:500}',
    '.aqv-sub{display:block;font-size:13px;color:var(--mute);margin-top:2px}',
    '.aqv-best{display:inline-block;vertical-align:middle;margin:4px 0 0 10px;padding:3px 9px;border-radius:7px;background:rgba(201,241,93,.22);border:1px solid rgba(201,241,93,.6);color:#3F5410;font-size:12px;font-weight:600}',
    '.aqv-pn[data-noche] .aqv-best{color:#E4F7B0}',
    '.aqv-ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}',
    '.aqv-ul li{position:relative;padding-left:14px}',
    '.aqv-ul li::before{content:"";position:absolute;left:0;top:.62em;width:5px;height:5px;border-radius:1px;transform:rotate(45deg);background:#C9F15D}',
    '.aqv-ul li[data-common]::before{background:var(--mute)}',
    '.aqv-na{color:var(--mute)}',
    '.aqv-a{color:var(--link);font-weight:500}',
    '.aqv-src{font-size:13px;color:var(--mute)}',
    '.aqv-src a{color:var(--link)}',
    '.aqv-ft{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-top:24px}',
    '.aqv-note{max-width:560px;font-size:13px;line-height:1.5;color:var(--mute)}',
    '.aqv-btns{display:flex;flex-wrap:wrap;gap:10px}',
    '.aqv-b{display:inline-flex;align-items:center;height:46px;padding:0 22px;border-radius:999px;font-size:15px;font-weight:500;cursor:pointer;border:0;font-family:inherit;text-decoration:none}',
    '.aqv-b1{background:#0071E3;color:#FFFFFF}',
    '.aqv-b1:hover{background:#0077ED;color:#FFFFFF}',
    '.aqv-b2{background:var(--chip);color:var(--ink)}',
    '.aqv-toast{position:fixed;left:50%;bottom:calc(84px + var(--aqv-off,0px) + env(safe-area-inset-bottom));z-index:99;max-width:calc(100vw - 32px);padding:12px 18px;border-radius:14px;background:#1D1D1F;color:#F5F5F7;font-size:14px;box-shadow:0 12px 30px rgba(0,0,0,.3);transform:translate(-50%,10px);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif}',
    '.aqv-toast[data-on]{opacity:1;transform:translate(-50%,0)}',
    '@media (max-width:560px){.aqv-tray{bottom:calc(88px + var(--aqv-off,0px) + env(safe-area-inset-bottom));padding-left:14px}.aqv-ov{padding:0}.aqv-pn{min-height:100%;border-radius:0;padding-top:calc(20px + env(safe-area-inset-top));padding-bottom:calc(24px + env(safe-area-inset-bottom))}.aqv-t{min-width:calc(104px + var(--n,2) * 210px)}.aqv-t th[scope=row]{width:104px;padding-left:0}.aqv-toast{bottom:calc(156px + var(--aqv-off,0px) + env(safe-area-inset-bottom))}}'
  ].join('');

  function coverBg(tipo) {
    var t = { 'Departamento': '41,151,255', 'Barrio cerrado': '201,241,93', 'Country': '52,199,149', 'Casa': '255,149,110', 'Lote': '255,190,80' }[tipo] || '142,142,147';
    return 'radial-gradient(120% 95% at 100% 0%, rgba(' + t + ',0.30), rgba(' + t + ',0) 62%), #0B0C0F';
  }
  function loc(p) { return p.barrio === p.ciudad ? p.ciudad : p.barrio + ', ' + p.ciudad; }
  function filas(ps) {
    var precios = ps.map(function (p) { return p.precio || null; });
    var conPrecio = precios.filter(Boolean);
    var minimo = conPrecio.length > 1 ? Math.min.apply(null, conPrecio) : null;
    // Comodidades que tienen todos los elegidos, para distinguirlas de las que solo tiene uno.
    var comunes = ps.length > 1 ? (ps[0].amen || []).filter(function (a) { return ps.every(function (p) { return (p.amen || []).indexOf(a) !== -1; }); }) : [];

    return [
      ['Precio desde', function (p) {
        if (p.precio) {
          return '<span class="aqv-pr">' + usd(p.precio) + '</span>' +
            (eurPorUsd ? '<span class="aqv-sub">' + eur(p.precio) + ' al cambio de hoy</span>' : '') +
            (minimo && p.precio === minimo ? '<span class="aqv-best">El más accesible</span>' : '');
        }
        if (p.precioTxt) return '<span class="aqv-pr">' + esc(p.precioTxt) + '</span>';
        return '<span class="aqv-na">Consultar precio</span>' + ((p.facts || []).some(function (x) { return /recios? publicados?/.test(x[0]); }) ? '<span class="aqv-sub">Precio anterior publicado en Datos clave</span>' : '');
      }],
      ['Tipo', function (p) { return esc(p.tipo) + (p.tambien && p.tambien.length ? '<span class="aqv-sub">También: ' + esc(p.tambien.join(', ')) + '</span>' : ''); }],
      ['Etapa', function (p) { return esc(p.etapa); }],
      ['Entrega', function (p) { return p.entrega ? esc(p.entrega) : '<span class="aqv-na">Sin fecha publicada</span>'; }],
      ['Tipologías', function (p) { return esc(p.tipologia); }],
      ['Datos clave', function (p) {
        var f = (p.facts || []).filter(function (x) { return x[0] !== 'Entrega'; });
        return f.length ? '<ul class="aqv-ul">' + f.map(function (x) { return '<li><b>' + esc(x[0]) + ':</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ul>' : '<span class="aqv-na">—</span>';
      }],
      ['Cómo se paga', function (p) { return p.pagos ? esc(p.pagos) : '<span class="aqv-na">A consultar</span>'; }],
      ['Lo que incluye', function (p) {
        var a = p.amen || [];
        if (!a.length) return '<span class="aqv-na">Sin datos publicados</span>';
        return '<ul class="aqv-ul">' + a.map(function (x) { return '<li' + (comunes.indexOf(x) !== -1 ? ' data-common' : '') + '>' + esc(x) + '</li>'; }).join('') + '</ul>';
      }],
      ['Desarrolladora', function (p) { return p.dev ? esc(p.dev) : '<span class="aqv-na">Proyecto de terceros</span>'; }],
      ['Fuente', function (p) {
        return '<span class="aqv-src">' + (p.fuentes || []).map(function (f) {
          return '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.nombre) + '</a>, ' + esc(f.fecha);
        }).join(' · ') + '</span>';
      }],
      ['', function (p, i) { return '<a class="aqv-a" href="Aquaterra%20Ficha.dc.html?p=' + i + '">Ver ficha ›</a>'; }]
    ];
  }

  function htmlModal() {
    var ps = sel.map(function (i) { return P[i]; });
    var libres = P.map(function (p, i) { return i; }).filter(function (i) { return !has(i); });
    var h = '<div class="aqv-hd"><div><span class="aqv-kick">Comparador</span><h2 class="aqv-h" id="aqv-title">Lado a lado, <em>sin letra chica.</em></h2></div>' +
      '<button type="button" class="aqv-cl" data-act="cerrar" aria-label="Cerrar comparador">×</button></div>';

    if (sel.length < MAX && libres.length) {
      h += '<div class="aqv-add"><span>' + (sel.length ? 'Añadir:' : 'Elige hasta ' + MAX + ' proyectos:') + '</span>' +
        libres.map(function (i) { return '<button type="button" class="aqv-chip" data-add="' + i + '">+ ' + esc(P[i].name) + '</button>'; }).join('') + '</div>';
    }

    if (sel.length < 2) {
      h += '<div class="aqv-empty">' + (sel.length ? 'Añade al menos un proyecto más para compararlos.' : 'Marca proyectos con <b>Comparar</b> en el catálogo, o elígelos aquí arriba.') + '</div>';
    } else {
      var rows = filas(ps);
      h += '<div class="aqv-wrap"><table class="aqv-t" style="--n:' + ps.length + '"><thead><tr><th scope="row"><span class="aqv-na" style="font-weight:400">' + ps.length + ' proyectos</span></th>' +
        sel.map(function (i) {
          var p = P[i];
          return '<td><div class="aqv-cv" style="background:' + coverBg(p.tipo) + '"><div class="aqv-cv-top"><span class="aqv-tag"' + (p.etapa === 'En pozo' ? ' data-pozo' : '') + '>' + esc(p.etapa) + '</span>' +
            '<button type="button" class="aqv-rm" data-rm="' + i + '" aria-label="Quitar ' + esc(p.name) + ' de la comparación">×</button></div>' +
            '<div><h3 class="aqv-nm">' + esc(p.name) + '</h3><span class="aqv-lc"><i></i>' + esc(loc(p)) + '</span></div></div></td>';
        }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><th scope="row">' + esc(r[0]) + '</th>' + sel.map(function (i) { return '<td>' + r[1](P[i], i) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>';
    }

    h += '<div class="aqv-ft"><span class="aqv-note">Datos de cada fuente y fecha indicadas; pueden haber cambiado. Los proyectos son de otras desarrolladoras.' +
      (eurPorUsd ? ' Euros al cambio de referencia del BCE de hoy, solo orientativo.' : '') + '</span><div class="aqv-btns">' +
      (sel.length >= 2 && typeof window.abrirAsistente === 'function' ? '<button type="button" class="aqv-b aqv-b2" data-act="ia">Pregúntale al asistente</button>' : '') +
      '<a class="aqv-b aqv-b1" href="index.html#contacto">Agenda una asesoría</a></div></div>';
    return h;
  }

  function render() {
    if (!root) return;
    var n = sel.length;
    tray.hidden = n === 0 || abierto;
    tray.innerHTML = '<span class="aqv-dots" aria-hidden="true">' + [0, 1, 2].map(function (k) { return '<span class="aqv-dot"' + (k < n ? ' data-on' : '') + '></span>'; }).join('') + '</span>' +
      '<span class="aqv-tt"><b>' + n + ' de ' + MAX + '</b> · ' + esc(sel.map(function (i) { return P[i].name; }).join(', ')) + '</span>' +
      '<button type="button" class="aqv-go" data-act="abrir"' + (n < 2 ? ' disabled title="Elige al menos 2 proyectos"' : '') + '>Comparar</button>' +
      '<button type="button" class="aqv-x" data-act="vaciar" aria-label="Vaciar comparación">×</button>';
    if (abierto) {
      var pn = modal.firstChild;
      if (noche()) pn.setAttribute('data-noche', ''); else pn.removeAttribute('data-noche');
      pn.innerHTML = htmlModal();
    }
  }

  function abrir() {
    abierto = true;
    cargarCambio();
    if (toastEl) toastEl.removeAttribute('data-on');
    modal.setAttribute('data-open', '');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    render();
    var c = modal.querySelector('.aqv-cl');
    if (c) c.focus();
  }
  function cerrar() {
    abierto = false;
    modal.removeAttribute('data-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    render();
  }

  function preguntaIA() {
    var nombres = sel.map(function (i) { return P[i].name; });
    var lista = nombres.length > 1 ? nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1] : nombres[0];
    return 'Estoy comparando ' + lista + '. Soy de España: ¿qué diferencias ves entre ellos como inversión y cuál encaja mejor según el presupuesto y el plazo?';
  }

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.setAttribute('data-on', '');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.removeAttribute('data-on'); }, 2600);
  }

  function onClick(e) {
    var t = e.target.closest('[data-act],[data-add],[data-rm]');
    if (!t) { if (e.target === modal) cerrar(); return; }
    if (t.hasAttribute('data-add')) { toggle(+t.getAttribute('data-add')); return; }
    if (t.hasAttribute('data-rm')) { toggle(+t.getAttribute('data-rm')); return; }
    var a = t.getAttribute('data-act');
    if (a === 'abrir') abrir();
    else if (a === 'cerrar') cerrar();
    else if (a === 'vaciar') { sel = []; avisar(); }
    else if (a === 'ia') { var q = preguntaIA(); cerrar(); window.abrirAsistente(q); }
  }

  function montar() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    root = document.createElement('div');
    root.id = 'aq-comparar';
    if (offset) root.style.setProperty('--aqv-off', offset + 'px');
    root.innerHTML = '<div class="aqv-tray" role="region" aria-label="Comparación de proyectos" hidden></div>' +
      '<div class="aqv-ov" role="dialog" aria-modal="true" aria-labelledby="aqv-title" aria-hidden="true"><div class="aqv-pn"></div></div>' +
      '<div class="aqv-toast" role="status" aria-live="polite"></div>';
    document.body.appendChild(root);
    tray = root.querySelector('.aqv-tray');
    modal = root.querySelector('.aqv-ov');
    toastEl = root.querySelector('.aqv-toast');
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierto) cerrar(); });
    // La selección puede cambiar en otra pestaña.
    window.addEventListener('storage', function (e) { if (e.key === KEY) { sel = leer(); render(); try { window.dispatchEvent(new CustomEvent('aq-comparar', { detail: sel.slice() })); } catch (x) {} } });
    if (sel.length) cargarCambio();
    render();
    if (/[?&]comparar=1\b/.test(location.search)) abrir();
  }

  window.AQComparar = {
    toggle: toggle,
    has: has,
    lista: function () { return sel.slice(); },
    abrir: function () { if (root) abrir(); },
    cambio: cargarCambio,
    max: MAX
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
