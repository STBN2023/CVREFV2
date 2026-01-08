const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// ----------------------------------------------------------------------------------
// Basic config
// ----------------------------------------------------------------------------------
const PORT = process.env.PORT || 4000;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
for (const dir of [DOWNLOAD_DIR, UPLOAD_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: UPLOAD_DIR });

// ----------------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------------
function buildRefsText(refs) {
  return refs
    .filter(Boolean)
    .map((ref, idx) => {
      return `Résidence: ${ref.residence || ''}\nMaître d'ouvrage: ${ref.moa || ''}\nMontant: ${ref.montant ? ref.montant.toLocaleString() + ' €' : ''}\nTravaux: ${ref.travaux || ''}\nRéalisation: ${ref.realisation || ''}`;
    })
    .join('\n\n');
}

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9-_\.]/g, '_');
}

// ----------------------------------------------------------------------------------
// API Routes
// ----------------------------------------------------------------------------------

// Healthcheck
app.get('/api/test', (req, res) => {
  console.log('\n=== 🚀 NOUVELLE REQUÊTE /api/test ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📤 Headers:', req.headers);
  console.log('\n=== 🏁 FIN REQUÊTE /api/test ===\n');
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Servir le template PPTX
app.get('/template.pptx', (req, res) => {
  console.log('\n=== 📁 REQUÊTE TEMPLATE ===');
  const templatePath = path.join(__dirname, 'template.pptx');
  
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Template introuvable:', templatePath);
    return res.status(404).json({ error: 'Template non trouvé' });
  }
  
  console.log('✅ Envoi du template:', templatePath);
  res.sendFile(templatePath);
});

// Enrich PPTX and save to downloads folder
app.post('/api/enrich-cv', upload.single('pptx'), async (req, res) => {
  console.log('\n=== 🚀 NOUVELLE REQUÊTE /api/enrich-cv ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📤 Headers:', req.headers);
  console.log('📦 Body keys:', Object.keys(req.body));
  console.log('📁 File:', req.file ? {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  } : 'Aucun fichier');

  console.log('\n=== DÉBUT ENRICHISSEMENT CV ===');
  try {
    console.log('🔍 Validation des données...');
    if (!req.file) {
      console.error('❌ Aucun fichier fourni');
      return res.status(400).json({ error: 'Aucun fichier PowerPoint fourni' });
    }
    console.log('✅ Fichier reçu:', req.file.originalname);

    const pptxPath = req.file.path;
    console.log('Fichier reçu:', pptxPath);

    // Parse references
    console.log('📋 Parsing des références...');
    console.log('📋 Raw references:', req.body.references);
    let references = JSON.parse(req.body.references || '[]');
    console.log('📋 Références parsées:', references.length);
    console.log('📋 Détail références:', references);
    if (!Array.isArray(references)) throw new Error('Le JSON des références doit être un tableau.');
  } catch (err) {
    fs.unlinkSync(pptxPath);
    console.error('💥 ERREUR CRITIQUE:', err);
    console.error('💥 Stack trace:', err.stack);
    console.log('=== ❌ FIN REQUÊTE /api/enrich-cv (ERREUR) ===\n');
    return res.status(400).json({ error: 'Le champ references n\'est pas un JSON valide', details: err.message });
  }

  try {
    // Load pptx as zip
    console.log('📖 Lecture du fichier PPTX...');
    const pptxPath = req.file.path;
    console.log('📁 Chemin fichier:', pptxPath);
    const bufferIn = fs.readFileSync(pptxPath);
    const zip = await JSZip.loadAsync(bufferIn);
    console.log('✅ Fichier PPTX chargé dans JSZip');

    // Build replacement text
    const refsText = buildRefsText(references);

    // Replace placeholder {{REFS}} in all slide xml files
    const slideFiles = Object.keys(zip.files).filter((f) => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'));
    for (const file of slideFiles) {
      let xml = await zip.file(file).async('text');
      xml = xml.replace(/\{\{REFS\}\}/g, refsText);
      zip.file(file, xml);
    }

    const outBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Build filename & save
    console.log('📝 Génération du nom de fichier...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = safeFilename(`cv_enrichi_${timestamp}.pptx`);
    const outPath = path.join(DOWNLOAD_DIR, filename);
    fs.writeFileSync(outPath, outBuffer);
    console.log('✅ Fichier généré:', outPath);

    // Cleanup upload temp
    console.log('🧹 Nettoyage du fichier temporaire:', pptxPath);
    fs.unlinkSync(pptxPath);

    const response = {
      message: 'Fichier PowerPoint enrichi avec succès',
      downloadUrl: `/api/download/${filename}`,
      filename,
      referencesCount: references.length
    };

    console.log('✅ Réponse envoyée:', response);
    console.log('=== 🏁 FIN REQUÊTE /api/enrich-cv ===\n');

    res.json(response);
  } catch (err) {
    console.error('💥 ERREUR CRITIQUE:', err);
    console.error('💥 Stack trace:', err.stack);

    // Nettoyer le fichier temporaire en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      console.log('🧹 Nettoyage fichier temporaire après erreur');
      fs.unlinkSync(req.file.path);
    }

    console.log('=== ❌ FIN REQUÊTE /api/enrich-cv (ERREUR) ===\n');
    res.status(500).json({ error: 'Erreur lors de l\'enrichissement du CV' });
  }
});

// List downloads
app.get('/api/downloads', (req, res) => {
  console.log('\n=== 🚀 NOUVELLE REQUÊTE /api/downloads ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📤 Headers:', req.headers);
  console.log('\n=== 🏁 FIN REQUÊTE /api/downloads ===\n');
  const files = fs.readdirSync(DOWNLOAD_DIR).filter(f=>f.endsWith('.pptx')).map(f=>{
    const full = path.join(DOWNLOAD_DIR,f);
    const stat = fs.statSync(full);
    return {
      filename: f,
      sizeBytes: stat.size,
      createdAt: stat.birthtimeMs || stat.ctimeMs,
    };
  });
  res.json({ files });
});

// Download file
app.get('/api/download/:filename', (req, res) => {
  const file = safeFilename(req.params.filename);
  const filePath = path.join(DOWNLOAD_DIR, file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  res.download(filePath, file);
});

// Delete file
app.delete('/api/download/:filename', (req, res) => {
  const file = safeFilename(req.params.filename);
  const filePath = path.join(DOWNLOAD_DIR, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ deleted: true });
  }
  res.status(404).json({ error: 'Fichier introuvable' });
});

// ----------------------------------------------------------------------------------
// Start server
// ----------------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend prêt sur http://localhost:${PORT}`);
});
