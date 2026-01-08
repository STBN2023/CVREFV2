const fs = require('fs');
const path = require('path');
const dbManager = require('../database/database');
const { sanitizeSlug, safeFilename } = require('../utils/pptx');

const registerSalariesRoutes = (app, { dataDir, upload }) => {
  // Liste
  app.get('/api/salaries', async (_req, res) => {
    console.log('👥 [API] GET /api/salaries');
    try {
      const salaries = await dbManager.getAllSalaries();
      res.json({ salaries });
    } catch (e) {
      console.error('❌ /api/salaries:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des salariés' });
    }
  });

  // Détail
  app.get('/api/salaries/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`👤 [API] GET /api/salaries/${id}`);
    try {
      const salarie = await dbManager.getSalarieById(id);
      if (!salarie) return res.status(404).json({ error: 'Salarié non trouvé' });
      res.json({ salarie });
    } catch (e) {
      console.error('❌ GET salarie:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération du salarié' });
    }
  });

  // Création
  app.post('/api/salaries', async (req, res) => {
    try {
      const payload = req.body || {};
      if (!payload.nom || !payload.prenom) return res.status(400).json({ error: 'Champs requis: nom, prenom' });
      const result = await dbManager.addSalarie(payload);
      const created = await dbManager.getSalarieById(result.id);
      res.status(201).json({ id: result.id, salarie: created });
    } catch (e) {
      console.error('❌ POST salarie:', e.message);
      res.status(500).json({ error: 'Erreur lors de la création du salarié' });
    }
  });

  // Mise à jour
  app.put('/api/salaries/:id', async (req, res) => {
    const rawId = String(req.params.id || '').trim();
    console.log('✏️  [API] PUT /api/salaries/:id', { id: rawId, body: req.body });
    try {
      const existing = await dbManager.getSalarieById(rawId);
      if (!existing) {
        console.warn('⚠️  PUT salarie: introuvable (pré-check)', { id: rawId });
        return res.status(404).json({ error: 'Salarié non trouvé' });
      }
      await dbManager.updateSalarie(rawId, req.body || {});
      const updated = await dbManager.getSalarieById(rawId);
      if (!updated) {
        const fallback = { ...existing, ...req.body, id_salarie: existing.id_salarie };
        console.warn('⚠️  GET post-update null, renvoi fallback', { id: rawId });
        return res.json({ success: true, salarie: fallback, warning: 'fallback_returned' });
      }
      res.json({ success: true, salarie: updated });
    } catch (e) {
      console.error('❌ PUT salarie:', e.message);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du salarié' });
    }
  });

  // Suppression
  app.delete('/api/salaries/:id', async (req, res) => {
    const { id } = req.params;
    console.log('🗑️  [API] DELETE /api/salaries/:id', { id });
    try {
      const exists = await dbManager.getSalarieById(id);
      if (!exists) return res.status(404).json({ error: 'Salarié non trouvé' });
      await dbManager.deleteSalarie(id);
      res.json({ success: true });
    } catch (e) {
      console.error('❌ DELETE salarie:', e.message);
      res.status(500).json({ error: 'Erreur lors de la suppression du salarié' });
    }
  });

  // Références d'un salarié
  app.get('/api/salaries/:id/references', async (req, res) => {
    const { id } = req.params;
    console.log(`📚 [API] GET /api/salaries/${id}/references`);
    try {
      const references = await dbManager.getSalarieReferences(id);
      res.json({ references });
    } catch (e) {
      console.error('❌ GET salarie references:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des références' });
    }
  });

  // Sauvegarde des références d'un salarié (PUT et alias POST)
  const replaceRefsHandler = async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    console.log(`✏️  [API] PUT/POST /api/salaries/${id}/references`, { body });

    const referenceIdsRaw = Array.isArray(body.referenceIds) ? body.referenceIds : [];
    const referenceIds = Array.from(new Set(referenceIdsRaw.map((x) => Number(x)).filter((n) => Number.isInteger(n))));

    try {
      const exists = await dbManager.getSalarieById(id);
      if (!exists) return res.status(404).json({ error: 'Salarié non trouvé' });

      await dbManager.replaceSalarieReferences(id, referenceIds);

      const updated = await dbManager.getSalarieReferences(id);
      res.json({ success: true, count: updated.length, references: updated });
    } catch (e) {
      console.error('❌ PUT/POST salarie references:', e.message);
      if (/FOREIGN KEY/i.test(e.message || '')) {
        return res.status(400).json({ error: 'Certaines références n\'existent pas' });
      }
      res.status(500).json({ error: 'Erreur lors de la mise à jour des références' });
    }
  };
  app.put('/api/salaries/:id/references', replaceRefsHandler);
  app.post('/api/salaries/:id/references', replaceRefsHandler);

  // AJOUT: Compétences d'un salarié
  app.get('/api/salaries/:id/competences', async (req, res) => {
    const { id } = req.params;
    console.log(`🧠 [API] GET /api/salaries/${id}/competences`);
    try {
      const exists = await dbManager.getSalarieById(id);
      if (!exists) return res.status(404).json({ error: 'Salarié non trouvé' });
      const competences = await dbManager.getSalarieCompetences(id);
      res.json({ competences });
    } catch (e) {
      console.error('❌ GET salarie competences:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des compétences' });
    }
  });

  const replaceCompsHandler = async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    console.log(`✏️  [API] PUT/POST /api/salaries/${id}/competences`, { body });

    const competenceIdsRaw = Array.isArray(body.competenceIds) ? body.competenceIds : [];
    const competenceIds = Array.from(new Set(competenceIdsRaw.map((x) => Number(x)).filter((n) => Number.isInteger(n))));

    try {
      const exists = await dbManager.getSalarieById(id);
      if (!exists) return res.status(404).json({ error: 'Salarié non trouvé' });

      await dbManager.replaceSalarieCompetences(id, competenceIds);
      const updated = await dbManager.getSalarieCompetences(id);
      res.json({ success: true, count: updated.length, competences: updated });
    } catch (e) {
      console.error('❌ PUT/POST salarie competences:', e.message);
      if (/FOREIGN KEY/i.test(e.message || '')) {
        return res.status(400).json({ error: 'Certaines compétences n\'existent pas' });
      }
      res.status(500).json({ error: 'Erreur lors de la mise à jour des compétences' });
    }
  };
  app.put('/api/salaries/:id/competences', replaceCompsHandler);
  app.post('/api/salaries/:id/competences', replaceCompsHandler);

  // Latest references
  app.post('/api/salaries/latest-references', async (req, res) => {
    try {
      const { salarieIds = [], limit = 5 } = req.body || {};
      if (!Array.isArray(salarieIds) || salarieIds.length === 0) {
        return res.json({ salarieReferences: {} });
      }
      const map = await dbManager.getLatestReferencesBySalaries(salarieIds, limit);
      res.json({ salarieReferences: map });
    } catch (e) {
      console.error('❌ latest-references:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des dernières références' });
    }
  });

  // Debug résolution CV
  app.get('/api/debug/resolve-cv/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const salarie = await dbManager.getSalarieById(id);
      if (!salarie) return res.status(404).json({ error: 'Salarié non trouvé', id });
      const prenom = salarie.prenom || '';
      const theNom = salarie.nom || '';
      const slug = `${sanitizeSlug(prenom)}_${sanitizeSlug(theNom)}.pptx`;
      const resolvedPath = path.join(dataDir, slug);
      const exists = fs.existsSync(resolvedPath);
      res.json({ id, prenom, nom: theNom, slug, path: resolvedPath, exists });
    } catch (e) {
      console.error('❌ [DEBUG] resolve-cv:', e);
      res.status(500).json({ error: 'Erreur de résolution', details: e.message });
    }
  });

  // Upload modèle PPTX salarié
  app.post('/api/salaries/:id/template', upload.single('file'), async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu (champ 'file' requis)" });

      const salarie = await dbManager.getSalarieById(id);
      if (!salarie) {
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(404).json({ error: 'Salarié introuvable' });
      }
      const prenom = salarie.prenom || '';
      const nom = salarie.nom || '';
      const slug = `${sanitizeSlug(prenom)}_${sanitizeSlug(nom)}.pptx`;
      const destPath = path.join(dataDir, slug);

      const orig = (req.file.originalname || '').toLowerCase();
      const looksPptx = orig.endsWith('.pptx') || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      if (!looksPptx) {
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: 'Le fichier doit être un .pptx' });
      }
      fs.copyFileSync(req.file.path, destPath);
      try { fs.unlinkSync(req.file.path); } catch {}

      console.log(`💾 [UPLOAD] Modèle chargé pour ${prenom} ${nom} → ${destPath}`);
      res.json({ message: 'Modèle PPTX téléversé', filename: slug, path: destPath, url: `/data/${slug}` });
    } catch (e) {
      console.error('❌ upload template:', e.message);
      try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: 'Erreur lors du téléversement du modèle' });
    }
  });
};

module.exports = { registerSalariesRoutes };