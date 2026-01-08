const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const dbManager = require('../database/database');

function toBool(v) {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim().toLowerCase();
  return ['1', 'true', 'vrai', 'oui', 'yes', 'y'].includes(s) ? true
       : ['0', 'false', 'faux', 'non', 'no', 'n'].includes(s) ? false
       : undefined;
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map(h => h.trim());
  const rows = lines.slice(1).map(l => {
    const cols = l.split(sep);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] !== undefined ? cols[i].trim() : ''; });
    return obj;
  });
  return { headers, rows };
}

function resolveCol(obj, names) {
  for (const n of names) {
    const key = Object.keys(obj).find(k => k.toLowerCase() === n.toLowerCase());
    if (key) return obj[key];
  }
  return undefined;
}

const registerImportRoutes = (app, { upload }) => {
  // Import références (champ fichier: 'file')
  app.post('/api/import-references', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu (champ 'file' requis)" });

      const lower = (req.file.originalname || '').toLowerCase();
      if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
        try { if (req.file.path) fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: 'Le fichier doit être un .xlsx ou .xls' });
      }

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(req.file.path);
      const ws = wb.worksheets[0];
      if (!ws) throw new Error('Onglet Excel introuvable');

      const isRowEmpty = (row) => {
        for (let c = 1; c <= ws.columnCount; c++) {
          const v = row.getCell(c).value;
          if (v !== null && v !== undefined && String(v).trim() !== '') return false;
        }
        return true;
      };
      let headerRowIndex = 1;
      while (headerRowIndex <= ws.rowCount && isRowEmpty(ws.getRow(headerRowIndex))) headerRowIndex++;
      if (headerRowIndex > ws.rowCount) throw new Error('Aucune ligne d\'en-têtes trouvée');

      const headerRow = ws.getRow(headerRowIndex);
      const findCol = (names) => {
        for (let c = 1; c <= ws.columnCount; c++) {
          const label = String(headerRow.getCell(c).value ?? '').trim().toLowerCase();
          for (const n of names) if (label === n.toLowerCase()) return c;
        }
        return -1;
      };

      const cNom = findCol(['nom_projet', 'nom du projet', 'nom', 'projet']);
      const cClient = findCol(['client']);
      const cVille = findCol(['ville']);
      const cAnnee = findCol(['annee', 'année']);
      const cType = findCol(['type_mission', 'type de mission']);
      const cMontant = findCol([
        'montant','montant (€)','montant €','budget','cout','coût','amount','prix','valeur',
      ]);
      const cDesc = findCol(['description', 'description_courte', 'description projet', 'description_projet']);
      const cDuree = findCol(['duree_mois', 'durée (mois)', 'duree', 'durée']);
      const cSurface = findCol(['surface', 'superficie', 'area']);

      if (cNom === -1 || cClient === -1 || cAnnee === -1) {
        try { if (req.file.path) fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: "Colonnes minimales requises: Nom_Projet, Client, Annee" });
      }

      const getCell = (row, colIdx) => colIdx > -1 ? String(row.getCell(colIdx).value ?? '').trim() : '';
      const toNumber = (v) => {
        if (v === null || v === undefined) return undefined;
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        let s = String(v).toLowerCase().trim();
        if (!s) return undefined;

        let mult = 1;
        if (/meur\b/.test(s) || /\bm(€|eur)?\b/.test(s)) mult = 1_000_000;
        else if (/keur\b/.test(s) || /\bk(€|eur)?\b/.test(s)) mult = 1_000;

        s = s
          .replace(/eur|€|keur|meur|k€|m€/gi, '')
          .replace(/\s/g, '')
          .replace(/,/g, '.')
          .replace(/[^0-9.\-]/g, '');

        if (!s || s === '-' || s === '.' || s === '-.') return undefined;
        const n = Number(s);
        return Number.isFinite(n) ? n * mult : undefined;
      };

      const stats = { total: 0, added: 0, updated: 0, existing: 0, errors: 0 };
      const addedList = [];
      const updatedList = [];
      const duplicates = [];
      const errorsDetail = [];

      for (let r = headerRowIndex + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        if (isRowEmpty(row)) continue;

        const nom_projet = getCell(row, cNom);
        const client = getCell(row, cClient);
        const anneeRaw = getCell(row, cAnnee);
        const annee = Number(anneeRaw) || new Date().getFullYear();
        const ville = getCell(row, cVille);
        const type_mission = getCell(row, cType);
        const montant = cMontant > -1 ? toNumber(getCell(row, cMontant)) : undefined;
        const description = getCell(row, cDesc);
        const duree_mois = cDuree > -1 ? toNumber(getCell(row, cDuree)) : undefined;
        const surface = cSurface > -1 ? toNumber(getCell(row, cSurface)) : undefined;

        if (!nom_projet || !client) {
          stats.errors++;
          errorsDetail.push({ ligne: r, erreur: 'Nom_Projet/Client manquant', donnees: { nom_projet, client, annee, ville, type_mission } });
          continue;
        }

        stats.total++;

        const exists = await dbManager.get(
          `SELECT id_reference FROM projets_references WHERE lower(nom_projet)=lower(?) AND lower(client)=lower(?) AND annee = ?`,
          [nom_projet, client, annee]
        );
        if (exists) {
          const current = await dbManager.get(
            `SELECT nom_projet, ville, annee, type_mission, montant, description_courte, description_longue, client, duree_mois, surface 
             FROM projets_references 
             WHERE id_reference = ?`,
            [exists.id_reference]
          );

          if (!current) {
            stats.errors++;
            errorsDetail.push({
              ligne: r,
              erreur: "Référence existante introuvable en base",
              donnees: { nom_projet, client, annee },
            });
            continue;
          }

          const changedFields = [];
          const nextValues = {};

          if (ville && ville !== (current.ville || "")) {
            nextValues.ville = ville;
            changedFields.push("ville");
          }

          if (type_mission && type_mission !== (current.type_mission || "")) {
            nextValues.type_mission = type_mission;
            changedFields.push("type_mission");
          }

          if (description && description !== (current.description_courte || "")) {
            nextValues.description_courte = description;
            changedFields.push("description");
          }

          if (montant !== undefined && montant !== current.montant) {
            nextValues.montant = montant;
            changedFields.push("montant");
          }

          if (duree_mois !== undefined && duree_mois !== current.duree_mois) {
            nextValues.duree_mois = duree_mois;
            changedFields.push("duree_mois");
          }

          if (surface !== undefined && surface !== current.surface) {
            nextValues.surface = surface;
            changedFields.push("surface");
          }

          if (changedFields.length > 0) {
            await dbManager.updateReference(exists.id_reference, {
              nom_projet: current.nom_projet,
              ville: nextValues.ville ?? current.ville,
              annee: current.annee,
              type_mission: nextValues.type_mission ?? current.type_mission,
              montant: nextValues.montant !== undefined ? nextValues.montant : current.montant,
              description_courte: (nextValues.description_courte ?? current.description_courte) || "",
              description_longue: current.description_longue,
              client: current.client,
              duree_mois: nextValues.duree_mois !== undefined ? nextValues.duree_mois : current.duree_mois,
              surface: nextValues.surface !== undefined ? nextValues.surface : current.surface,
            });

            stats.updated++;
            updatedList.push({
              ligne: r,
              nom_projet,
              client,
              annee,
              champs_modifies: changedFields,
            });
          } else {
            stats.existing++;
            duplicates.push({ ligne: r, nom_projet, client, annee });
          }
          continue;
        }

        try {
          await dbManager.addReference({
            nom_projet, ville, annee, type_mission, montant,
            description_courte: description || '',
            client, duree_mois, surface
          });
          stats.added++;
          addedList.push({ nom_projet, client, ville, annee, type_mission });
        } catch (e) {
          if (/UNIQUE/i.test(e.message || '')) {
            stats.existing++;
            duplicates.push({ ligne: r, nom_projet, client, annee });
          } else {
            stats.errors++;
            errorsDetail.push({ ligne: r, erreur: e.message || 'Erreur insertion', donnees: { nom_projet, client, annee } });
          }
        }
      }

      try { if (req.file.path) fs.unlinkSync(req.file.path); } catch {}

      const importDetails = {
        statistiques: {
          fichier: req.file.originalname,
          lignes_traitees: stats.total,
          references_ajoutees: stats.added,
          references_mises_a_jour: stats.updated,
          references_existantes: stats.existing,
          erreurs: stats.errors,
          total_base: (await dbManager.get('SELECT COUNT(*) as c FROM projets_references')).c || 0,
        },
        erreurs_detaillees: errorsDetail,
        doublons_detectes: duplicates,
        references_ajoutees: addedList,
        references_mises_a_jour: updatedList,
        recommandations: [],
        total: stats.total,
        added: stats.added,
        updated: stats.updated,
        existing: stats.existing,
        errors: stats.errors,
        associations: 0,
        errorDetails: errorsDetail.map(e => e.erreur),
        missingSalaries: [],
        recommendations: [],
      };

      res.json({ stats, importDetails, message: 'Import références terminé' });
    } catch (e) {
      console.error('❌ import-references:', e.message);
      try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: "Erreur lors de l'import des références" });
    }
  });

  // Import fonctions (champ fichier: 'xlsx')
  app.post('/api/import-fonctions', upload.single('xlsx'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu (champ 'xlsx' requis)" });

      const lower = (req.file.originalname || '').toLowerCase();
      if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
        try { if (req.file.path) fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: 'Le fichier doit être un .xlsx ou .xls' });
      }

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(req.file.path);
      const ws = wb.worksheets[0];
      if (!ws) throw new Error('Onglet Excel introuvable');

      const isRowEmpty = (row) => {
        for (let c = 1; c <= ws.columnCount; c++) {
          const v = row.getCell(c).value;
          if (v !== null && v !== undefined && String(v).trim() !== '') return false;
        }
        return true;
      };
      let headerRowIndex = 1;
      while (headerRowIndex <= ws.rowCount && isRowEmpty(ws.getRow(headerRowIndex))) headerRowIndex++;
      if (headerRowIndex > ws.rowCount) throw new Error("Aucune ligne d'en-têtes trouvée");

      const headerRow = ws.getRow(headerRowIndex);
      const findCol = (names) => {
        for (let c = 1; c <= ws.columnCount; c++) {
          const label = String(headerRow.getCell(c).value ?? '').trim().toLowerCase();
          for (const n of names) if (label === n.toLowerCase()) return c;
        }
        return -1;
      };

      const cNom = findCol(['Fonction']);
      const cDesc = findCol(['Description']);

      if (cNom === -1) {
        try { if (req.file.path) fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: "Colonne 'Fonction' introuvable dans l'Excel" });
      }

      const getCell = (row, colIdx) => colIdx > -1 ? String(row.getCell(colIdx).value ?? '').trim() : '';

      const stats = { added: 0, existing: 0, errors: 0, count: 0 };
      for (let r = headerRowIndex + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        if (isRowEmpty(row)) continue;
        const nom = getCell(row, cNom);
        const description = getCell(row, cDesc);
        if (!nom) { stats.errors++; continue; }
        const exists = await dbManager.get('SELECT id_fonction FROM fonctions WHERE lower(nom)=lower(?)', [nom]);
        if (exists) {
          stats.existing++;
        } else {
          try {
            await dbManager.addFonction({ nom, description: description || null, actif: 1 });
            stats.added++;
          } catch (e) {
            if (/UNIQUE/i.test(e.message || '')) {
              stats.existing++;
            } else {
              stats.errors++;
            }
          }
        }
      }
      stats.count = stats.added + stats.existing;

      try { if (req.file.path) fs.unlinkSync(req.file.path); } catch {}

      res.json(stats);
    } catch (e) {
      console.error('❌ import-fonctions:', e.message);
      try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: "Erreur lors de l'import des fonctions" });
    }
  });

  // Import salariés (.xlsx/.xls/.csv) — champ 'file'
  app.post('/api/import-salaries', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Fichier manquant (champ 'file)." });

      const ext = (req.file.originalname || '').toLowerCase();
      const stats = { total: 0, added: 0, existing: 0, errors: 0 };
      const errors = [];

      const upsertBy = async (row) => {
        const nom = row.nom?.trim();
        const prenom = row.prenom?.trim();
        const agence = row.agence?.trim() || null;
        const fonction = row.fonction?.trim() || null;
        const niveau = row.niveau_expertise?.trim() || row.niveau?.trim() || null;
        const email = row.email?.trim() || null;
        const telephone = row.telephone?.trim() || null;
        const actif = typeof row.actif === 'boolean' ? row.actif : toBool(row.actif);

        if (!nom || !prenom) {
          stats.errors++;
          errors.push(`Ligne ignorée: nom/prenom manquants (email=${email || '—'})`);
          return;
        }

        let existing = null;
        if (email) {
          existing = await dbManager.get('SELECT * FROM salaries WHERE lower(email)=lower(?)', [email]);
        }
        if (!existing) {
          existing = await dbManager.get(
            'SELECT * FROM salaries WHERE lower(nom)=lower(?) AND lower(prenom)=lower(?)',
            [nom, prenom]
          );
        }

        const payload = {
          nom,
          prenom,
          agence,
          fonction,
          niveau_expertise: niveau,
          email,
          telephone,
          actif: actif !== undefined ? actif : true,
        };

        if (!existing) {
          await dbManager.addSalarie(payload);
          stats.added++;
        } else {
          await dbManager.updateSalarie(existing.id_salarie, payload);
          stats.existing++;
        }
      };

      if (ext.endsWith('.csv')) {
        const { rows } = parseCsv(req.file.path);
        stats.total = rows.length;
        for (const r of rows) {
          const row = {
            nom: resolveCol(r, ['Nom']),
            prenom: resolveCol(r, ['Prenom', 'Prénom', 'Prénom*', 'Prenom*']),
            agence: resolveCol(r, ['Agence']),
            fonction: resolveCol(r, ['Fonction']),
            niveau_expertise: resolveCol(r, ['Niveau_Expertise', 'Niveau']),
            email: resolveCol(r, ['Email', 'E-mail']),
            telephone: resolveCol(r, ['Telephone', 'Téléphone', 'Tel']),
            actif: resolveCol(r, ['Actif']),
          };
          await upsertBy(row);
        }
      } else {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(req.file.path);
        const ws = wb.worksheets[0];
        if (!ws) throw new Error('Onglet Excel introuvable');

        let headerRowIndex = 1;
        const isRowEmpty = (row) => {
          for (let c = 1; c <= ws.columnCount; c++) {
            const v = row.getCell(c).value;
            if (v !== null && v !== undefined && String(v).trim() !== '') return false;
          }
          return true;
        };
        while (headerRowIndex <= ws.rowCount && isRowEmpty(ws.getRow(headerRowIndex))) {
          headerRowIndex++;
        }
        if (headerRowIndex > ws.rowCount) throw new Error("Aucune ligne d'en-têtes trouvée");

        const headerRow = ws.getRow(headerRowIndex);

        const findCol = (names) => {
          for (let c = 1; c <= ws.columnCount; c++) {
            const label = String(headerRow.getCell(c).value ?? '').trim().toLowerCase();
            for (const n of names) {
              if (label === n.toLowerCase()) return c;
            }
          }
          return -1;
        };

        const cNom = findCol(['Nom']);
        const cPrenom = findCol(['Prenom', 'Prénom']);
        const cAgence = findCol(['Agence']);
        const cFonction = findCol(['Fonction']);
        const cNiveau = findCol(['Niveau_Expertise', 'Niveau']);
        const cEmail = findCol(['Email', 'E-mail']);
        const cTel = findCol(['Telephone', 'Téléphone', 'Tel']);
        const cActif = findCol(['Actif']);

        const getCell = (row, colIdx) =>
          colIdx > -1 ? String(row.getCell(colIdx).value ?? '').trim() : undefined;

        const startRowIndex = headerRowIndex + 1;
        const rows = [];
        for (let r = startRowIndex; r <= ws.rowCount; r++) {
          const row = ws.getRow(r);
          if (isRowEmpty(row)) continue;
          const rec = {
            nom: getCell(row, cNom),
            prenom: getCell(row, cPrenom),
            agence: getCell(row, cAgence),
            fonction: getCell(row, cFonction),
            niveau_expertise: getCell(row, cNiveau),
            email: getCell(row, cEmail),
            telephone: getCell(row, cTel),
            actif: getCell(row, cActif),
          };
          if (rec.nom || rec.prenom || rec.email) rows.push(rec);
        }

        stats.total = rows.length;
        for (const row of rows) {
          await upsertBy(row);
        }
      }

      try { fs.unlinkSync(req.file.path); } catch {}

      const details = {
        statistiques: {
          fichier: req.file.originalname,
          lignes_traitees: stats.total,
          salaries_ajoutes: stats.added,
          salaries_existants: stats.existing,
          erreurs: stats.errors,
          total_base: (await dbManager.get('SELECT COUNT(*) as c FROM salaries')).c || 0,
        },
        erreurs_detaillees: errors.map((e, i) => ({ ligne: i + 1, erreur: e })),
      };

      res.json({
        stats,
        importDetails: details,
        message: 'Import salariés terminé',
      });
    } catch (e) {
      console.error('❌ import-salaries:', e.message);
      try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ message: "Erreur lors de l'import des salariés", error: e.message });
    }
  });

  // Import associations (CSV/Excel) — champ 'file'
  app.post('/api/import-associations', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu (champ 'file' requis)" });
      const nameLower = String(req.file.originalname || '').toLowerCase();
      const isCsv = nameLower.endsWith('.csv');
      const stats = { total: 0, linked: 0, skipped: 0, errors: 0 };
      const details = { erreurs_detaillees: [], manquants_salaries: [], manquants_references: [], ajoutes: [], deja_associes: [] };

      const normalizeKey = (s) => String(s || '')
        .replace(/^\uFEFF/, '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\*/g, '')
        .replace(/\s+/g, ' ');

      const resolveColKey = (obj, names) => {
        const keys = Object.keys(obj);
        const normalizedMap = new Map(keys.map(k => [normalizeKey(k), k]));
        for (const n of names) {
          const nk = normalizeKey(n);
          if (normalizedMap.has(nk)) return normalizedMap.get(nk);
        }
        return null;
      };

      const resolveSalarie = async (row) => {
        let idKey = resolveColKey(row, ['id_salarie', 'idsalarie', 'id salarié', 'id', 'id employe', 'id employé']);
        if (idKey && row[idKey]) {
          const id = String(row[idKey]).trim();
          if (id) {
            const exists = await dbManager.get('SELECT id_salarie FROM salaries WHERE id_salarie = ?', [id]);
            if (exists) return String(exists.id_salarie);
          }
        }
        const emailKey = resolveColKey(row, ['email', 'e-mail', 'mail', 'courriel']);
        if (emailKey && row[emailKey]) {
          const email = String(row[emailKey]).trim();
          if (email) {
            const exists = await dbManager.get('SELECT id_salarie FROM salaries WHERE lower(email) = lower(?)', [email]);
            if (exists) return String(exists.id_salarie);
          }
        }
        const nomKey = resolveColKey(row, ['nom']);
        const prenomKey = resolveColKey(row, ['prenom', 'prénom', 'prenom*', 'prénom*']);
        const nom = nomKey ? String(row[nomKey] || '').trim() : '';
        const prenom = prenomKey ? String(row[prenomKey] || '').trim() : '';
        if (nom && prenom) {
          const exists = await dbManager.get(
            'SELECT id_salarie FROM salaries WHERE lower(nom)=lower(?) AND lower(prenom)=lower(?)',
            [nom, prenom]
          );
          if (exists) return String(exists.id_salarie);
        }
        return null;
      };

      const resolveReference = async (row) => {
        let idKey = resolveColKey(row, ['id_reference', 'idreference', 'id référence']);
        if (idKey && row[idKey]) {
          const id = String(row[idKey]).trim();
          if (id) {
            const exists = await dbManager.get('SELECT id_reference FROM projets_references WHERE id_reference = ?', [id]);
            if (exists) return String(exists.id_reference);
          }
        }
        const nomKey = resolveColKey(row, ['nom_projet', 'nom du projet', 'projet', 'nom']);
        const clientKey = resolveColKey(row, ['client']);
        const anneeKey = resolveColKey(row, ['annee', 'année']);
        const nom_projet = nomKey ? String(row[nomKey] || '').trim() : '';
        const client = clientKey ? String(row[clientKey] || '').trim() : '';
        const annee = anneeKey ? Number(String(row[anneeKey] || '').trim()) : NaN;
        if (nom_projet && client && Number.isFinite(annee)) {
          const exists = await dbManager.get(
            `SELECT id_reference FROM projets_references
             WHERE lower(nom_projet)=lower(?) AND lower(client)=lower(?) AND annee = ?`,
            [nom_projet, client, annee]
          );
          if (exists) return String(exists.id_reference);
        }
        return null;
      };

      const normalizeBool = (v) => {
        const s = String(v ?? '').trim().toLowerCase();
        return ['1','true','vrai','oui','yes','y'].includes(s) ? 1
             : ['0','false','faux','non','no','n'].includes(s) ? 0
             : 0;
      };

      const insertAssociation = async ({ idSalarie, idReference, row }) => {
        const roleKey = resolveColKey(row, ['role_projet', 'role']);
        const debutKey = resolveColKey(row, ['date_debut', 'debut', 'début', 'date debut']);
        const finKey = resolveColKey(row, ['date_fin', 'fin', 'date fin']);
        const principalKey = resolveColKey(row, ['principal', 'is_principal']);

        const role = roleKey ? String(row[roleKey] || '').trim() : null;
        const date_debut = debutKey ? String(row[debutKey] || '').trim() || null : null;
        const date_fin = finKey ? String(row[finKey] || '').trim() || null : null;
        const principal = principalKey ? normalizeBool(row[principalKey]) : 0;

        const existing = await dbManager.get(
          `SELECT id FROM salaries_references WHERE id_salarie = ? AND id_reference = ?`,
          [idSalarie, idReference]
        );
        if (existing) {
          details.deja_associes.push({ id_salarie: idSalarie, id_reference: idReference });
          return 'exists';
        }

        await dbManager.run(
          `INSERT OR IGNORE INTO salaries_references (id_salarie, id_reference, role_projet, date_debut, date_fin, principal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [idSalarie, idReference, role || null, date_debut, date_fin, principal]
        );

        details.ajoutes.push({ id_salarie: idSalarie, id_reference: idReference, principal });
        return 'inserted';
      };

      if (isCsv) {
        const { rows } = parseCsv(req.file.path);
        stats.total = rows.length;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const idSalarie = await resolveSalarie(row);
            if (!idSalarie) {
              stats.skipped++;
              details.manquants_salaries.push({ ligne: i + 2, row });
              continue;
            }
            const idReference = await resolveReference(row);
            if (!idReference) {
              stats.skipped++;
              details.manquants_references.push({ ligne: i + 2, row });
              continue;
            }
            const resIns = await insertAssociation({ idSalarie, idReference, row });
            if (resIns === 'inserted') stats.linked++;
          } catch (e) {
            stats.errors++;
            details.erreurs_detaillees.push({ ligne: i + 2, erreur: e.message || 'Erreur inconnue' });
          }
        }
      } else {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(req.file.path);
        const ws = wb.worksheets[0];
        if (!ws) throw new Error('Onglet Excel introuvable');

        const isRowEmpty = (row) => {
          for (let c = 1; c <= ws.columnCount; c++) {
            const v = row.getCell(c).value;
            if (v !== null && v !== undefined && String(v).trim() !== '') return false;
          }
          return true;
        };
        let headerRowIndex = 1;
        while (headerRowIndex <= ws.rowCount && isRowEmpty(ws.getRow(headerRowIndex))) headerRowIndex++;
        if (headerRowIndex > ws.rowCount) throw new Error("Aucune ligne d'en-têtes trouvée");
        const headerRow = ws.getRow(headerRowIndex);

        const headers = [];
        for (let c = 1; c <= ws.columnCount; c++) {
          headers.push(String(headerRow.getCell(c).value ?? '').trim());
        }

        const readRowAsObj = (row) => {
          const obj = {};
          for (let c = 1; c <= ws.columnCount; c++) {
            obj[headers[c - 1] || `col_${c}`] = String(row.getCell(c).value ?? '').trim();
          }
          return obj;
        };

        let count = 0;
        for (let r = headerRowIndex + 1; r <= ws.rowCount; r++) {
          const row = ws.getRow(r);
          if (isRowEmpty(row)) continue;
          count++;
          const obj = readRowAsObj(row);
          try {
            const idSalarie = await resolveSalarie(obj);
            if (!idSalarie) {
              stats.skipped++;
              details.manquants_salaries.push({ ligne: r, row: obj });
              continue;
            }
            const idReference = await resolveReference(obj);
            if (!idReference) {
              stats.skipped++;
              details.manquants_references.push({ ligne: r, row: obj });
              continue;
            }
            const resIns = await insertAssociation({ idSalarie, idReference, row: obj });
            if (resIns === 'inserted') stats.linked++;
          } catch (e) {
            stats.errors++;
            details.erreurs_detaillees.push({ ligne: r, erreur: e.message || 'Erreur inconnue' });
          }
        }
        stats.total = count;
      }

      try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}

      res.json({
        message: 'Import associations terminé',
        stats,
        importDetails: {
          statistiques: {
            fichier: req.file.originalname,
            lignes_traitees: stats.total,
            associations_ajoutees: stats.linked,
            deja_associes: details.deja_associes.length,
            erreurs: stats.errors,
            manquants_salaries: details.manquants_salaries.length,
            manquants_references: details.manquants_references.length,
            total_base_associations: (await dbManager.get('SELECT COUNT(*) as c FROM salaries_references')).c || 0,
          },
          ...details,
        },
      });
    } catch (e) {
      console.error('❌ import-associations:', e.message);
      try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: "Erreur lors de l'import des associations" });
    }
  });
};

module.exports = { registerImportRoutes };