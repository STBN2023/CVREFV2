const dbManager = require('../database/database');

const registerReferencesRoutes = (app) => {
  // Liste des références (enrichies par associations)
  app.get('/api/references', async (_req, res) => {
    console.log('📋 [API] GET /api/references');
    try {
      const references = await dbManager.getAllReferences();

      // Récupérer la liste des associations pour enrichir la réponse
      const links = await dbManager.all('SELECT id_reference, id_salarie FROM salaries_references');
      const map = new Map();
      for (const row of links) {
        const key = String(row.id_reference);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(String(row.id_salarie));
      }

      const enriched = references.map((r) => ({
        ...r,
        salaries: map.get(String(r.id_reference)) || [],
      }));

      res.json({ references: enriched });
    } catch (e) {
      console.error('❌ /api/references:', e.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des références' });
    }
  });

  // Création
  app.post('/api/references', async (req, res) => {
    try {
      const payload = req.body || {};
      if (!payload.nom_projet || !payload.client) {
        return res.status(400).json({ error: 'Champs requis: nom_projet, client' });
      }
      const annee = Number(payload.annee);
      if (!Number.isInteger(annee)) {
        return res.status(400).json({ error: 'Champ requis: annee (nombre)' });
      }

      const { id } = await dbManager.addReference({
        nom_projet: payload.nom_projet,
        ville: payload.ville || '',
        annee,
        type_mission: payload.type_mission || '',
        montant: payload.montant ?? null,
        description_courte: payload.description_projet || '',
        client: payload.client,
        duree_mois: payload.duree_mois ?? null,
        surface: payload.surface ?? null,
      });

      const salaries = Array.isArray(payload.salaries) ? payload.salaries : [];
      if (salaries.length > 0) {
        try {
          await dbManager.replaceReferenceSalaries(id, salaries);
        } catch (e) {
          if (/FOREIGN KEY/i.test(e.message || '')) {
            return res.status(400).json({ error: 'Certains salariés n\'existent pas' });
          }
          throw e;
        }
      }

      const created = await dbManager.get('SELECT * FROM projets_references WHERE id_reference = ?', [id]);
      res.status(201).json({ id, reference: created });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: 'Cette référence existe déjà (nom_projet + client + annee)' });
      }
      console.error('❌ POST /api/references:', e.message);
      res.status(500).json({ error: 'Erreur lors de la création de la référence' });
    }
  });

  // Mise à jour
  app.put('/api/references/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_reference FROM projets_references WHERE id_reference = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Référence introuvable' });

      const payload = req.body || {};
      if (!payload.nom_projet || !payload.client) {
        return res.status(400).json({ error: 'Champs requis: nom_projet, client' });
      }
      const annee = Number(payload.annee);
      if (!Number.isInteger(annee)) {
        return res.status(400).json({ error: 'Champ requis: annee (nombre)' });
      }

      const updateFields = {
        nom_projet: payload.nom_projet,
        ville: payload.ville || '',
        annee,
        type_mission: payload.type_mission || '',
        montant: payload.montant ?? null,
        description_courte: payload.description_projet || '',
        client: payload.client,
        duree_mois: payload.duree_mois ?? null,
        surface: payload.surface ?? null,
      };

      try {
        await dbManager.updateReference(id, updateFields);
      } catch (err) {
        if (/UNIQUE/i.test(err?.message || '')) {
          // Conflit: chercher l'enregistrement existant (triplet identique)
          const duplicate = await dbManager.get(
            `SELECT id_reference FROM projets_references
             WHERE LOWER(TRIM(nom_projet)) = LOWER(TRIM(?))
               AND LOWER(TRIM(client)) = LOWER(TRIM(?))
               AND annee = ?
               AND id_reference <> ?`,
            [payload.nom_projet, payload.client, annee, id]
          );

          if (duplicate?.id_reference) {
            const keepId = duplicate.id_reference;
            try {
              await dbManager.run('BEGIN');
              await dbManager.run(
                `UPDATE OR IGNORE salaries_references
                 SET id_reference = ?
                 WHERE id_reference = ?`,
                [keepId, id]
              );
              await dbManager.run(
                `UPDATE projets_references
                 SET nom_projet = ?, ville = ?, annee = ?, type_mission = ?, montant = ?,
                     description_courte = ?, client = ?, duree_mois = ?, surface = ?,
                     date_modification = CURRENT_TIMESTAMP
                 WHERE id_reference = ?`,
                [
                  updateFields.nom_projet,
                  updateFields.ville,
                  updateFields.annee,
                  updateFields.type_mission,
                  updateFields.montant,
                  updateFields.description_courte,
                  updateFields.client,
                  updateFields.duree_mois,
                  updateFields.surface,
                  keepId,
                ]
              );
              await dbManager.run('DELETE FROM projets_references WHERE id_reference = ?', [id]);
              await dbManager.run('COMMIT');
            } catch (e2) {
              try { await dbManager.run('ROLLBACK'); } catch {}
              throw e2;
            }

            const merged = await dbManager.get('SELECT * FROM projets_references WHERE id_reference = ?', [keepId]);
            return res.json({ success: true, mergedIntoId: keepId, reference: merged });
          }

          await dbManager.deduplicateReferences();
          await dbManager.updateReference(id, updateFields);
        } else {
          throw err;
        }
      }

      const salaries = Array.isArray(payload.salaries) ? payload.salaries : [];
      if (salaries.length > 0) {
        try {
          await dbManager.replaceReferenceSalaries(id, salaries);
        } catch (e) {
          if (/FOREIGN KEY/i.test(e.message || '')) {
            return res.status(400).json({ error: 'Certains salariés n\'existent pas' });
          }
          throw e;
        }
      }

      const updated = await dbManager.get('SELECT * FROM projets_references WHERE id_reference = ?', [id]);
      res.json({ success: true, reference: updated });
    } catch (e) {
      if (/UNIQUE/i.test(e.message || '')) {
        return res.status(409).json({ error: "Conflit d'unicité (nom_projet + client + annee)" });
      }
      console.error('❌ PUT /api/references/:id:', e.message);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la référence' });
    }
  });

  // Suppression
  app.delete('/api/references/:id', async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      const existing = await dbManager.get('SELECT id_reference FROM projets_references WHERE id_reference = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Référence introuvable' });

      await dbManager.deleteReference(id);
      res.json({ success: true });
    } catch (e) {
      console.error('❌ DELETE /api/references/:id:', e.message);
      res.status(500).json({ error: 'Erreur lors de la suppression de la référence' });
    }
  });
};

module.exports = { registerReferencesRoutes };