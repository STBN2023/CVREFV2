const registerLegacyRoutes = (app) => {
  app.post('/api/enrich-cv', (req, res) => {
    console.warn('⛔ Legacy /api/enrich-cv → utilisez /api/generate-cv');
    return res.status(410).json({ error: 'Route obsolète. Utilisez /api/generate-cv.' });
  });

  app.get('/template.pptx', (req, res) => {
    console.warn('⛔ Legacy /template.pptx désactivée.');
    return res.status(410).send("template.pptx n'est plus disponible.");
  });
};

module.exports = { registerLegacyRoutes };