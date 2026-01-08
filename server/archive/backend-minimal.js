const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration multer
const upload = multer({ dest: 'uploads/' });

// Dossiers
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');

// Créer les dossiers
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

// Fonction utilitaire
function safeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Test API
app.get('/api/test', (req, res) => {
  console.log('🔍 Test API');
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Template endpoint
app.get('/template.pptx', (req, res) => {
  console.log('📁 Demande template');
  const templatePath = path.join(__dirname, 'template.pptx');
  
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Template introuvable');
    return res.status(404).json({ error: 'Template non trouvé' });
  }
  
  console.log('✅ Envoi template');
  res.sendFile(templatePath);
});

// Endpoint principal
app.post('/api/enrich-cv', upload.single('pptx'), async (req, res) => {
  console.log('\n=== 🚀 GÉNÉRATION CV ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    // Validation
    if (!req.file) {
      console.error('❌ Aucun fichier');
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    
    console.log('📁 Fichier reçu:', req.file.originalname, req.file.size, 'bytes');
    
    // Parse références
    let references = [];
    try {
      references = JSON.parse(req.body.references || '[]');
      console.log('📋 Références:', references.length);
    } catch (err) {
      console.error('❌ Erreur JSON:', err.message);
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'JSON invalide' });
    }
    
    // Traitement PPTX
    console.log('📖 Lecture PPTX...');
    const zip = new JSZip();
    const content = await zip.loadAsync(fs.readFileSync(req.file.path));
    
    // Construction du texte de remplacement
    const refsText = references.map((ref, i) => {
      const nom = ref.nom_projet || ref.residence || 'Projet ' + (i + 1);
      const client = ref.client || ref.moa || 'Client non spécifié';
      const montant = ref.montant ? ref.montant.toLocaleString() + ' €' : 'Non spécifié';
      const annee = ref.annee || ref.realisation || 'Non spécifié';
      
      return `${i + 1}. ${nom}\n   Client: ${client}\n   Montant: ${montant}\n   Année: ${annee}`;
    }).join('\n\n') || 'Aucune référence';
    
    console.log('📝 Texte généré:', refsText.length, 'caractères');
    
    // Remplacement dans les slides
    const files = Object.keys(content.files);
    let replacements = 0;
    
    for (const fileName of files) {
      if (fileName.includes('slide') && fileName.endsWith('.xml')) {
        const file = content.files[fileName];
        if (!file.dir) {
          const xmlContent = await file.async('string');
          if (xmlContent.includes('{{REFS}}')) {
            console.log('🔄 Remplacement dans:', fileName);
            const newContent = xmlContent.replace(/\{\{REFS\}\}/g, refsText);
            content.file(fileName, newContent);
            replacements++;
          }
        }
      }
    }
    
    console.log('✅ Remplacements effectués:', replacements);
    
    // Génération du fichier de sortie
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputFilename = `cv_enrichi_${timestamp}.pptx`;
    const outputPath = path.join(downloadsDir, outputFilename);
    
    console.log('💾 Génération fichier...');
    const buffer = await content.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buffer);
    
    // Nettoyage
    fs.unlinkSync(req.file.path);
    
    console.log('✅ Fichier généré:', outputFilename);
    console.log('📊 Taille:', buffer.length, 'bytes');
    console.log('=== 🏁 FIN GÉNÉRATION ===\n');
    
    res.json({
      message: 'CV enrichi généré avec succès',
      downloadUrl: `/api/download/${outputFilename}`,
      filename: outputFilename,
      referencesCount: references.length
    });
    
  } catch (error) {
    console.error('💥 ERREUR:', error.message);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste des téléchargements
app.get('/api/downloads', (req, res) => {
  console.log('📁 Liste téléchargements');
  
  try {
    const files = fs.readdirSync(downloadsDir)
      .filter(f => f.endsWith('.pptx'))
      .map(f => {
        const fullPath = path.join(downloadsDir, f);
        const stat = fs.statSync(fullPath);
        return {
          filename: f,
          sizeBytes: stat.size,
          createdAt: stat.birthtimeMs || stat.ctimeMs
        };
      });
    
    console.log('📊 Fichiers:', files.length);
    res.json({ files });
  } catch (error) {
    console.error('❌ Erreur liste:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Téléchargement
app.get('/api/download/:filename', (req, res) => {
  const filename = safeFilename(req.params.filename);
  const filePath = path.join(downloadsDir, filename);
  
  console.log('⬇️ Téléchargement:', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  
  res.download(filePath, filename);
});

// Suppression
app.delete('/api/download/:filename', (req, res) => {
  const filename = safeFilename(req.params.filename);
  const filePath = path.join(downloadsDir, filename);
  
  console.log('🗑️ Suppression:', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  
  try {
    fs.unlinkSync(filePath);
    res.json({ message: 'Fichier supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

// Démarrage
app.listen(PORT, () => {
  console.log(`🚀 Backend démarré sur http://localhost:${PORT}`);
  console.log('📁 Uploads:', uploadsDir);
  console.log('📁 Downloads:', downloadsDir);
});
