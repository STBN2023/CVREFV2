const ExcelJS = require('exceljs');
const dbManager = require('../database/database');

const registerExportRoutes = (app) => {
  // Export références (Excel)
  app.get('/api/export-references', async (_req, res) => {
    try {
      const references = await dbManager.getAllReferences();
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('References');
      ws.columns = [
        { header: 'Nom_Projet', key: 'nom_projet', width: 40 },
        { header: 'Client', key: 'client', width: 30 },
        { header: 'Ville', key: 'ville', width: 20 },
        { header: 'Annee', key: 'annee', width: 10 },
        { header: 'Type_Mission', key: 'type_mission', width: 20 },
        { header: 'Montant', key: 'montant', width: 18 },
        { header: 'Description', key: 'description', width: 60 },
        { header: 'Duree_Mois', key: 'duree_mois', width: 12 },
        { header: 'Surface', key: 'surface', width: 12 },
      ];
      references.forEach((r) =>
        ws.addRow({
          nom_projet: r.nom_projet || '',
          client: r.client || '',
          ville: r.ville || '',
          annee: r.annee || '',
          type_mission: r.type_mission || '',
          montant: r.montant ?? '',
          description: r.description_projet || r.description_courte || '',
          duree_mois: r.duree_mois ?? '',
          surface: r.surface ?? '',
        })
      );
      const buf = await workbook.xlsx.writeBuffer();
      const filename = `references_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buf));
    } catch (e) {
      console.error('❌ export references:', e.message);
      res.status(500).json({ error: "Erreur lors de l'export des références" });
    }
  });

  // Export salariés (Excel)
  app.get('/api/export-salaries', async (_req, res) => {
    try {
      const salaries = await dbManager.getAllSalaries();
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Salaries');
      ws.columns = [
        { header: 'ID_Salarie', key: 'id_salarie', width: 12 },
        { header: 'Nom', key: 'nom', width: 20 },
        { header: 'Prenom', key: 'prenom', width: 20 },
        { header: 'Agence', key: 'agence', width: 20 },
        { header: 'Fonction', key: 'fonction', width: 24 },
        { header: 'Niveau_Expertise', key: 'niveau_expertise', width: 22 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Telephone', key: 'telephone', width: 18 },
        { header: 'Actif', key: 'actif', width: 10 },
        { header: 'Date_Creation', key: 'date_creation', width: 22 },
      ];
      for (const s of salaries) {
        ws.addRow({
          id_salarie: s.id_salarie,
          nom: s.nom || '',
          prenom: s.prenom || '',
          agence: s.agence || '',
          fonction: s.fonction || '',
          niveau_expertise: s.niveau_expertise || '',
          email: s.email || '',
          telephone: s.telephone || '',
          actif: s.actif ? 1 : 0,
          date_creation: s.date_creation || '',
        });
      }
      const buf = await workbook.xlsx.writeBuffer();
      const filename = `salaries_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buf));
    } catch (e) {
      console.error('❌ export salaries:', e.message);
      res.status(500).json({ error: 'Erreur lors de l\'export des salariés' });
    }
  });

  // Export associations (Excel)
  app.get('/api/export-associations', async (_req, res) => {
    try {
      const rows = await dbManager.all(`
        SELECT 
          s.id_salarie, s.nom, s.prenom, s.agence, s.fonction, s.niveau_expertise, s.email, s.telephone,
          pr.id_reference, pr.nom_projet, pr.client, pr.ville, pr.annee, pr.type_mission, pr.montant,
          sr.role_projet, sr.date_debut, sr.date_fin, sr.principal
        FROM salaries_references sr
        JOIN salaries s ON s.id_salarie = sr.id_salarie
        JOIN projets_references pr ON pr.id_reference = sr.id_reference
        ORDER BY s.nom, s.prenom, pr.annee DESC, pr.nom_projet
      `);

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Associations');
      ws.columns = [
        { header: 'Salarie_ID', key: 'id_salarie', width: 12 },
        { header: 'Nom', key: 'nom', width: 18 },
        { header: 'Prenom', key: 'prenom', width: 18 },
        { header: 'Agence', key: 'agence', width: 18 },
        { header: 'Fonction', key: 'fonction', width: 22 },
        { header: 'Niveau_Expertise', key: 'niveau_expertise', width: 20 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Telephone', key: 'telephone', width: 16 },
        { header: 'Reference_ID', key: 'id_reference', width: 14 },
        { header: 'Nom_Projet', key: 'nom_projet', width: 32 },
        { header: 'Client', key: 'client', width: 24 },
        { header: 'Ville', key: 'ville', width: 18 },
        { header: 'Annee', key: 'annee', width: 10 },
        { header: 'Type_Mission', key: 'type_mission', width: 20 },
        { header: 'Montant', key: 'montant', width: 16 },
        { header: 'Role_Projet', key: 'role_projet', width: 22 },
        { header: 'Date_Debut', key: 'date_debut', width: 14 },
        { header: 'Date_Fin', key: 'date_fin', width: 14 },
        { header: 'Principal', key: 'principal', width: 10 },
      ];

      for (const r of rows) {
        ws.addRow({
          id_salarie: r.id_salarie,
          nom: r.nom || '',
          prenom: r.prenom || '',
          agence: r.agence || '',
          fonction: r.fonction || '',
          niveau_expertise: r.niveau_expertise || '',
          email: r.email || '',
          telephone: r.telephone || '',
          id_reference: r.id_reference,
          nom_projet: r.nom_projet || '',
          client: r.client || '',
          ville: r.ville || '',
          annee: r.annee ?? '',
          type_mission: r.type_mission || '',
          montant: r.montant ?? '',
          role_projet: r.role_projet || '',
          date_debut: r.date_debut || '',
          date_fin: r.date_fin || '',
          principal: r.principal ? 1 : 0,
        });
      }

      const buf = await workbook.xlsx.writeBuffer();
      const filename = `associations_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buf));
    } catch (e) {
      console.error('❌ export associations:', e.message);
      res.status(500).json({ error: 'Erreur lors de l\'export des associations' });
    }
  });
};

module.exports = { registerExportRoutes };