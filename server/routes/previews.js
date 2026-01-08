const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const registerPreviewRoutes = (app, { dataDir, previewsDir, SOFFICE_PATH }) => {
  app.get('/api/pptx/preview', async (req, res) => {
    try {
      const file = String(req.query.file || '');
      if (!/^[a-z0-9_]+\.pptx$/i.test(file)) return res.status(400).json({ error: 'Paramètre file invalide' });
      const pptxPath = path.join(dataDir, file);
      if (!fs.existsSync(pptxPath)) return res.status(404).json({ error: 'Fichier introuvable' });
      const pdfFile = file.replace(/\.pptx$/i, '.pdf');
      const pdfPath = path.join(previewsDir, pdfFile);
      const ensurePdfFresh = () =>
        new Promise((resolve, reject) => {
          try {
            const pptxStat = fs.statSync(pptxPath);
            let needsConversion = true;
            if (fs.existsSync(pdfPath)) {
              const pdfStat = fs.statSync(pdfPath);
              if (pdfStat.mtimeMs >= pptxStat.mtimeMs) needsConversion = false;
            }
            if (!needsConversion) return resolve(true);
            const sofficeCmd = SOFFICE_PATH.includes(' ') ? `"${SOFFICE_PATH}"` : SOFFICE_PATH;
            const cmd = `${sofficeCmd} --headless --convert-to pdf --outdir "${previewsDir}" "${pptxPath}"`;
            exec(cmd, { windowsHide: true }, (err) => {
              if (err) return reject(new Error('LibreOffice conversion failed'));
              if (!fs.existsSync(pdfPath)) return reject(new Error('PDF not generated'));
              resolve(true);
            });
          } catch (e) {
            reject(e);
          }
        });
      try {
        await ensurePdfFresh();
      } catch {
        return res.status(500).json({ error: 'Erreur conversion PDF (LibreOffice requis)' });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdfFile}"`);
      res.sendFile(pdfPath);
    } catch (e) {
      console.error('❌ preview:', e);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });
};

module.exports = { registerPreviewRoutes };