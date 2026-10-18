// SEO de las páginas que cambian según la dirección (artículo del blog con ?a=, ficha con ?p=):
// enlace canónico propio, og:url y, en los artículos, sus datos estructurados (BlogPosting).
(function () {
  var q = new URLSearchParams(location.search);
  var page = location.pathname.split('/').pop() || '';
  var base = location.origin + location.pathname;
  var url = base;
  var marca = (window.MARCA && window.MARCA.nombre) || 'Aquaterra';
  var ld = null;

  if (/Blog\.dc\.html$/.test(page)) {
    var slug = q.get('a');
    var art = slug && (window.ARTICULOS || []).filter(function (x) { return x.slug === slug; })[0];
    if (art) {
      url = base + '?a=' + encodeURIComponent(art.slug);
      ld = {
        '@context': 'https://schema.org', '@type': 'BlogPosting', headline: art.t, description: art.ex, inLanguage: 'es',
        mainEntityOfPage: url, url: url, image: location.origin + '/og.jpg', articleSection: art.cat,
        author: { '@type': 'Organization', name: marca, url: location.origin + '/' },
        publisher: { '@type': 'Organization', name: marca, logo: { '@type': 'ImageObject', url: location.origin + '/icon-512.png' } }
      };
    }
  } else if (/Ficha\.dc\.html$/.test(page)) {
    var i = parseInt(q.get('p'), 10);
    url = base + '?p=' + (isNaN(i) ? 0 : i);
  }

  function meta(sel, make) {
    var el = document.head.querySelector(sel);
    if (!el) { el = make(); document.head.appendChild(el); }
    return el;
  }
  meta('link[rel="canonical"]', function () { var l = document.createElement('link'); l.rel = 'canonical'; return l; }).href = url;
  meta('meta[property="og:url"]', function () { var m = document.createElement('meta'); m.setAttribute('property', 'og:url'); return m; }).content = url;
  if (ld) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }
})();
