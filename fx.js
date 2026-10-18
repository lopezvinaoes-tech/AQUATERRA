// Identidad visual y animaciones compartidas por todas las páginas.
// Se incluye con <script src="./fx.js" defer></script>. Todo se activa con atributos:
//   data-accent  palabra destacada en serif itálica (con subrayado lima si ya lo tenía)
//   data-fx      el elemento entra con desenfoque y recorte al aparecer en pantalla
//   data-tilt    tarjeta que se inclina y tiene un foco de luz que sigue al cursor
//   data-magnet  botón que se acerca levemente al cursor
// Respeta "reducir movimiento" del sistema.
(function () {
  if (window.__aqFx) return;
  window.__aqFx = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Tipografías: Bricolage Grotesque para titulares, Instrument Serif para acentos, JetBrains Mono para datos.
  var pre = document.createElement('link');
  pre.rel = 'preconnect'; pre.href = 'https://fonts.gstatic.com'; pre.crossOrigin = '';
  var fonts = document.createElement('link');
  fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(pre);
  document.head.appendChild(fonts);

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
    '[data-float]{animation:aq-float 5s ease-in-out infinite}'
  ];
  if (!reduce) {
    css.push('[data-fx]:not([data-in]){opacity:0;filter:blur(14px);transform:translateY(28px);clip-path:inset(0 0 35% 0)}');
    css.push('[data-fx]{transition:opacity 1s ' + ease + ',filter 1.1s ' + ease + ',transform 1.2s ' + ease + ',clip-path 1.2s ' + ease + '}');
  } else {
    css.push('[data-marquee],[data-float]{animation:none}');
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

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target); } });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' }) : null;

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
  function scan() {
    document.querySelectorAll('[data-fx]:not([data-fxo]),[data-accent][data-mark]:not([data-fxo])').forEach(function (el) {
      el.setAttribute('data-fxo', '');
      if (io && !reduce) io.observe(el); else el.setAttribute('data-in', '');
    });
    if (fine) {
      document.querySelectorAll('[data-tilt]:not([data-fxt])').forEach(function (el) { el.setAttribute('data-fxt', ''); tilt(el); });
      if (!reduce) document.querySelectorAll('[data-magnet]:not([data-fxm])').forEach(function (el) { el.setAttribute('data-fxm', ''); magnet(el); });
    }
  }

  function start() {
    if (!bar.isConnected) document.body.appendChild(bar);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    scan();
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; scan(); onScroll(); });
    }).observe(document.documentElement, { childList: true, subtree: true });
    // Red de seguridad: si algo impide la animación, el contenido nunca queda oculto.
    var tries = 0;
    var iv = setInterval(function () {
      scan(); if (!bar.isConnected) document.body.appendChild(bar);
      if (++tries > 8) clearInterval(iv);
    }, 400);
    setTimeout(function () {
      document.querySelectorAll('[data-fx]:not([data-in]),[data-accent][data-mark]:not([data-in])').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.setAttribute('data-in', '');
      });
    }, 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
