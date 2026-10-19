// GET /sitemap.xml y /robots.txt (vercel.json los reescribe aquí).
// El sitemap se arma con los artículos de articulos.js y los proyectos de proyectos.js,
// así cada artículo o proyecto nuevo aparece solo. Usa el dominio con el que se pide la página.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function cargar(archivo, clave) {
  try {
    const code = fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8');
    const sandbox = { window: { MARCA: { nombre: 'Aquaterra' } } };
    vm.runInNewContext(code, sandbox, { timeout: 200 });
    return sandbox.window[clave] || [];
  } catch (e) {
    return [];
  }
}

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

module.exports = (req, res) => {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'aquaterra-beta.vercel.app').split(',')[0].trim();
  const origen = `https://${host}`;
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');

  if (/robots/.test(req.url || '')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${origen}/sitemap.xml`, ''].join('\n'));
    return;
  }

  const urls = [
    { loc: '/', prioridad: '1.0' },
    { loc: '/Aquaterra%20Proyectos.dc.html', prioridad: '0.9' },
    { loc: '/Aquaterra%20Blog.dc.html', prioridad: '0.8' },
    { loc: '/Aquaterra%20Desde%20Espana.dc.html', prioridad: '0.8' },
    ...cargar('proyectos.js', 'PROYECTOS').map((p, i) => ({ loc: `/Aquaterra%20Ficha.dc.html?p=${i}`, prioridad: '0.7' })),
    ...cargar('articulos.js', 'ARTICULOS').map((a) => ({ loc: `/Aquaterra%20Blog.dc.html?a=${encodeURIComponent(a.slug)}`, prioridad: '0.7' }))
  ];
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${xml(origen + u.loc)}</loc><priority>${u.prioridad}</priority></url>`).join('\n') + '\n</urlset>\n');
};
