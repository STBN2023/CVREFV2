const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const JSZip = require('jszip'); // Remplace Automizer
// const { Automizer, ModifyTextHelper } = require('pptx-automizer');
const cors = require("cors");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.use(express.json());

// NOUVELLE VERSION : adapte les placeholders à ceux de l'image
function fillReferenceTemplate(template, ref) {
  if (!ref) return "";
  return template
    .replace(/{{REF_RESIDENCE}}/g, ref.residence || "")
    .replace(/{{REF_MOA}}/g, ref.moa || "")
    .replace(/{{REF_MONTANT}}/g, ref.montant ? ref.montant.toLocaleString() + " €" : "")
    .replace(/{{REF_TRAVAUX}}/g, ref.travaux || "")
    .replace(/{{REF_REALISATION}}/g, ref.realisation || "");
}

// Endpoint de santé simple
app.get("/api/test", (req, res) => {
  console.log("[HEALTH] /api/test hit");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/test-pptx",  (req, res) => {
  const pptxPath = path.join(__dirname, "test.pptx");
  if (fs.existsSync(pptxPath)) {
    res.download(pptxPath, "test.pptx");
  } else {
    res.status(404).send("Fichier test.pptx non trouvé");
  }
});

app.post("/api/enrich-cv", upload.single("pptx"), async (req, res) => {
  let pptxPath, outputPath;
  try {
    console.log("=== DÉBUT ENRICHISSEMENT CV ===");
    
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier PowerPoint reçu (champ 'pptx' manquant)." });
    }
    pptxPath = req.file.path;
    console.log("Fichier reçu:", req.file.originalname, "- Taille:", req.file.size, "bytes");

    const templatePath = path.join(__dirname, "template.pptx");
    if (!fs.existsSync(templatePath)) {
      fs.unlinkSync(pptxPath);
      return res.status(500).json({ error: "Le template PowerPoint 'template.pptx' est manquant dans le dossier server." });
    }
    console.log("Template trouvé:", templatePath);

    let references = [];
    try {
      references = JSON.parse(req.body.references || "[]");
      if (!Array.isArray(references)) throw new Error("Le champ 'references' doit être un tableau JSON.");
      console.log("Références reçues:", references.length, "éléments");
      console.log("Détail des références:", JSON.stringify(references, null, 2));
    } catch (e) {
      fs.unlinkSync(pptxPath);
      return res.status(400).json({ error: "Le champ 'references' n'est pas un JSON valide.", details: e.message });
    }

    outputPath = path.join("uploads", `enriched_${Date.now()}.pptx`);
    console.log("Fichier de sortie:", outputPath);

    try {
      console.log("🚀 Traitement du PPTX via JSZip...");

      const automizer = new Automizer({
        templateDir: `${__dirname}`,
        outputDir: `${__dirname}/downloads`
      });

      // Construction du pipeline Automizer
      const MAX_REFERENCES = 5;
      const refsToShow = references.slice(0, MAX_REFERENCES);
      console.log(`⚙️  ${refsToShow.length} références à traiter.`);

      // Lecture du fichier PPTX via JSZip
      const pptxBuffer = fs.readFileSync(pptxPath);
      const zip = await JSZip.loadAsync(pptxBuffer);

      // Préparation du texte des références
      for (let i = 0; i < MAX_REFERENCES; i++) {
        const refIndex = i + 1;
        const shapeName = `reference_${refIndex}`;

        let refText = '';
        if (i < refsToShow.length && refsToShow[i]) {
          const ref = refsToShow[i];
          refText = `Résidence: ${ref.residence || ''}\nMaître d'ouvrage: ${ref.moa || ''}\nMontant: ${ref.montant ? ref.montant.toLocaleString() + ' €' : ''}\nTravaux: ${ref.travaux || ''}\nRéalisation: ${ref.realisation || ''}`;
          console.log(` -> Remplacement de '${shapeName}'`);
        } else {
          console.log(` -> Nettoyage de '${shapeName}' (pas de référence)`);
      // Génération et écriture directe par Automizer
      // Parcourir chaque slide et remplacer le placeholder générique par toutes les réf.
      const slides = Object.keys(zip.files).filter(f => f.includes('ppt/slides/slide') && f.endsWith('.xml'));
      // Concatène toutes les références (ou vide si aucune)
      const refsText = refsToShow.map((ref, idx) => {
        if (!ref) return '';
        return `Résidence: ${ref.residence || ''}\nMaître d'ouvrage: ${ref.moa || ''}\nMontant: ${ref.montant ? ref.montant.toLocaleString() + ' €' : ''}\nTravaux: ${ref.travaux || ''}\nRéalisation: ${ref.realisation || ''}`;
      }).filter(Boolean).join('\n\n');

      for (const slideFile of slides) {
        let content = await zip.file(slideFile).async('text');
        content = content.replace(/\{\{REFS\}\}/g, refsText);
        zip.file(slideFile, content);
      }

      const finalBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      // Chemin de destination
      outputPath = path.join(__dirname, 'downloads', downloadFilename);
      
      // Le fichier est déjà dans le bon dossier 'downloads'
      outputPath = path.join(__dirname, 'downloads', downloadFilename);

      console.log("✅ Fichier PowerPoint enrichi généré avec succès via Automizer !");
      console.log(`   Taille: ${finalBuffer.length} bytes`);
      console.log(`   Chemin: ${outputPath}`);

      // Renvoyer la confirmation au frontend
      return res.json({
        message: "Fichier PowerPoint enrichi avec succès via Automizer",
        downloadUrl: `/api/download/${downloadFilename}`,
        filename: downloadFilename,
        referencesCount: refsToShow.length,
      });
      
    } catch (e) {
      if (fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.error("Erreur génération PPTX :", e);
      console.error("Stack trace:", e.stack);
      return res.status(500).json({ error: "Erreur lors de la génération du PowerPoint.", details: e.message, stack: e.stack });
    }

    // Générer un nom de fichier unique avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const downloadFilename = `cv_enrichi_${timestamp}.pptx`;
    
    // Sauvegarder une copie temporaire pour téléchargements ultérieurs
    const tempDownloadPath = path.join(__dirname, 'downloads', downloadFilename);
    const downloadsDir = path.join(__dirname, 'downloads');
    
    // Créer le dossier downloads s'il n'existe pas
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    // Copier le fichier vers le dossier downloads
    fs.copyFileSync(outputPath, tempDownloadPath);
    
    console.log(`💾 Fichier sauvé pour téléchargement: ${tempDownloadPath}`);
    
    // Configurer les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.download(outputPath, downloadFilename, (err) => {
      try {
        // Nettoyer les fichiers temporaires (mais garder la copie dans downloads)
        if (fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      } catch (cleanupErr) {
        console.error("Erreur lors du nettoyage des fichiers temporaires :", cleanupErr);
      }
      if (err) {
        console.error("Erreur lors de l'envoi du fichier :", err);
      } else {
        console.log(`✅ Fichier téléchargé avec succès: ${downloadFilename}`);
      }
    });
  } catch (err) {
    if (pptxPath && fs.existsSync(pptxPath)) fs.unlinkSync(pptxPath);
    if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    console.error("Erreur inattendue :", err);
    res.status(500).json({ error: "Erreur inattendue lors de l'enrichissement du CV.", details: err.message });
  }
});

// Endpoint pour lister les fichiers disponibles au téléchargement
app.get("/api/downloads", (req, res) => {
  try {
    const downloadsDir = path.join(__dirname, 'downloads');
    
    if (!fs.existsSync(downloadsDir)) {
      return res.json({ files: [] });
    }
    
    const files = fs.readdirSync(downloadsDir)
      .filter(file => file.endsWith('.pptx'))
      .map(file => {
        const filePath = path.join(downloadsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created)); // Plus récent en premier
    
    res.json({ files });
  } catch (error) {
    console.error("Erreur lors de la liste des fichiers:", error);
    res.status(500).json({ error: "Erreur lors de la récupération de la liste des fichiers" });
  }
});

// Endpoint pour télécharger un fichier spécifique
app.get("/api/download/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Vérification de sécurité : seulement les fichiers .pptx
    if (!filename.endsWith('.pptx') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: "Nom de fichier invalide" });
    }
    
    const filePath = path.join(__dirname, 'downloads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Fichier non trouvé" });
    }
    
    // Configurer les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log(`💾 Téléchargement demandé: ${filename}`);
    res.download(filePath, filename);
    
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    res.status(500).json({ error: "Erreur lors du téléchargement du fichier" });
  }
});

// Endpoint pour supprimer un fichier
app.delete("/api/download/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Vérification de sécurité
    if (!filename.endsWith('.pptx') || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: "Nom de fichier invalide" });
    }
    
    const filePath = path.join(__dirname, 'downloads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Fichier non trouvé" });
    }
    
    fs.unlinkSync(filePath);
    console.log(`🗑️ Fichier supprimé: ${filename}`);
    res.json({ message: "Fichier supprimé avec succès" });
    
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du fichier" });
  }
});

app.listen(4000, () => {
  console.log("Backend listening on http://localhost:4000");
  console.log("💾 Endpoints de téléchargement disponibles:");
  console.log("  GET /api/downloads - Lister les fichiers");
  console.log("  GET /api/download/:filename - Télécharger un fichier");
  console.log("  DELETE /api/download/:filename - Supprimer un fichier");
});