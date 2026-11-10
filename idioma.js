// Idioma de la web: español (por defecto), inglés o portugués (de Portugal).
// Las páginas se escriben en español. Si la visita elige otro idioma, este archivo carga su
// diccionario (idioma-en.js o idioma-pt.js) y traduce el texto que se ve (también lo que React pinta después),
// sin tocar la lógica: filtros, formularios y datos siguen funcionando con los valores en español.
// La elección se guarda en este navegador ('aquaterra-idioma') y se puede forzar con ?lang=en, ?lang=pt o ?lang=es.
// Para traducir un texto nuevo, añade la frase en español y su traducción a idioma-en.js y a idioma-pt.js.
// Para que algo no se traduzca nunca (nombres, mensajes de la persona), ponle translate="no".
(function () {
  var CLAVE = 'aquaterra-idioma';
  var lang = 'es';
  // código: [etiqueta, nombre en su idioma, lang del html]
  var IDIOMAS = { es: ['ES', 'Español', 'es'], en: ['EN', 'English', 'en'], pt: ['PT', 'Português', 'pt-PT'] };
  try {
    var q = new URLSearchParams(location.search).get('lang');
    var guardado = localStorage.getItem(CLAVE);
    if (IDIOMAS[q]) { lang = q; localStorage.setItem(CLAVE, q); }
    else if (IDIOMAS[guardado]) lang = guardado;
  } catch (e) {}
  window.AQ_IDIOMA = lang;
  // Formato de fechas de cada idioma, para los scripts que las escriben (Intl / toLocaleString).
  window.AQ_LOCALE = { es: 'es-ES', en: 'en-GB', pt: 'pt-PT' }[lang];
  window.aqCambiarIdioma = function (nuevo) {
    try { localStorage.setItem(CLAVE, nuevo); } catch (e) {}
    try {
      var u = new URL(location.href);
      if (u.searchParams.has('lang')) { u.searchParams.delete('lang'); location.replace(u.toString()); return; }
    } catch (e) {}
    location.reload();
  };
  // Texto corto para usar desde otros scripts: aqT('Enviar') devuelve la versión del idioma activo.
  window.aqT = function (s) { return lang !== 'es' && window.aqTraducir ? window.aqTraducir(s) : s; };

  if (lang !== 'es') {
    document.documentElement.lang = IDIOMAS[lang][2];
    // Carga síncrona: el diccionario está listo antes de que React pinte nada.
    document.write('<script src="/idioma-' + lang + '.js"><\/script>');
  }

  // ---------- Motor de traducción (solo en inglés y portugués) ----------
  // idioma-xx.js define window.AQ_DIC = { 'frase en español': 'traducción', ... } y llama a esto.
  // Las cifras no hace falta repetirlas: 'Desde USD # al mes' sirve para cualquier número.
  window.__aqIniciarTraduccion = function () {
    var D = window.AQ_DIC || {};
    var NUM = /\d+(?:[.,]\d+)*/g;
    var faltan = window.__aqFaltan = new Set();
    var hechos = new WeakMap(); // nodo de texto -> texto ya traducido por nosotros
    var ATTR = ['placeholder', 'aria-label', 'title', 'alt'];
    var LETRA = /[A-Za-zÁÉÍÓÚÑáéíóúñü¿¡]/;
    var REGLAS = window.AQ_REGLAS || [];
    // Textos que ya están traducidos (React a veces repinta con el valor que pusimos): no se vuelven a buscar.
    var YA = new Set();
    for (var kk in D) YA.add(D[kk]);
    var SOLO_CIFRAS = /^(?:USD|EUR|PYG|Gs?\.|mil|m²|m2|ha|km|min|h|[\d\s.,%€$≈~+\-–—·:/<>()×x#])+$/;
    // En inglés los miles van con coma y los decimales con punto: 48.356 -> 48,356 y 1,9 -> 1.9.
    function cifras(t) {
      if (lang !== 'en') return t;
      return t.replace(/\d+(?:[.,]\d+)+/g, function (n) {
        if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(n)) return n.replace(/\./g, '\u0001').replace(',', '.').replace(/\u0001/g, ',');
        if (/^\d+,\d{1,2}$/.test(n)) return n.replace(',', '.');
        return n;
      });
    }

    function traducir(s) {
      if (!s || !LETRA.test(s)) return s;
      var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
      var clave = m[2].replace(/\s+/g, ' ');
      if (YA.has(clave)) return s;
      var t = D[clave];
      if (t == null && /:$/.test(clave) && D[clave.slice(0, -1)] != null) t = D[clave.slice(0, -1)] + ':';
      if (t == null) {
        var nums = clave.match(NUM);
        if (nums) {
          var plantilla = D[clave.replace(NUM, '#')];
          if (plantilla != null) { var i = 0; t = plantilla.replace(/#/g, function () { return nums[i++] || ''; }); }
        }
      }
      if (t == null) {
        // Frases con partes variables (fechas, nombres): reglas con expresión regular del diccionario.
        for (var r = 0; r < REGLAS.length && t == null; r++) if (REGLAS[r][0].test(clave)) t = clave.replace(REGLAS[r][0], REGLAS[r][1]);
      }
      if (t == null) {
        // Solo cifras y símbolos ('USD 48.356', '1,9 %'): no hay nada que traducir, pero sí el formato del número.
        if (!SOLO_CIFRAS.test(clave)) { if (clave.length > 1) faltan.add(clave); return s; }
        t = clave;
      }
      return m[1] + cifras(t) + m[3];
    }
    window.aqTraducir = traducir;

    function saltar(el) {
      for (; el && el.nodeType === 1; el = el.parentElement) {
        var tg = el.tagName;
        if (tg === 'SCRIPT' || tg === 'STYLE' || tg === 'X-DC' || tg === 'TEXTAREA' || tg === 'NOSCRIPT' || tg === 'CODE') return true;
        if (el.getAttribute('translate') === 'no' || el.isContentEditable) return true;
        var c = el.classList;
        if (c && (c.contains('aqc-user') || c.contains('notranslate'))) return true;
      }
      return false;
    }
    function texto(n) {
      var v = n.nodeValue;
      if (hechos.get(n) === v) return;
      if (saltar(n.parentElement)) return;
      var t = traducir(v);
      hechos.set(n, t);
      if (t !== v) {
        var p = n.parentElement;
        // Un <option> sin value enviaría el texto traducido: se fija el valor original antes.
        if (p && p.tagName === 'OPTION' && !p.hasAttribute('value')) p.setAttribute('value', v.trim());
        n.nodeValue = t;
      }
    }
    function atributos(el) {
      // Un campo de texto no se traduce por dentro, pero su placeholder y su aria-label sí.
      if (el.tagName === 'TEXTAREA' ? saltar(el.parentElement) : saltar(el)) return;
      for (var i = 0; i < ATTR.length; i++) {
        var a = ATTR[i], v = el.getAttribute(a);
        if (!v) continue;
        var marca = '__aq_' + a;
        if (el[marca] === v) continue;
        var t = traducir(v); el[marca] = t;
        if (t !== v) el.setAttribute(a, t);
      }
      if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button') && el.value) {
        if (el.__aq_value !== el.value) { var tv = traducir(el.value); el.__aq_value = tv; if (tv !== el.value) el.value = tv; }
      }
    }
    function recorrer(raiz) {
      if (!raiz) return;
      if (raiz.nodeType === 3) { texto(raiz); return; }
      if (raiz.nodeType !== 1 && raiz.nodeType !== 9 && raiz.nodeType !== 11) return;
      if (raiz.nodeType === 1) { atributos(raiz); if (saltar(raiz)) return; }
      var tw = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (n.nodeType === 1) { var tg = n.tagName; if (tg === 'TEXTAREA') { atributos(n); return NodeFilter.FILTER_REJECT; } return (tg === 'SCRIPT' || tg === 'STYLE' || tg === 'X-DC' || n.getAttribute('translate') === 'no') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var n;
      while ((n = tw.nextNode())) { if (n.nodeType === 3) texto(n); else atributos(n); }
    }
    function titulo() {
      var t = traducir(document.title); if (t !== document.title) document.title = t;
      var md = document.querySelector('meta[name="description"]');
      if (md) md.setAttribute('content', traducir(md.getAttribute('content')));
    }

    function arrancar() {
      titulo();
      recorrer(document.body);
      new MutationObserver(function (lista) {
        for (var i = 0; i < lista.length; i++) {
          var r = lista[i];
          if (r.type === 'characterData') texto(r.target);
          else if (r.type === 'attributes') atributos(r.target);
          else for (var j = 0; j < r.addedNodes.length; j++) recorrer(r.addedNodes[j]);
        }
      }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
      var te = document.querySelector('title');
      if (te) new MutationObserver(titulo).observe(te, { childList: true, characterData: true, subtree: true });
    }
    if (document.body) arrancar();
    else document.addEventListener('DOMContentLoaded', arrancar);
  };

  // ---------- Selector ES / EN / PT ----------
  var CSS = '.aq-idioma{display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:999px;border:1px solid rgba(127,127,127,.35);font:600 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;letter-spacing:.04em;flex:none;vertical-align:middle}' +
    '.aq-idioma button{all:unset;cursor:pointer;padding:5px 7px;border-radius:999px;color:inherit;opacity:.6;-webkit-tap-highlight-color:transparent}' +
    '.aq-idioma button[aria-pressed="true"]{opacity:1;background:rgba(127,127,127,.22)}' +
    '.aq-idioma button:focus-visible{outline:2px solid #0B5CAD;outline-offset:1px}' +
    '.aq-idioma-grande{font-size:15px;padding:3px}.aq-idioma-grande button{padding:11px 16px}' +
    '.aq-idioma-c{position:relative;flex:none}' +
    '.aq-idioma-btn{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:4px;height:32px;padding:0 9px;border-radius:999px;border:1px solid rgba(127,127,127,.35);color:inherit;font:600 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;letter-spacing:.04em;-webkit-tap-highlight-color:transparent}' +
    '.aq-idioma-btn:hover{background:rgba(127,127,127,.14)}.aq-idioma-btn:focus-visible,.aq-idioma-lista button:focus-visible{outline:2px solid #0B5CAD;outline-offset:1px}' +
    '.aq-idioma-lista{position:absolute;top:calc(100% + 8px);right:0;min-width:150px;padding:6px;border-radius:14px;background:#1D1F24;color:#F5F5F7;box-shadow:0 12px 32px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);z-index:80;display:flex;flex-direction:column;gap:2px}' +
    '.aq-idioma-lista[hidden]{display:none}' +
    '.aq-idioma-lista button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;font:500 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
    '.aq-idioma-lista button b{font-size:11px;letter-spacing:.04em;opacity:.6;width:18px}' +
    '.aq-idioma-lista button:hover{background:rgba(255,255,255,.08)}.aq-idioma-lista button[aria-checked="true"]{background:rgba(201,241,93,.16)}' +
    '@media (max-width:560px){[data-aq-idioma][data-ocultar-movil]{display:none!important}}' +
    '.aq-idioma-fijo{position:fixed;top:12px;right:12px;z-index:60;background:rgba(23,25,30,.85);color:#fff;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}';

  // Versión compacta para la cabecera de escritorio: un botón con el idioma actual que abre la lista.
  var GLOBO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>';
  function compacto() {
    var d = document.createElement('div');
    d.className = 'aq-idioma-c';
    d.setAttribute('translate', 'no');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'aq-idioma-btn';
    b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-label', (lang === 'en' ? 'Language: ' : 'Idioma: ') + IDIOMAS[lang][1]);
    b.innerHTML = GLOBO + '<span>' + IDIOMAS[lang][0] + '</span>';
    var l = document.createElement('div');
    l.className = 'aq-idioma-lista'; l.setAttribute('role', 'menu'); l.hidden = true;
    Object.keys(IDIOMAS).forEach(function (k) {
      var o = document.createElement('button');
      o.type = 'button'; o.lang = k; o.setAttribute('role', 'menuitemradio');
      o.setAttribute('aria-checked', String(k === lang));
      o.innerHTML = '<b>' + IDIOMAS[k][0] + '</b>' + IDIOMAS[k][1];
      o.onclick = function () { cerrar(); if (k !== lang) window.aqCambiarIdioma(k); };
      l.appendChild(o);
    });
    function cerrar() { l.hidden = true; b.setAttribute('aria-expanded', 'false'); }
    b.onclick = function (e) { e.stopPropagation(); var abrir = l.hidden; l.hidden = !abrir; b.setAttribute('aria-expanded', String(abrir)); if (abrir) { var p = l.querySelector('[aria-checked="true"]'); if (p) p.focus(); } };
    document.addEventListener('click', function (e) { if (!d.contains(e.target)) cerrar(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { cerrar(); b.focus(); } });
    d.appendChild(b); d.appendChild(l);
    return d;
  }

  function selector(fijo, grande) {
    var d = document.createElement('div');
    d.className = 'aq-idioma' + (fijo ? ' aq-idioma-fijo' : '') + (grande ? ' aq-idioma-grande' : '');
    d.setAttribute('role', 'group');
    d.setAttribute('translate', 'no');
    d.setAttribute('aria-label', lang === 'en' ? 'Language' : 'Idioma');
    Object.keys(IDIOMAS).forEach(function (k) {
      var o = [k, IDIOMAS[k][0], IDIOMAS[k][1]];
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = o[1]; b.lang = o[0];
      b.title = o[2]; b.setAttribute('aria-label', o[2]);
      b.setAttribute('aria-pressed', String(o[0] === lang));
      b.onclick = function () { if (o[0] !== lang) window.aqCambiarIdioma(o[0]); };
      d.appendChild(b);
    });
    return d;
  }

  // Cada página reserva su hueco con <span data-aq-idioma> en la cabecera y en el menú móvil.
  // Si una página no tiene hueco (privacidad, cookies), el selector va fijo arriba a la derecha.
  function colocar() {
    var huecos = document.querySelectorAll('[data-aq-idioma]');
    for (var i = 0; i < huecos.length; i++) {
      var h = huecos[i];
      if (!h.firstChild) h.appendChild(h.hasAttribute('data-compacto') ? compacto() : selector(false, h.hasAttribute('data-grande')));
    }
    return huecos.length > 0;
  }
  function montarSelector() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var hubo = colocar();
    // React pinta y repinta la cabecera y el menú: cada hueco nuevo recibe su selector.
    new MutationObserver(function () { if (colocar()) hubo = true; })
      .observe(document.body, { childList: true, subtree: true });
    setTimeout(function () {
      if (!hubo && !document.querySelector('[data-aq-idioma]')) document.body.appendChild(selector(true));
    }, 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montarSelector);
  else montarSelector();
})();
