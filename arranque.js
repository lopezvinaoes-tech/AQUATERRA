// El primer montaje de la página se hace con startTransition: React lo reparte en tramos cortos
// y el hilo principal no se bloquea mientras se pinta todo. Se carga con defer justo después de /vendor/react-dom.
(function () {
  var R = window.React, RD = window.ReactDOM;
  if (!R || !RD || !R.startTransition || !RD.createRoot) return;
  var createRoot = RD.createRoot;
  RD.createRoot = function (el, opts) {
    var root = createRoot.call(RD, el, opts), render = root.render.bind(root), first = true;
    root.render = function (node) {
      if (!first) return render(node);
      first = false;
      R.startTransition(function () { render(node); });
    };
    return root;
  };
})();
