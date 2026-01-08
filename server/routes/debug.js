const registerDebugRoutes = (app) => {
  // Simple ping pour vérifier le backend
  app.get('/api/_ping', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  // Liste des routes enregistrées
  app.get('/api/_debug_routes', (_req, res) => {
    try {
      const routes = [];
      const stack = app._router?.stack || [];

      const collectFromLayer = (layer) => {
        if (layer.route) {
          const path = layer.route.path;
          const methods = layer.route.methods || {};
          Object.keys(methods).forEach((m) => {
            if (methods[m]) routes.push({ method: m.toUpperCase(), path });
          });
        } else if (layer.name === 'router' && layer.handle?.stack) {
          layer.handle.stack.forEach(collectFromLayer);
        }
      };

      stack.forEach(collectFromLayer);

      routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
      res.json({ routes });
    } catch (e) {
      res.status(500).json({ error: 'Unable to introspect routes', message: String(e) });
    }
  });
};

module.exports = { registerDebugRoutes };