const dbManager = require('../database/database');

const registerReferentialsRoutes = (app) => {
  // Agences
  app.get('/api/agences', async (_req, res) => {
    console.log('🏢 [API] GET /api/agences');
    try {
      const agences = await dbManager.getAgences();
      res.json({ agences });
    } catch (e) {
      console.error('❌ /api/agences:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des agences' });
    }
  });

  app.post('/api/agences', async (req, res) => {
    try {
      const { nom, actif } = req.body || {};
      if (!nom || String(nom).trim() === '') {
        return res.status(400).json({ error: 'Champ requis: nom' });
      }
      await dbManager.addAgence({ nom: String(nom).trim(), actif });
      res.status(201).json({ success: true });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: 'Cette agence existe déjà' });
      }
      console.error('❌ POST /api/agences:', e.message);
      res.status(500).json({ error: "Erreur lors de la création de l'agence" });
    }
  });

  app.put('/api/agences/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_agence FROM agences WHERE id_agence = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Agence introuvable' });

      const { nom, actif } = req.body || {};
      if (!nom || String(nom).trim() === '') {
        return res.status(400).json({ error: 'Champ requis: nom' });
      }
      await dbManager.updateAgence(id, { nom: String(nom).trim(), actif });
      res.json({ success: true });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: 'Cette agence existe déjà' });
      }
      console.error('❌ PUT /api/agences/:id:', e.message);
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'agence" });
    }
  });

  app.delete('/api/agences/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_agence FROM agences WHERE id_agence = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Agence introuvable' });

      await dbManager.deleteAgence(id);
      res.json({ success: true });
    } catch (e) {
      console.error('❌ DELETE /api/agences/:id:', e.message);
      res.status(500).json({ error: "Erreur lors de la suppression de l'agence" });
    }
  });

  // Fonctions
  app.get('/api/fonctions', async (_req, res) => {
    console.log('🧭 [API] GET /api/fonctions');
    try {
      const fonctions = await dbManager.getFonctions();
      res.json({ fonctions });
    } catch (e) {
      console.error('❌ /api/fonctions:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des fonctions' });
    }
  });

  app.post('/api/fonctions', async (req, res) => {
    try {
      const { nom, description, actif } = req.body || {};
      if (!nom || String(nom).trim() === '') {
        return res.status(400).json({ error: 'Champ requis: nom' });
      }
      await dbManager.addFonction({ nom: String(nom).trim(), description: description || null, actif });
      res.status(201).json({ success: true });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: 'Cette fonction existe déjà' });
      }
      console.error('❌ POST /api/fonctions:', e.message);
      res.status(500).json({ error: 'Erreur lors de la création de la fonction' });
    }
  });

  app.put('/api/fonctions/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_fonction FROM fonctions WHERE id_fonction = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Fonction introuvable' });

      const { nom, description, actif } = req.body || {};
      if (!nom || String(nom).trim() === '') {
        return res.status(400).json({ error: 'Champ requis: nom' });
      }
      await dbManager.updateFonction(id, { nom: String(nom).trim(), description: description || null, actif });
      res.json({ success: true });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: 'Cette fonction existe déjà' });
      }
      console.error('❌ PUT /api/fonctions/:id:', e.message);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la fonction' });
    }
  });

  app.delete('/api/fonctions/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_fonction FROM fonctions WHERE id_fonction = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Fonction introuvable' });

      await dbManager.deleteFonction(id);
      res.json({ success: true });
    } catch (e) {
      console.error('❌ DELETE /api/fonctions/:id:', e.message);
      res.status(500).json({ error: 'Erreur lors de la suppression de la fonction' });
    }
  });

  // Niveaux
  app.get('/api/niveaux', async (_req, res) => {
    console.log('🏅 [API] GET /api/niveaux');
    try {
      const niveaux = await dbManager.getNiveauxExpertise();
      res.json({ niveaux });
    } catch (e) {
      console.error('❌ /api/niveaux:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des niveaux' });
    }
  });

  app.post('/api/niveaux', async (req, res) => {
    try {
      const { nom, ordre, description, actif } = req.body || {};
      if (!nom || String(nom).trim() === '') {
        return res.status(400).json({ error: 'Champs requis: nom, ordre' });
      }
      if (ordre === undefined || ordre === null || isNaN(Number(ordre))) {
        return res.status(400).json({ error: 'Champ requis: ordre (nombre)' });
      }
      await dbManager.addNiveau({ nom: String(nom).trim(), ordre: Number(ordre), description: description || null, actif });
      res.status(201).json({ success: true });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: 'Ce niveau existe déjà' });
      }
      console.error('❌ POST /api/niveaux:', e.message);
      res.status(500).json({ error: 'Erreur lors de la création du niveau' });
    }
  });

  app.put('/api/niveaux/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_niveau FROM niveaux_expertise WHERE id_niveau = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Niveau introuvable' });

      const { nom, ordre, description, actif } = req.body || {};
      if (!nom || String(nom).trim() === '') {
        return res.status(400).json({ error: 'Champs requis: nom, ordre' });
      }
      if (ordre === undefined || ordre === null || isNaN(Number(ordre))) {
        return res.status(400).json({ error: 'Champ requis: ordre (nombre)' });
      }
      await dbManager.updateNiveau(id, { nom: String(nom).trim(), ordre: Number(ordre), description: description || null, actif });
      res.json({ success: true });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: 'Ce niveau existe déjà' });
      }
      console.error('❌ PUT /api/niveaux/:id:', e.message);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du niveau' });
    }
  });

  app.delete('/api/niveaux/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_niveau FROM niveaux_expertise WHERE id_niveau = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Niveau introuvable' });

      await dbManager.deleteNiveau(id);
      res.json({ success: true });
    } catch (e) {
      console.error('❌ DELETE /api/niveaux/:id:', e.message);
      res.status(500).json({ error: 'Erreur lors de la suppression du niveau' });
    }
  });

  // AJOUT: Compétences
  app.get('/api/competences', async (_req, res) => {
    console.log('🧠 [API] GET /api/competences');
    try {
      const competences = await dbManager.getCompetences();
      res.json({ competences });
    } catch (e) {
      console.error('❌ /api/competences:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des compétences' });
    }
  });

  app.post('/api/competences', async (req, res) => {
    try {
      const { nom, description, actif } = req.body || {};
      if (!nom || String(nom).trim() === '') {
        return res.status(400).json({ error: 'Champ requis: nom' });
      }
      await dbManager.addCompetence({ nom: String(nom).trim(), description: description || null, actif });
      res.status(201).json({ success: true });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: 'Cette compétence existe déjà' });
      }
      console.error('❌ POST /api/competences:', e.message);
      res.status(500).json({ error: 'Erreur lors de la création de la compétence' });
    }
  });

  app.put('/api/competences/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_competence FROM competences WHERE id_competence = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Compétence introuvable' });

      const { nom, description, actif } = req.body || {};
      if (!nom || String(nom).trim() === '') {
        return res.status(400).json({ error: 'Champ requis: nom' });
      }
      await dbManager.updateCompetence(id, { nom: String(nom).trim(), description: description || null, actif });
      res.json({ success: true });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: 'Cette compétence existe déjà' });
      }
      console.error('❌ PUT /api/competences/:id:', e.message);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la compétence' });
    }
  });

  app.delete('/api/competences/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_competence FROM competences WHERE id_competence = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Compétence introuvable' });

      await dbManager.deleteCompetence(id);
      res.json({ success: true });
    } catch (e) {
      console.error('❌ DELETE /api/competences/:id:', e.message);
      res.status(500).json({ error: 'Erreur lors de la suppression de la compétence' });
    }
  });

  // Bundle référentiels
  app.get('/api/referentials', async (_req, res) => {
    console.log('📦 [API] GET /api/referentials');
    try {
      const [agences, fonctions, niveaux, competences] = await Promise.all([
        dbManager.getAgences(),
        dbManager.getFonctions(),
        dbManager.getNiveauxExpertise(),
        dbManager.getCompetences(),
      ]);
      res.json({ agences, fonctions, niveaux_expertise: niveaux, competences });
    } catch (e) {
      console.error('❌ /api/referentials:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des référentiels' });
    }
  });
};

module.exports = { registerReferentialsRoutes };