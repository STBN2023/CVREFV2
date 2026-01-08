const fs = require('fs');
const path = require('path');
const dbManager = require('../database/database');
const { safeFilename } = require('../utils/pptx');

const registerAdminDbRoutes = (app, { backupsDir, dbFilePath, downloadsDir, ADMIN_PASSWORD, upload }) => {
  // Stats DB
  app.get('/api/admin/db/stats', async (_req, res) => {
    try {
      const salaries = await dbManager.get('SELECT COUNT(*) as c FROM salaries');
      const references = await dbManager.get('SELECT COUNT(*) as c FROM projets_references');
      const associations = await dbManager.get('SELECT COUNT(*) as c FROM salaries_references');
      const dbSize = fs.existsSync(dbFilePath) ? fs.statSync(dbFilePath).size : 0;
      const downloads = fs.existsSync(downloadsDir)
        ? fs.readdirSync(downloadsDir).filter(f => f.toLowerCase().endsWith('.pptx')).length
        : 0;
      res.json({
        salaries: salaries?.c || 0,
        references: references?.c || 0,
        associations: associations?.c || 0,
        dbSize,
        downloads,
        dbPath: dbFilePath,
      });
    } catch (e) {
      console.error('❌ stats:', e.message);
      res.status(500).json({ error: 'Erreur stats DB' });
    }
  });

  // Maintenance
  app.post('/api/admin/db/integrity', async (_req, res) => {
    try {
      const row = await dbManager.get('PRAGMA integrity_check');
      const key = Object.keys(row || {})[0] || 'result';
      res.json({ result: row?.[key] || 'unknown' });
    } catch (e) {
      console.error('❌ integrity:', e.message);
      res.status(500).json({ error: 'Erreur integrity_check' });
    }
  });

  app.post('/api/admin/db/vacuum', async (_req, res) => {
    try {
      await dbManager.run('VACUUM');
      const size = fs.existsSync(dbFilePath) ? fs.statSync(dbFilePath).size : 0;
      res.json({ success: true, dbSize: size });
    } catch (e) {
      console.error('❌ vacuum:', e.message);
      res.status(500).json({ error: 'Erreur VACUUM' });
    }
  });

  app.post('/api/admin/db/analyze', async (_req, res) => {
    try {
      await dbManager.run('ANALYZE');
      res.json({ success: true });
    } catch (e) {
      console.error('❌ analyze:', e.message);
      res.status(500).json({ error: 'Erreur ANALYZE' });
    }
  });

  app.post('/api/admin/db/reindex', async (_req, res) => {
    try {
      await dbManager.run('REINDEX');
      res.json({ success: true });
    } catch (e) {
      console.error('❌ reindex:', e.message);
      res.status(500).json({ error: 'Erreur REINDEX' });
    }
  });

  app.post('/api/admin/db/cleanup-orphans', async (_req, res) => {
    try {
      const res1 = await dbManager.run(
        `DELETE FROM salaries_references
         WHERE id_salarie NOT IN (SELECT id_salarie FROM salaries)
            OR id_reference NOT IN (SELECT id_reference FROM projets_references)`
      );
      res.json({ success: true, removed: res1?.changes || 0 });
    } catch (e) {
      console.error('❌ cleanup-orphans:', e.message);
      res.status(500).json({ error: 'Erreur cleanup orphans' });
    }
  });

  // Déduplication
  app.post('/api/admin/references/deduplicate', async (_req, res) => {
    try {
      const result = await dbManager.deduplicateReferences();
      res.json({ success: true, ...result });
    } catch (e) {
      console.error('❌ deduplicate references:', e.message);
      res.status(500).json({ error: 'Erreur lors de la déduplication des références', details: e.message });
    }
  });

  // Backups helpers
  function getBackupFiles() {
    if (!fs.existsSync(backupsDir)) return [];
    return fs
      .readdirSync(backupsDir)
      .filter(
        (f) =>
          f.toLowerCase().endsWith('.db') ||
          f.toLowerCase().endsWith('.sqlite') ||
          f.toLowerCase().endsWith('.sqlite3')
      )
      .map((f) => {
        const full = path.join(backupsDir, f);
        const st = fs.statSync(full);
        return {
          filename: f,
          fullPath: full,
          sizeBytes: st.size,
          createdAt: st.birthtimeMs || st.mtimeMs || st.ctimeMs || 0,
        };
      });
  }

  function pruneBackups(limit = 5) {
    try {
      const files = getBackupFiles().sort((a, b) => b.createdAt - a.createdAt);
      for (let i = limit; i < files.length; i++) {
        try {
          fs.unlinkSync(files[i].fullPath);
          console.log(`🧹 [DB BACKUP] Purge ancienne sauvegarde: ${files[i].filename}`);
        } catch (e) {
          console.warn(`⚠️ [DB BACKUP] Échec suppression ${files[i].filename}:`, e.message);
        }
      }
    } catch (e) {
      console.warn('⚠️ [DB BACKUP] Prune error:', e.message);
    }
  }

  // Créer une sauvegarde
  app.post('/api/admin/db/backup', async (_req, res) => {
    try {
      if (!fs.existsSync(dbFilePath)) {
        return res.status(404).json({ error: 'Base de données introuvable' });
      }
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `db-backup_${ts}.db`;
      const dest = path.join(backupsDir, filename);
      fs.copyFileSync(dbFilePath, dest);
      const stat = fs.statSync(dest);
      console.log(`💾 [DB BACKUP] Créé: ${dest} (${stat.size} bytes)`);

      pruneBackups(5);

      res.json({ filename, sizeBytes: stat.size, createdAt: stat.birthtimeMs || stat.mtimeMs });
    } catch (e) {
      console.error('❌ backup:', e.message);
      res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
  });

  // Lister les sauvegardes
  app.get('/api/admin/db/backups', async (_req, res) => {
    try {
      pruneBackups(5);
      const files = getBackupFiles()
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(({ filename, sizeBytes, createdAt }) => ({ filename, sizeBytes, createdAt }));

      res.json({ backups: files });
    } catch (e) {
      console.error('❌ list backups:', e.message);
      res.status(500).json({ error: 'Erreur liste sauvegardes' });
    }
  });

  // Télécharger une sauvegarde
  app.get('/api/admin/db/backup/:filename', async (req, res) => {
    try {
      const filename = safeFilename(req.params.filename);
      const filePath = path.join(backupsDir, filename);
      console.log(`[DB BACKUP] Download request: "${req.params.filename}" -> safe="${filename}" path="${filePath}"`);
      if (!fs.existsSync(filePath)) {
        console.warn(`[DB BACKUP] 404 Not Found: "${filePath}"`);
        return res.status(404).json({ error: 'Sauvegarde introuvable', filename, path: filePath });
      }
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(filePath);
    } catch (e) {
      console.error('❌ download backup:', e.message);
      res.status(500).json({ error: 'Erreur téléchargement sauvegarde' });
    }
  });

  // Supprimer une sauvegarde
  app.delete('/api/admin/db/backup/:filename', async (req, res) => {
    try {
      const filename = safeFilename(req.params.filename);
      const filePath = path.join(backupsDir, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Sauvegarde introuvable' });
      }
      fs.unlinkSync(filePath);
      console.log(`🗑️ [DB BACKUP] Supprimé: ${filePath}`);
      res.json({ success: true });
    } catch (e) {
      console.error('❌ delete backup:', e.message);
      res.status(500).json({ error: 'Erreur suppression sauvegarde' });
    }
  });

  // Import/restore d'une base locale (.db/.sqlite/.sqlite3) — via upload
  app.post('/api/admin/db/restore-upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu (champ 'file' requis)" });

      const orig = (req.file.originalname || '').toLowerCase();
      const ext = path.extname(orig);
      const allowed = ['.db', '.sqlite', '.sqlite3'];
      if (!allowed.includes(ext)) {
        try { if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ error: "Format invalide. Attendu: .db, .sqlite ou .sqlite3" });
      }

      try {
        if (fs.existsSync(dbFilePath)) {
          const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const backupName = `db-backup_pre-upload_${ts}.db`;
          const dest = path.join(backupsDir, backupName);
          fs.copyFileSync(dbFilePath, dest);
          console.log(`💾 [DB BACKUP] Pre-upload backup créé: ${dest}`);
        }
      } catch (e) {
        console.warn('⚠️ [DB BACKUP] Échec backup pré-restauration:', e?.message);
      }

      try { await dbManager.close(); } catch (e) { console.warn('⚠️ close DB:', e?.message); }

      fs.copyFileSync(req.file.path, dbFilePath);
      try { if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}

      dbManager.isInitialized = false;
      dbManager.db = null;
      try { await dbManager.initialize(); } catch (e) {
        console.error('❌ init DB après import:', e?.message);
        return res.status(500).json({ error: 'Erreur réouverture DB après import' });
      }

      const salaries = await dbManager.get('SELECT COUNT(*) as c FROM salaries');
      const references = await dbManager.get('SELECT COUNT(*) as c FROM projets_references');
      const associations = await dbManager.get('SELECT COUNT(*) as c FROM salaries_references');
      const dbSize = fs.existsSync(dbFilePath) ? fs.statSync(dbFilePath).size : 0;

      res.json({
        success: true,
        message: 'Base importée et restaurée avec succès',
        originalFilename: orig,
        stats: {
          salaries: salaries?.c || 0,
          references: references?.c || 0,
          associations: associations?.c || 0,
          dbSize,
          dbPath: dbFilePath,
        },
      });
    } catch (e) {
      console.error('❌ restore-upload:', e?.message);
      try { if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: "Erreur lors de l'import de la base" });
    }
  });

  // Restauration DB depuis une sauvegarde existante
  app.post('/api/admin/db/restore', async (req, res) => {
    try {
      const { filename } = req.body || {};
      console.log(`[DB RESTORE] Requested filename: "${filename}"`);
      if (!filename || String(filename).trim() === '') {
        return res.status(400).json({ error: "Paramètre 'filename' requis" });
      }
      const safe = safeFilename(String(filename));
      const srcPath = path.join(backupsDir, safe);
      console.log(`[DB RESTORE] Resolved path: "${srcPath}" (backupsDir="${backupsDir}")`);
      if (!fs.existsSync(srcPath)) {
        console.warn(`[DB RESTORE] 404 Not Found: "${srcPath}"`);
        return res.status(404).json({ error: 'Sauvegarde introuvable', filename: safe, path: srcPath });
      }

      try { await dbManager.close(); } catch (e) { console.warn('⚠️ close DB:', e?.message); }

      fs.copyFileSync(srcPath, dbFilePath);
      console.log(`[DB RESTORE] Copied backup -> db: "${srcPath}" -> "${dbFilePath}"`);

      dbManager.isInitialized = false;
      dbManager.db = null;

      try { await dbManager.initialize(); } catch (e) {
        console.error('❌ init DB après restauration:', e?.message);
        return res.status(500).json({ error: 'Erreur réouverture DB après restauration' });
      }

      const salaries = await dbManager.get('SELECT COUNT(*) as c FROM salaries');
      const references = await dbManager.get('SELECT COUNT(*) as c FROM projets_references');
      const associations = await dbManager.get('SELECT COUNT(*) as c FROM salaries_references');
      const dbSize = fs.existsSync(dbFilePath) ? fs.statSync(dbFilePath).size : 0;

      res.json({
        success: true,
        restoredFrom: safe,
        stats: {
          salaries: salaries?.c || 0,
          references: references?.c || 0,
          associations: associations?.c || 0,
          dbSize,
          dbPath: dbFilePath,
        },
        message: 'Base restaurée avec succès',
      });
    } catch (e) {
      console.error('❌ restore DB:', e?.message);
      res.status(500).json({ error: 'Erreur lors de la restauration de la base' });
    }
  });

  // Reset protégé
  app.post('/api/admin/reset', async (req, res) => {
    try {
      const { password, target } = req.body || {};
      if (!password || String(password) !== String(ADMIN_PASSWORD)) {
        return res.status(401).json({ error: 'Mot de passe administrateur invalide' });
      }
      const t = String(target || '').toLowerCase();
      if (!['salaries', 'references', 'all'].includes(t)) {
        return res.status(400).json({ error: "Paramètre 'target' invalide (attendu: salaries | references | all)" });
      }

      const runDelete = async (sql) => dbManager.run(sql);

      await dbManager.run('BEGIN');
      let result = { salaries: 0, references: 0, associations: 0 };
      if (t === 'salaries' || t === 'all') {
        const r1 = await runDelete('DELETE FROM salaries_references');
        const r2 = await runDelete('DELETE FROM salaries');
        result.associations += r1?.changes || 0;
        result.salaries += r2?.changes || 0;
      }
      if (t === 'references' || t === 'all') {
        const r1 = await runDelete('DELETE FROM salaries_references');
        const r2 = await runDelete('DELETE FROM projets_references');
        result.associations += r1?.changes || 0;
        result.references += r2?.changes || 0;
      }
      await dbManager.run('COMMIT');

      try { await dbManager.run('VACUUM'); } catch {}

      res.json({ success: true, cleared: t, details: result });
    } catch (e) {
      try { await dbManager.run('ROLLBACK'); } catch {}
      console.error('❌ admin reset:', e.message);
      res.status(500).json({ error: 'Erreur lors du reset administrateur' });
    }
  });
};

module.exports = { registerAdminDbRoutes };