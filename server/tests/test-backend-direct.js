const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testBackendDirect() {
  try {
    console.log('🧪 TEST DIRECT DU BACKEND');
    console.log('=========================\n');

    // Test simple avec 1 référence
    const testRef = {
      residence: "TEST RESIDENCE",
      moa: "TEST MOA", 
      montant: 123456,
      travaux: "TEST TRAVAUX",
      realisation: "TEST REALISATION"
    };

    console.log('📋 RÉFÉRENCE DE TEST:');
    console.log(JSON.stringify(testRef, null, 2));

    // Vérifier le template
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.log('\n❌ Template manquant');
      return;
    }

    console.log('\n📤 Envoi vers API backend...');
    console.log('URL: http://localhost:4000/api/enrich-cv');
    
    // Créer FormData
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify([testRef])); // Array avec 1 élément

    console.log('📦 FormData créé avec:');
    console.log('- pptx: template.pptx');
    console.log('- references: [1 référence]');

    // Envoyer la requête
    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    console.log(`\n📊 RÉPONSE API:`);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.log('❌ Erreur API');
      const errorText = await response.text();
      console.log('Détails:', errorText);
      return;
    }

    console.log('✅ API OK - Récupération du fichier...');

    // Sauvegarder le résultat
    const buffer = await response.buffer();
    const outputPath = path.join(__dirname, 'cv-backend-direct-test.pptx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`💾 Fichier sauvé: ${outputPath}`);
    console.log(`📏 Taille: ${buffer.length} bytes`);

    // Test simple : chercher notre texte de test dans le fichier brut
    console.log('\n🔍 RECHERCHE DANS LE FICHIER BRUT:');
    const fileContent = buffer.toString('utf8');
    
    const searchTerms = [
      'TEST RESIDENCE',
      'TEST MOA',
      'TEST TRAVAUX', 
      'TEST REALISATION',
      '123456',
      '123 456' // Format avec espaces
    ];

    searchTerms.forEach(term => {
      const found = fileContent.includes(term);
      console.log(`   ${term}: ${found ? '✅ TROUVÉ' : '❌ ABSENT'}`);
    });

    // Chercher les placeholders non remplacés
    console.log('\n🔍 PLACEHOLDERS NON REMPLACÉS:');
    const placeholders = [
      '{{REF_1_RESIDENCE}}',
      '{{REF_1_MOA}}',
      '{{REF_1_MONTANT}}',
      '{{REF_1_TRAVAUX}}',
      '{{REF_1_REALISATION}}'
    ];

    placeholders.forEach(placeholder => {
      const found = fileContent.includes(placeholder);
      console.log(`   ${placeholder}: ${found ? '⚠️ NON REMPLACÉ' : '✅ REMPLACÉ'}`);
    });

    console.log('\n🎯 DIAGNOSTIC:');
    if (fileContent.includes('TEST RESIDENCE')) {
      console.log('✅ Les données sont correctement traitées par le backend');
    } else if (fileContent.includes('{{REF_1_RESIDENCE}}')) {
      console.log('❌ Les placeholders ne sont pas remplacés');
      console.log('💡 Problème dans la logique de remplacement du backend');
    } else {
      console.log('❌ Les placeholders sont remplacés mais par des valeurs vides');
      console.log('💡 Problème dans la réception/parsing des données');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('\n💡 Vérifiez que le serveur backend est démarré:');
    console.log('   node index.js');
  }
}

if (require.main === module) {
  testBackendDirect();
}

module.exports = testBackendDirect;
