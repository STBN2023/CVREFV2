const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const JSZip = require("jszip");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Fonction pour remplacer les placeholders
function replacePlaceholders(content, templateData) {
  let result = content;
  Object.keys(templateData).forEach(placeholder => {
    const value = templateData[placeholder] || "";
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, value);
  });
  return result;
}

// API d'enrichissement CV avec téléchargement automatique
app.post("/api/enrich-cv", upload.single("pptx"), async (req, res) => {
  let pptxPath, outputPath;
  
  try {
    console.log("=== DÉBUT ENRICHISSEMENT CV ===");
    
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier PowerPoint reçu" });
    }
    
    pptxPath = req.file.path;
    console.log("Fichier reçu:", req.file.originalname, "- Taille:", req.file.size, "bytes");

    // Récupérer les références
    let references = [];
    try {
      references = JSON.parse(req.body.references || "[]");
      console.log("Références reçues:", references.length);
    } catch (e) {
      return res.status(400).json({ error: "Format JSON des références invalide" });
    }

    // Lire le fichier PowerPoint
    const data = fs.readFileSync(pptxPath);
    const zip = await JSZip.loadAsync(data);

    // Préparer les données de remplacement
    const templateData = {};
    
    if (references.length > 0) {
      console.log(`Traitement de ${references.length} référence(s)`);
      
      // Créer une chaîne de texte avec toutes les références
      let allReferencesText = "";
      
      references.forEach((ref, index) => {
        if (ref) {
          console.log(`Traitement référence ${index + 1}:`, ref.residence || ref.title);
          
          const refText = `${ref.residence || ref.title || 'Référence ' + (index + 1)}
Maître d'ouvrage: ${ref.moa || 'N/A'}
Montant: ${ref.montant ? ref.montant.toLocaleString() + ' €' : 'N/A'}
Travaux: ${ref.travaux || 'N/A'}
Réalisation: ${ref.realisation || 'N/A'}`;
          
          if (index > 0) {
            allReferencesText += "\n\n";
          }
          allReferencesText += refText;
        }
      });
      
      // Remplacer les placeholders
      templateData['{{REF_RESIDENCE}}'] = allReferencesText;
      templateData['{{REF_MOA}}'] = "";
      templateData['{{REF_MONTANT}}'] = "";
      templateData['{{REF_TRAVAUX}}'] = "";
      templateData['{{REF_REALISATION}}'] = "";
    } else {
      // Vider tous les placeholders
      templateData['{{REF_RESIDENCE}}'] = "";
      templateData['{{REF_MOA}}'] = "";
      templateData['{{REF_MONTANT}}'] = "";
      templateData['{{REF_TRAVAUX}}'] = "";
      templateData['{{REF_REALISATION}}'] = "";
    }

    console.log("Remplacement des placeholders...");
    
    // Remplacer les placeholders dans tous les slides
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    for (const slideFile of slideFiles) {
      let content = await zip.files[slideFile].async('text');
      content = replacePlaceholders(content, templateData);
      zip.file(slideFile, content);
    }

    // Générer le fichier enrichi
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFileName = `cv-enrichi-${timestamp}.pptx`;
    const buffer = await zip.generateAsync({type: 'nodebuffer'});

    console.log(`✅ CV enrichi généré`);
    console.log(`📏 Taille: ${buffer.length} bytes`);

    // **TÉLÉCHARGEMENT AUTOMATIQUE** - Envoyer le fichier directement au client
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Envoyer le buffer directement pour téléchargement automatique
    res.send(buffer);
    
    console.log("✅ Fichier envoyé pour téléchargement automatique");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({ error: "Erreur lors de l'enrichissement", details: error.message });
  } finally {
    // Nettoyer les fichiers temporaires
    try {
      if (pptxPath && fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
    } catch (cleanupErr) {
      console.error("Erreur nettoyage:", cleanupErr.message);
    }
  }
});

// Endpoint de test
app.get("/api/test", (req, res) => {
  res.json({ message: "Serveur fonctionnel", timestamp: new Date().toISOString() });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`);
  console.log(`📥 Téléchargement automatique activé !`);
});
