const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function registerDownloadRoutes(app, ctx) {
  const { downloadsDir, safeFilename, SOFFICE_PATH } = ctx;

  const ensurePdfFromPptx = async (pptxFilename) => {
    if (!SOFFICE_PATH) {
      throw new Error('Conversion PDF indisponible (LibreOffice non configuré)');
    }

    const safePptx = safeFilename(pptxFilename);
    const pptxPath = path.join(downloadsDir, safePptx);
    if (!fs.existsSync(pptxPath)) {
      const error = new Error('Fichier source introuvable');
      error.statusCode = 404;
      throw error;
    }

    const pdfFilename = safeFilename(safePptx.replace(/\.pptx$/i, '.pdf'));
    const pdfPath = path.join(downloadsDir, pdfFilename);

    const pptStat = fs.statSync(pptxPath);
    let needsConversion = true;

    if (fs.existsSync(pdfPath)) {
      const pdfStat = fs.statSync(pdfPath);
      if (pdfStat.mtimeMs >= pptStat.mtimeMs) {
        needsConversion = false;
      }
    }

    if (needsConversion) {
      console.log('🔄 [DOWNLOAD] Conversion PDF via LibreOffice:', safePptx);
      await new Promise((resolve, reject) => {
        const sofficeCmd = SOFFICE_PATH.includes(' ') ? `"${SOFFICE_PATH}"` : SOFFICE_PATH;
        const cmd = `${sofficeCmd} --headless --convert-to pdf --outdir "${downloadsDir}" "${pptxPath}"`;
        exec(cmd, { windowsHide: true }, (err) => {
          if (err) return reject(new Error('Erreur LibreOffice lors de la conversion PDF'));
          if (!fs.existsSync(pdfPath)) return reject(new Error('PDF non généré par LibreOffice'));
          resolve();
        });
      });
    }

    return { pdfFilename, pdfPath };
  };

  app.get('/api/downloads', (req, res) => {
    console.log('📁 [DOWNLOADS] Liste des téléchargements demandée');
    try {
      const files = fs
        .readdirSync(downloadsDir)
        .filter((f) => f.endsWith('.pptx'))
        .map((f) => {
          const fullPath = path.join(downloadsDir, f);
          const stat = fs.statSync(fullPath);
          return {
            filename: f,
            sizeBytes: stat.size,
            createdAt: stat.birthtimeMs || stat.ctimeMs,
            formattedSize: `${Math.round(stat.size / 1024)} KB`,
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
      console.log('📊 [DOWNLOADS] Fichiers trouvés:', files.length);
      res.json({ files });
    } catch (error) {
      console.error('❌ [DOWNLOADS] Erreur:', error.message);
      res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
    }
  });

  app.get('/api/download/:filename', (req, res) => {
    const filename = safeFilename(req.params.filename);
    const filePath = path.join(downloadsDir, filename);
    console.log('⬇️ [DOWNLOAD] Téléchargement demandé:', filename);
    if (!fs.existsSync(filePath)) {
      console.error('❌ [DOWNLOAD] Fichier introuvable:', filename);
      return res.status(404).json({ error: 'Fichier introuvable' });
    }
    res.download(filePath, filename, (err) => {
      if (err) console.error('❌ [DOWNLOAD] Erreur envoi:', err.message);
      else console.log('✅ [DOWNLOAD] Fichier envoyé:', filename);
    });
  });

  app.get('/api/download/:filename/pdf', async (req, res) => {
    const filename = safeFilename(req.params.filename);

    if (!filename.toLowerCase().endsWith('.pptx')) {
      console.error('❌ [DOWNLOAD] Requête PDF invalide:', filename);
      return res.status(400).json({ error: 'Seuls les fichiers PPTX peuvent être convertis en PDF' });
    }

    try {
      const { pdfFilename, pdfPath } = await ensurePdfFromPptx(filename);
      console.log('⬇️ [DOWNLOAD] Téléchargement PDF demandé:', pdfFilename);
      res.download(pdfPath, pdfFilename, (err) => {
        if (err) console.error('❌ [DOWNLOAD] Erreur envoi PDF:', err.message);
        else console.log('✅ [DOWNLOAD] PDF envoyé:', pdfFilename);
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error('❌ [DOWNLOAD] Conversion PDF échouée:', error.message);
      res.status(status).json({
        error:
          status === 404
            ? 'Fichier introuvable'
            : error.message || 'Erreur lors de la conversion PDF',
      });
    }
  });

  app.delete('/api/download/:filename', (req, res) => {
    const filename = safeFilename(req.params.filename);
    const filePath = path.join(downloadsDir, filename);
    console.log('🗑️ [DELETE] Suppression demandée:', filename);
    if (!fs.existsSync(filePath)) {
      console.error('❌ [DELETE] Fichier introuvable:', filename);
      return res.status(404).json({ error: 'Fichier introuvable' });
    }
    try {
      fs.unlinkSync(filePath);
      console.log('✅ [DELETE] Fichier supprimé:', filename);
      res.json({ message: 'Fichier supprimé avec succès' });
    } catch (error) {
      console.error('❌ [DELETE] Erreur suppression:', error.message);
      res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
  });
}

module.exports = { registerDownloadRoutes };