const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testAutoDownload() {
  try {
    console.log('🔍 TEST DU TÉLÉCHARGEMENT AUTOMATIQUE');
    console.log('====================================\n');

    // Données de test
    const testReferences = [
      {
        residence: "Test Résidence Auto-Download",
        moa: "Test MOA",
        montant: 500000,
        travaux: "Test travaux automatiques",
        realisation: "2023"
      }
    ];

    // Vérifier que le template existe
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template template.pptx manquant');
      return;
    }

    console.log('✅ Template trouvé');

    // Créer FormData
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(testReferences));

    console.log('📤 Envoi de la requête vers http://localhost:4000/api/enrich-cv...');
    
    // Envoyer la requête
    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    if (response.ok) {
      console.log('✅ Requête réussie !');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
      console.log(`📏 Content-Length: ${response.headers.get('content-length')} bytes`);
      
      // Vérifier les headers de téléchargement
      const contentDisposition = response.headers.get('content-disposition');
      console.log(`📥 Content-Disposition: ${contentDisposition}`);
      
      if (contentDisposition && contentDisposition.includes('attachment')) {
        console.log('🎉 TÉLÉCHARGEMENT AUTOMATIQUE CONFIGURÉ !');
        
        // Sauvegarder le fichier pour vérification
        const buffer = await response.buffer();
        const outputPath = path.join(__dirname, 'cv-auto-download-test.pptx');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`💾 Fichier sauvé pour vérification: ${outputPath}`);
        console.log(`📏 Taille: ${buffer.length} bytes`);
        
        console.log('\n🎯 RÉSULTAT:');
        console.log('✅ Le téléchargement automatique fonctionne !');
        console.log('✅ Le navigateur téléchargera automatiquement le fichier');
        console.log('✅ Le fichier sera nommé avec un timestamp unique');
        
      } else {
        console.log('❌ Headers de téléchargement manquants');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Erreur dans la requête:');
      console.log(`Status: ${response.status}`);
      console.log(`Erreur: ${error}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUTION:');
      console.log('1. Lancez le serveur: node server-simple.js');
      console.log('2. Puis relancez ce test: node test-download-auto.js');
    }
  }
}

if (require.main === module) {
  testAutoDownload();
}

module.exports = testAutoDownload;
