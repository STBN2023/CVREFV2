const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testDownload() {
  try {
    console.log('🔍 TEST DE TÉLÉCHARGEMENT CV ENRICHI');
    console.log('=====================================\n');

    // Données de test réalistes
    const testReferences = [
      {
        residence: "Résidence Test Download",
        moa: "MOA Test",
        montant: 500000,
        travaux: "Travaux de test",
        realisation: "2023"
      }
    ];

    // Créer FormData
    const form = new FormData();
    const templatePath = path.join(__dirname, 'template.pptx');
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(testReferences));

    console.log('📤 Envoi de la requête d\'enrichissement...');
    
    // Envoyer la requête
    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    if (response.ok) {
      console.log('✅ Requête réussie');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
      console.log(`📏 Content-Length: ${response.headers.get('content-length')} bytes`);
      
      // Sauvegarder le fichier
      const buffer = await response.buffer();
      const outputPath = path.join(__dirname, 'cv-test-download.pptx');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`\n💾 FICHIER SAUVEGARDÉ:`);
      console.log(`📁 Chemin: ${outputPath}`);
      console.log(`📏 Taille: ${buffer.length} bytes`);
      
      // Vérifier que le fichier existe
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`✅ Fichier confirmé: ${stats.size} bytes`);
        console.log(`📅 Créé le: ${stats.birthtime}`);
      }
      
      console.log(`\n🎯 RÉSULTAT:`);
      console.log(`Le CV enrichi a été généré avec succès !`);
      console.log(`Vous pouvez le trouver ici: ${outputPath}`);
      
    } else {
      console.log('❌ Erreur dans la requête');
      const error = await response.text();
      console.log(`Status: ${response.status}`);
      console.log(`Erreur: ${error}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Test de vérification des fichiers existants
function checkExistingFiles() {
  console.log('\n🔍 VÉRIFICATION DES FICHIERS EXISTANTS');
  console.log('======================================');
  
  const filesToCheck = [
    'template.pptx',
    'test.pptx',
    'test-result.pptx',
    'cv-enrichi-frontend-test.pptx'
  ];
  
  filesToCheck.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      console.log(`✅ ${filename}: ${stats.size} bytes (${stats.mtime.toLocaleString()})`);
    } else {
      console.log(`❌ ${filename}: Non trouvé`);
    }
  });
  
  // Vérifier le dossier uploads
  console.log('\n📁 DOSSIER UPLOADS:');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const pptxFiles = files.filter(f => f.endsWith('.pptx'));
    console.log(`   ${pptxFiles.length} fichiers PowerPoint trouvés`);
    pptxFiles.slice(0, 3).forEach(file => {
      const stats = fs.statSync(path.join(uploadsDir, file));
      console.log(`   - ${file}: ${stats.size} bytes`);
    });
  }
}

if (require.main === module) {
  checkExistingFiles();
  testDownload();
}

module.exports = testDownload;
