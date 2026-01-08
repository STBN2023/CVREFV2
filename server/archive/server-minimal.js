const express = require("express");
const multer = require("multer");
const fs = require("fs");
const JSZip = require("jszip");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

console.log("🚀 Initialisation du serveur...");

// API d'enrichissement CV avec téléchargement automatique
app.post("/api/enrich-cv", upload.single("pptx"), async (req, res) => {
  console.log("📥 Requête d'enrichissement reçue");
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Fichier manquant" });
    }

    // Lire le fichier uploadé
    const data = fs.readFileSync(req.file.path);
    const zip = await JSZip.loadAsync(data);
    
    // Récupérer les références
    const references = JSON.parse(req.body.references || "[]");
    console.log(`📋 ${references.length} références reçues`);

    // Créer le texte des références
    let allReferencesText = "";
    references.forEach((ref, index) => {
      if (ref) {
        const refText = `${ref.residence || 'Référence ' + (index + 1)}
Maître d'ouvrage: ${ref.moa || 'N/A'}
Montant: ${ref.montant ? ref.montant.toLocaleString() + ' €' : 'N/A'}
Travaux: ${ref.travaux || 'N/A'}
Réalisation: ${ref.realisation || 'N/A'}`;
        
        if (index > 0) allReferencesText += "\n\n";
        allReferencesText += refText;
      }
    });

    // Remplacer dans les slides
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    for (const slideFile of slideFiles) {
      let content = await zip.files[slideFile].async('text');
      content = content.replace(/\{\{REF_RESIDENCE\}\}/g, allReferencesText);
      content = content.replace(/\{\{REF_MOA\}\}/g, "");
      content = content.replace(/\{\{REF_MONTANT\}\}/g, "");
      content = content.replace(/\{\{REF_TRAVAUX\}\}/g, "");
      content = content.replace(/\{\{REF_REALISATION\}\}/g, "");
      zip.file(slideFile, content);
    }

    // Générer le fichier
    const buffer = await zip.generateAsync({type: 'nodebuffer'});
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cv-enrichi-${timestamp}.pptx`;

    console.log(`✅ Fichier généré: ${filename} (${buffer.length} bytes)`);

    // **TÉLÉCHARGEMENT AUTOMATIQUE**
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    console.log("📥 Fichier envoyé pour téléchargement automatique");

    // Nettoyer
    fs.unlinkSync(req.file.path);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Serveur actif", 
    timestamp: new Date().toISOString(),
    downloadEnabled: true
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log(`📥 Téléchargement automatique activé !`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
});

// Garder le serveur actif
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  process.exit(0);
});
