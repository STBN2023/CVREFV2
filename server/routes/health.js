const registerHealthRoutes = (app) => {
  app.get('/health', (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString(), message: 'Backend OK' });
  });

  app.get('/api/test', (req, res) => {
    console.log('🔍 [API] Test endpoint');
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });
};

module.exports = { registerHealthRoutes };