// Identidad visual y animaciones compartidas por todas las páginas.
// Se incluye con <script src="./fx.js" defer></script>. Todo se activa con atributos:
//   data-accent  palabra destacada en serif itálica (con subrayado lima si ya lo tenía)
//   data-fx      el elemento entra con desenfoque y recorte al aparecer en pantalla
//   data-tilt    tarjeta que se inclina y tiene un foco de luz que sigue al cursor
//   data-magnet  botón que se acerca levemente al cursor
// Además: transición suave entre páginas, cursor propio con anillo lima y una entrada de marca la primera vez que se abre la web.
// Respeta "reducir movimiento" del sistema.
(function () {
  if (window.__aqFx) return;
  window.__aqFx = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Tipografías: Bricolage Grotesque para titulares, Instrument Serif para acentos, JetBrains Mono para datos.
  // Se sirven desde /fonts (sin pedirlas a Google) y se piden después del primer pintado: el texto aparece enseguida
  // con la fuente del sistema y cambia a la definitiva en cuanto llega, sin retrasar la carga.
  var FONTS = [['Bricolage Grotesque', 'bricolage-grotesque', '200 800'], ['Instrument Serif', 'instrument-serif-italic', '400', 'italic'],
    ['JetBrains Mono', 'jetbrains-mono-400', '400'], ['JetBrains Mono', 'jetbrains-mono-500', '500']];

  var ease = 'cubic-bezier(.16,1,.3,1)';
  var css = [
    'h1,h2,h3{font-family:"Bricolage Grotesque",-apple-system,BlinkMacSystemFont,"Helvetica Neue",sans-serif;font-optical-sizing:auto}',
    '[data-accent]{font-family:"Instrument Serif",Georgia,serif!important;font-style:italic;font-weight:400!important;letter-spacing:-0.01em!important}',
    '[data-accent][data-mark]{background-repeat:no-repeat!important;background-size:0% 100%!important;transition:background-size 1.1s ' + ease + ' .35s}',
    '[data-accent][data-mark][data-in]{background-size:100% 100%!important}',
    '[data-mono]{font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace!important;letter-spacing:0!important}',
    '[data-grain]{position:relative}',
    '[data-grain]::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'><filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")}',
    '#aq-progress{position:fixed;top:0;left:0;right:0;height:2px;z-index:60;pointer-events:none;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,rgba(201,241,93,.2),#C9F15D)}',
    '[data-tilt]{position:relative;transform-style:preserve-3d;will-change:transform}',
    '[data-tilt]::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .4s;background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(201,241,93,.16),transparent 45%)}',
    '[data-tilt]:hover::after{opacity:1}',
    '@keyframes aq-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}',
    '[data-marquee]{display:flex;width:max-content;animation:aq-marquee 48s linear infinite}',
    '[data-marquee]:hover{animation-play-state:paused}',
    '@keyframes aq-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}',
    '[data-float]{animation:aq-float 5s ease-in-out infinite}',
    '@view-transition{navigation:auto}',
    '::view-transition-old(root){animation:aq-vt-out .35s ' + ease + ' both}',
    '::view-transition-new(root){animation:aq-vt-in .55s ' + ease + ' both}',
    '@keyframes aq-vt-out{to{opacity:0;transform:translateY(-12px);filter:blur(6px)}}',
    '@keyframes aq-vt-in{from{opacity:0;transform:translateY(18px);filter:blur(6px)}}',
    '#aq-cursor{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;pointer-events:none;z-index:70;border:1px solid rgba(201,241,93,.55);background:rgba(201,241,93,.08);display:flex;align-items:center;justify-content:center;opacity:0;transition:width .35s ' + ease + ',height .35s ' + ease + ',margin .35s ' + ease + ',background .3s,border-color .3s,opacity .3s}',
    '#aq-cursor span{font:500 11px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;color:#C9F15D;text-shadow:0 1px 6px rgba(0,0,0,.55);opacity:0;transition:opacity .2s}',
    '#aq-cursor.on{opacity:1}',
    '#aq-cursor.link{width:52px;height:52px;margin:-26px 0 0 -26px;background:rgba(201,241,93,.14)}',
    '#aq-cursor.card{width:88px;height:88px;margin:-44px 0 0 -44px;background:rgba(201,241,93,.1);border-color:#C9F15D}',
    '#aq-cursor.card span{opacity:1}',
    '#aq-cursor.down{transform:scale(.85)}',
    '#aq-intro{position:fixed;inset:0;z-index:2147483000;background:#0B0C0F;display:flex;align-items:center;justify-content:center;gap:18px;color:#F5F5F7;clip-path:inset(0 0 0 0);transition:clip-path .9s cubic-bezier(.76,0,.24,1)}',
    '#aq-intro.out{clip-path:inset(0 0 100% 0)}',
    '#aq-intro i{width:22px;height:22px;border-radius:3px;background:rgba(201,241,93,.2);border:1.5px solid #C9F15D;animation:aq-spin 1s ' + ease + ' both}',
    '#aq-intro b{font:700 clamp(28px,5vw,44px)/1 "Bricolage Grotesque",-apple-system,sans-serif;letter-spacing:-.03em;animation:aq-rise .9s ' + ease + ' .1s both}',
    '@keyframes aq-spin{from{transform:rotate(-135deg) scale(.4);opacity:0}to{transform:rotate(45deg) scale(1);opacity:1}}',
    '@keyframes aq-rise{from{transform:translateY(24px);opacity:0;filter:blur(8px)}}',
    '[data-aurora]{position:relative;isolation:isolate}',
    '[data-aurora]::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;background:radial-gradient(38% 46% at 18% 22%,rgba(201,241,93,.16),transparent 70%),radial-gradient(34% 40% at 82% 78%,rgba(120,205,190,.11),transparent 70%),radial-gradient(30% 34% at 62% 18%,rgba(201,241,93,.08),transparent 70%);background-size:170% 170%;animation:aq-aurora 26s ease-in-out infinite alternate}',
    '@keyframes aq-aurora{0%{background-position:0% 0%}50%{background-position:70% 40%}100%{background-position:30% 100%}}',
    'input[data-range]{-webkit-appearance:none;appearance:none;background:transparent}',
    'input[data-range]:focus-visible{outline:2px solid rgba(201,241,93,.6);outline-offset:6px;border-radius:999px}',
    'input[data-range]::-webkit-slider-runnable-track{height:6px;border-radius:999px;background:linear-gradient(90deg,rgba(201,241,93,.55),#C9F15D var(--p,50%),rgba(255,255,255,.12) var(--p,50%))}',
    'input[data-range]::-moz-range-track{height:6px;border-radius:999px;background:rgba(255,255,255,.12)}',
    'input[data-range]::-moz-range-progress{height:6px;border-radius:999px;background:linear-gradient(90deg,rgba(201,241,93,.55),#C9F15D)}',
    'input[data-range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;margin-top:-10px;border-radius:50%;background:#F5F5F7;border:6px solid #C9F15D;box-shadow:0 0 0 7px rgba(201,241,93,.16),0 8px 18px rgba(0,0,0,.45);transition:transform .25s ' + ease + ',box-shadow .25s}',
    'input[data-range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#F5F5F7;border:6px solid #C9F15D;box-shadow:0 0 0 7px rgba(201,241,93,.16),0 8px 18px rgba(0,0,0,.45)}',
    'input[data-range]:hover::-webkit-slider-thumb{box-shadow:0 0 0 10px rgba(201,241,93,.2),0 8px 18px rgba(0,0,0,.45)}',
    'input[data-range]:active::-webkit-slider-thumb{transform:scale(1.14)}',
    '@media (hover:hover){[data-tilt]::before{content:"";position:absolute;inset:0;z-index:3;border-radius:inherit;pointer-events:none;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.13) 48%,rgba(201,241,93,.10) 52%,transparent 62%);background-size:260% 100%;background-repeat:no-repeat;background-position:130% 0}[data-tilt]:hover::before{background-position:-40% 0;transition:background-position 1.2s ' + ease + '}}'
  ];
  if (!reduce) {
    css.push('[data-fx]:not([data-in]){opacity:0;filter:blur(14px);transform:translateY(28px);clip-path:inset(0 0 35% 0)}');
    css.push('@keyframes aq-up{from{opacity:0;transform:translateY(26px) scale(.985)}}');
    css.push('[data-stagger]:not([data-in])>*{opacity:0}');
    css.push('[data-stagger][data-in]>*{animation:aq-up .9s ' + ease + ' backwards;animation-delay:calc(var(--i,0) * 80ms)}');
    css.push('@supports (animation-timeline:scroll()){@keyframes aq-drift{to{transform:translateY(-9vh);opacity:.2}}[data-drift]{animation:aq-drift linear both;animation-timeline:scroll(root);animation-range:5vh 100vh}}');
    css.push('@keyframes aq-fx-now{from{opacity:.01;filter:blur(14px);transform:translateY(28px);clip-path:inset(0 0 35% 0)}to{clip-path:inset(0 0 0 0)}}');
    css.push('[data-fx][data-fx-now]{animation:aq-fx-now 1.2s ' + ease + ' backwards}');
    css.push('[data-fx]{transition:opacity 1s ' + ease + ',filter 1.1s ' + ease + ',transform 1.2s ' + ease + ',clip-path 1.2s ' + ease + '}');
  } else {
    css.push('[data-marquee],[data-float],[data-aurora]::after{animation:none}');
  }
  var st = document.createElement('style');
  st.textContent = css.join('\n');
  document.head.appendChild(st);

  var bar = document.createElement('div');
  bar.id = 'aq-progress';
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0).toFixed(4) + ')';
  }

  // Entrada de marca: solo la primera vez por visita.
  var seen = false;
  try { seen = sessionStorage.getItem('aq-intro') === '1'; sessionStorage.setItem('aq-intro', '1'); } catch (e) { seen = true; }
  if (!reduce && !seen && !navigator.webdriver) {
    var intro = document.createElement('div');
    intro.id = 'aq-intro';
    intro.setAttribute('aria-hidden', 'true');
    var nm = (window.MARCA && window.MARCA.nombre) || 'Aquaterra';
    intro.innerHTML = '<i></i><b></b>';
    intro.querySelector('b').textContent = nm;
    (document.body || document.documentElement).appendChild(intro);
    setTimeout(function () { intro.classList.add('out'); }, 1050);
    setTimeout(function () { intro.remove(); }, 2100);
  }

  // Cursor propio: un anillo lima que sigue al ratón y se abre sobre enlaces y tarjetas.
  function cursor() {
    var c = document.createElement('div');
    c.id = 'aq-cursor';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<span>Ver</span>';
    document.body.appendChild(c);
    var x = -100, y = -100, cx = x, cy = y, raf = 0;
    function loop() {
      cx += (x - cx) * 0.22; cy += (y - cy) * 0.22;
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)' + (c.classList.contains('down') ? ' scale(.85)' : '');
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    }
    document.addEventListener('pointermove', function (ev) {
      if (ev.pointerType !== 'mouse') return;
      x = ev.clientX; y = ev.clientY;
      if (!c.classList.contains('on')) { cx = x; cy = y; c.classList.add('on'); }
      var t = ev.target.closest ? ev.target : null;
      var ctl = t && t.closest('button,select,input,label,[role="button"]');
      var card = !ctl && t && t.closest('[data-tilt]');
      var link = !card && t && t.closest('a,button,[role="button"],input[type="range"],label,select');
      c.classList.toggle('card', !!card);
      c.classList.toggle('link', !!link);
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerdown', function () { c.classList.add('down'); if (!raf) raf = requestAnimationFrame(loop); });
    document.addEventListener('pointerup', function () { c.classList.remove('down'); if (!raf) raf = requestAnimationFrame(loop); });
    document.documentElement.addEventListener('pointerleave', function () { c.classList.remove('on'); });
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target); } });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }) : null;

  // Las rejillas se revelan en cascada en cuanto asoman, aunque sean más altas que la pantalla.
  var io2 = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io2.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: '0px 0px -12% 0px' }) : null;

  function tilt(el) {
    el.addEventListener('pointerenter', function () { el.style.transition = 'transform .25s ease-out, box-shadow .35s, opacity .9s'; });
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      if (!reduce) el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 6).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 8).toFixed(2) + 'deg) translateY(-6px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transition = 'transform .6s ' + ease + ', box-shadow .35s, opacity .9s'; el.style.transform = 'none'; });
  }

  function magnet(el) {
    el.style.transition = (el.style.transition ? el.style.transition + ', ' : '') + 'transform .4s ' + ease;
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect();
      var dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
      el.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px,' + (dy * 0.25).toFixed(1) + 'px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  }

  // La página la pinta React después de cargar: se revisan los elementos nuevos a medida que aparecen.
  // Nunca se toca la plantilla <x-dc> (oculta) que React lee para pintar la página: solo lo ya pintado.
  function live(sel) {
    return Array.prototype.filter.call(document.querySelectorAll(sel), function (el) { return !el.closest('x-dc'); });
  }

  function scan() {
    var nuevos = live('[data-fx]:not([data-fxo]),[data-accent][data-mark]:not([data-fxo])');
    // Los títulos que ya están en pantalla al aparecer entran con una animación CSS que arranca visible,
    // así se pintan en el primer fotograma (no esperan al observador) y la carga se percibe más rápida.
    var yaVisibles = reduce ? [] : nuevos.filter(function (el) {
      if (!el.hasAttribute('data-fx') || (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true }))) return false;
      var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight;
    });
    nuevos.forEach(function (el) {
      el.setAttribute('data-fxo', '');
      if (yaVisibles.indexOf(el) >= 0) { el.setAttribute('data-fx-now', ''); el.setAttribute('data-in', ''); }
      else if (io && !reduce) io.observe(el); else el.setAttribute('data-in', '');
    });
    live('[data-stagger]').forEach(function (el) {
      if (!el.hasAttribute('data-fxo')) { el.setAttribute('data-fxo', ''); if (io2 && !reduce) io2.observe(el); else el.setAttribute('data-in', ''); }
      for (var i = 0, k = 0; i < el.children.length; i++) el.children[i].style.setProperty('--i', Math.min(k++, 8));
    });
    if (fine) {
      live('[data-tilt]:not([data-fxt])').forEach(function (el) { el.setAttribute('data-fxt', ''); tilt(el); });
      if (!reduce) live('[data-magnet]:not([data-fxm])').forEach(function (el) { el.setAttribute('data-fxm', ''); magnet(el); });
    }
  }

  // Las fuentes se añaden al documento ya descargadas y todas juntas: la página se recoloca una sola vez.
  var fontsOn = false;
  function addFonts() {
    if (fontsOn) return;
    fontsOn = true;
    if (!window.FontFace || !document.fonts) return;
    Promise.all(FONTS.map(function (f) {
      var face = new FontFace(f[0], 'url(/fonts/' + f[1] + '.woff2) format("woff2")', { weight: f[2], style: f[3] || 'normal', display: 'swap' });
      return face.load().then(function () { return face; }, function () { return null; });
    })).then(function (faces) { faces.forEach(function (f) { if (f) document.fonts.add(f); }); });
  }
  function fontsAfterPaint() {
    var root = document.getElementById('dc-root');
    if (root && root.firstChild) requestAnimationFrame(function () { setTimeout(addFonts, 0); });
  }

  function start() {
    setTimeout(addFonts, 2500);
    fontsAfterPaint();
    if (!bar.isConnected) document.body.appendChild(bar);
    if (fine && !reduce) cursor();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    scan();
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; scan(); onScroll(); if (!fontsOn) fontsAfterPaint(); });
    }).observe(document.documentElement, { childList: true, subtree: true });
    // Red de seguridad: si algo impide la animación, el contenido nunca queda oculto.
    var tries = 0;
    var iv = setInterval(function () {
      scan(); if (!bar.isConnected) document.body.appendChild(bar);
      if (++tries > 8) clearInterval(iv);
    }, 400);
    setTimeout(function () {
      // Primero se leen todas las posiciones y después se marcan, para no forzar una maquetación por elemento.
      var els = live('[data-fx]:not([data-in]),[data-accent][data-mark]:not([data-in]),[data-stagger]:not([data-in])');
      // Las secciones que aún no se maquetaron (content-visibility) se saltan: no están en pantalla.
      els.filter(function (el) {
        if (el.checkVisibility && !el.checkVisibility({ contentVisibilityAuto: true })) return false;
        var r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0;
      })
        .forEach(function (el) { el.setAttribute('data-in', ''); });
    }, 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
