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

// Configuration multer pour l'upload
const upload = multer({ dest: 'uploads/' });

// Dossiers
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Fonction pour sécuriser les noms de fichiers
function safeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Fonction pour construire le texte des références
function buildRefsText(references) {
  if (!references || references.length === 0) {
    return "Aucune référence disponible";
  }
  
  return references.map((ref, index) => {
    const residence = ref.residence || ref.nom_projet || 'Non spécifié';
    const moa = ref.moa || ref.client || 'Non spécifié';
    const montant = ref.montant ? `${ref.montant.toLocaleString()} €` : 'Non spécifié';
    const travaux = ref.travaux || ref.type_mission || 'Non spécifié';
    const realisation = ref.realisation || ref.annee || 'Non spécifié';
    
    return `${index + 1}. ${residence}
   MOA: ${moa}
   Montant: ${montant}
   Travaux: ${travaux}
   Réalisation: ${realisation}`;
  }).join('\n\n');
}

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('🔍 Test API appelé');
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Endpoint pour enrichir le CV
app.post('/api/enrich-cv', upload.single('pptx'), async (req, res) => {
  console.log('\n=== 🚀 GÉNÉRATION CV ===');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('📁 Fichier reçu:', req.file ? req.file.originalname : 'Aucun');
  console.log('📋 Références:', req.body.references ? 'Présentes' : 'Absentes');

  try {
    if (!req.file) {
      console.error('❌ Aucun fichier fourni');
      return res.status(400).json({ error: 'Aucun fichier PowerPoint fourni' });
    }

    // Parse des références
    let references = [];
    try {
      references = JSON.parse(req.body.references || '[]');
      console.log('✅ Références parsées:', references.length);
    } catch (err) {
      console.error('❌ Erreur parsing références:', err.message);
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Format JSON invalide pour les références' });
    }

    // Lecture du fichier PPTX
    console.log('📖 Lecture du fichier PPTX...');
    const zip = new JSZip();
    const content = await zip.loadAsync(fs.readFileSync(req.file.path));

    // Construction du texte de remplacement
    const refsText = buildRefsText(references);
    console.log('📝 Texte de remplacement généré');

    // Remplacement dans tous les fichiers XML
    const files = Object.keys(content.files);
    for (const fileName of files) {
      if (fileName.endsWith('.xml') || fileName.includes('slide')) {
        const file = content.files[fileName];
        if (!file.dir) {
          const xmlContent = await file.async('string');
          if (xmlContent.includes('{{REFS}}')) {
            console.log('🔄 Remplacement dans:', fileName);
            const newContent = xmlContent.replace(/\{\{REFS\}\}/g, refsText);
            content.file(fileName, newContent);
          }
        }
      }
    }

    // Génération du nom de fichier de sortie
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputFilename = `cv_enrichi_${timestamp}.pptx`;
    const outputPath = path.join(downloadsDir, outputFilename);

    // Sauvegarde du fichier modifié
    console.log('💾 Sauvegarde du fichier...');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buffer);

    // Nettoyage du fichier temporaire
    fs.unlinkSync(req.file.path);

    console.log('✅ Fichier généré:', outputFilename);
    console.log('=== 🏁 FIN GÉNÉRATION ===\n');

    res.json({
      message: 'Fichier PowerPoint enrichi avec succès',
      downloadUrl: `/api/download/${outputFilename}`,
      filename: outputFilename,
      referencesCount: references.length
    });

  } catch (error) {
    console.error('💥 ERREUR:', error.message);
    
    // Nettoyage en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Erreur lors de l\'enrichissement du CV' });
  }
});

// Liste des téléchargements
app.get('/api/downloads', (req, res) => {
  console.log('📁 Liste des téléchargements demandée');
  
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
    
    console.log('📊 Fichiers trouvés:', files.length);
    res.json({ files });
  } catch (error) {
    console.error('❌ Erreur liste téléchargements:', error.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des fichiers' });
  }
});

// Téléchargement d'un fichier
app.get('/api/download/:filename', (req, res) => {
  const filename = safeFilename(req.params.filename);
  const filePath = path.join(downloadsDir, filename);
  
  console.log('⬇️ Téléchargement demandé:', filename);
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Fichier introuvable:', filename);
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  
  res.download(filePath, filename);
});

// Suppression d'un fichier
app.delete('/api/download/:filename', (req, res) => {
  const filename = safeFilename(req.params.filename);
  const filePath = path.join(downloadsDir, filename);
  
  console.log('🗑️ Suppression demandée:', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier introuvable' });
  }
  
  try {
    fs.unlinkSync(filePath);
    console.log('✅ Fichier supprimé:', filename);
    res.json({ message: 'Fichier supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression:', error.message);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Backend prêt sur http://localhost:${PORT}`);
  console.log('📁 Dossier uploads:', uploadsDir);
  console.log('📁 Dossier downloads:', downloadsDir);
});
