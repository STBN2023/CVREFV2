const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const dbManager = require('./database/database');

const { safeFilename, sanitizeSlug } = require('./utils/pptx');

// Routes modules
const { registerGenerateCvRoutes } = require('./routes/generate-cv');
const { registerDownloadRoutes } = require('./routes/downloads');
const { registerHealthRoutes } = require('./routes/health');
const { registerLegacyRoutes } = require('./routes/legacy');
const { registerPreviewRoutes } = require('./routes/previews');
const { registerSalariesRoutes } = require('./routes/salaries');
const { registerReferencesRoutes } = require('./routes/references');
const { registerReferentialsRoutes } = require('./routes/referentials');
const { registerExportRoutes } = require('./routes/exports-excel');
const { registerImportRoutes } = require('./routes/imports');
const { registerAdminDbRoutes } = require('./routes/admin-db');
// AJOUT: debug routes
const { registerDebugRoutes } = require('./routes/debug');

const SOFFICE_PATH = process.env.SOFFICE_PATH || 'soffice';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const PORT = 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Uploads handler
const upload = multer({ dest: 'uploads/' });

// Dossiers
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');
const dataDir = path.join(__dirname, 'data');
const previewsDir = path.join(__dirname, 'tmp-previews');
const backupsDir = path.join(__dirname, 'backups');
[uploadsDir, downloadsDir, dataDir, previewsDir, backupsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Static: /data pour servir les PPTX inline
app.use(
  '/data',
  express.static(dataDir, {
    setHeaders: (res, filePath) => {
      if (filePath.toLowerCase().endsWith('.pptx')) {
        const filename = path.basename(filePath);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      }
    },
  })
);

// Routes de base
registerHealthRoutes(app);
registerLegacyRoutes(app);

// Previews PDF depuis PPTX
registerPreviewRoutes(app, { dataDir, previewsDir, SOFFICE_PATH });

// Groupes de routes fonctionnelles
registerSalariesRoutes(app, { dataDir, upload });
registerReferencesRoutes(app);
registerReferentialsRoutes(app);
registerExportRoutes(app);
registerImportRoutes(app, { upload });

// Admin DB / backups / maintenance
const dbFilePath = path.join(__dirname, 'database', 'cv_enrichment.db');
registerAdminDbRoutes(app, { backupsDir, dbFilePath, downloadsDir, ADMIN_PASSWORD, upload });

// Génération + téléchargements
registerGenerateCvRoutes(app, { dataDir, downloadsDir });
registerDownloadRoutes(app, { downloadsDir, safeFilename, SOFFICE_PATH });

// AJOUT: debug endpoints
registerDebugRoutes(app);

app.listen(PORT, async () => {
  console.log('\n🚀 ===== BACKEND CV ENRICHMENT =====');
  console.log(`🌐 http://localhost:${PORT}`);
  console.log('📁 uploads:', uploadsDir);
  console.log('📁 downloads:', downloadsDir);
  try { await dbManager.initialize(); } catch (e) { console.error('💥 init DB:', e); process.exit(1); }
  console.log('📋 Endpoints: GET/POST/PUT/DELETE /api/salaries, etc.');
});