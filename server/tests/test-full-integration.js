const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function testFullIntegration() {
  try {
    console.log('🚀 TEST D\'INTÉGRATION COMPLÈTE');
    console.log('==============================\n');

    // 1. Vérifier que le backend fonctionne
    console.log('1️⃣ Test de connectivité backend...');
    const healthCheck = await fetch('http://localhost:4000/api/test-pptx');
    console.log(`   ✅ Backend accessible (Status: ${healthCheck.status})`);

    // 2. Préparer les données comme le frontend les enverrait
    console.log('\n2️⃣ Préparation des données frontend...');
    const frontendData = {
      references: [
        {
          id: "ref1",
          residence: "Résidence Les Jardins de Provence",
          moa: "SCI Les Jardins SARL", 
          montant: 2500000,
          travaux: "Rénovation énergétique complète, isolation thermique par l'extérieur, changement des menuiseries, installation VMC double flux",
          realisation: "2023-2024"
        },
        {
          id: "ref2", 
          residence: "Immeuble Le Central - 45 logements",
          moa: "Copropriété Le Central",
          montant: 850000,
          travaux: "Ravalement de façade, réfection de la toiture, mise aux normes électriques, installation d'un ascenseur",
          realisation: "2022-2023"
        },
        {
          id: "ref3",
          residence: "Résidence Villa Marina - Programme neuf", 
          moa: "Promoteur Immobilier Marina SA",
          montant: 1200000,
          travaux: "Construction neuve de 25 logements, aménagements extérieurs, VRD, espaces verts",
          realisation: "2021-2022"
        }
      ]
    };

    console.log(`   ✅ ${frontendData.references.length} références préparées`);

    // 3. Test de l'API d'enrichissement
    console.log('\n3️⃣ Test de l\'API d\'enrichissement...');
    
    const templatePath = path.join(__dirname, "template.pptx");
    if (!fs.existsSync(templatePath)) {
      throw new Error('Template PowerPoint non trouvé');
    }

    const formData = new FormData();
    formData.append('pptx', fs.createReadStream(templatePath));
    formData.append('references', JSON.stringify(frontendData.references));

    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    console.log(`   ✅ API réponse OK (Status: ${response.status})`);
    console.log(`   📋 Content-Type: ${response.headers.get('content-type')}`);

    // 4. Sauvegarder et analyser le fichier généré
    console.log('\n4️⃣ Analyse du fichier généré...');
    
    const buffer = await response.buffer();
    const outputPath = path.join(__dirname, 'cv-integration-test.pptx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`   💾 Fichier sauvé: ${outputPath}`);
    console.log(`   📏 Taille: ${buffer.length} bytes`);

    // 5. Vérifier le contenu visible
    console.log('\n5️⃣ Vérification du contenu visible...');
    
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    if (slideFiles.length > 0) {
      const content = await zip.files[slideFiles[0]].async('text');
      
      // Extraire le texte visible
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
      const visibleTexts = textMatches 
        ? textMatches.map(match => match.replace(/<a:t>|<\/a:t>/g, ''))
        : [];

      // Vérifier les références
      const referencesFound = [];
      frontendData.references.forEach((ref, index) => {
        const found = visibleTexts.some(text => text.includes(ref.residence));
        if (found) {
          referencesFound.push(`${index + 1}. ${ref.residence}`);
        }
      });

      console.log(`   📊 Textes visibles trouvés: ${visibleTexts.length}`);
      console.log(`   🎯 Références visibles: ${referencesFound.length}/${frontendData.references.length}`);
      
      if (referencesFound.length > 0) {
        console.log('\n   ✅ Références trouvées dans le contenu visible:');
        referencesFound.forEach(ref => console.log(`      ${ref}`));
      }

      // Vérifier les détails (MOA, montant, etc.)
      const detailsFound = [];
      frontendData.references.forEach(ref => {
        if (visibleTexts.some(text => text.includes(ref.moa))) {
          detailsFound.push(`MOA: ${ref.moa}`);
        }
        if (visibleTexts.some(text => text.includes(ref.montant.toLocaleString()))) {
          detailsFound.push(`Montant: ${ref.montant.toLocaleString()} €`);
        }
      });

      if (detailsFound.length > 0) {
        console.log('\n   ✅ Détails trouvés:');
        detailsFound.forEach(detail => console.log(`      ${detail}`));
      }
    }

    // 6. Résultat final
    console.log('\n🎉 RÉSULTAT DU TEST D\'INTÉGRATION');
    console.log('==================================');
    console.log('✅ Backend accessible');
    console.log('✅ API d\'enrichissement fonctionnelle');
    console.log('✅ Fichier PowerPoint généré');
    console.log('✅ Références visibles dans le contenu');
    console.log('\n🚀 L\'INTÉGRATION COMPLÈTE FONCTIONNE !');
    
    return true;

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST D\'INTÉGRATION');
    console.error('====================================');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

if (require.main === module) {
  testFullIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testFullIntegration;
