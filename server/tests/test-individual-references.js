const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const JSZip = require('jszip');

async function testIndividualReferences() {
  try {
    console.log('🧪 TEST DES RÉFÉRENCES INDIVIDUELLES');
    console.log('====================================\n');

    // Données de test avec 3 références différentes
    const testReferences = [
      {
        residence: "Résidence Alpha - Test 1",
        moa: "MOA Alpha SARL",
        montant: 1500000,
        travaux: "Construction neuve, isolation thermique",
        realisation: "2023-2024"
      },
      {
        residence: "Immeuble Beta - Test 2", 
        moa: "Copropriété Beta",
        montant: 950000,
        travaux: "Ravalement façade, toiture",
        realisation: "2022-2023"
      },
      {
        residence: "Villa Gamma - Test 3",
        moa: "Promoteur Gamma SA", 
        montant: 750000,
        travaux: "Rénovation complète, aménagements",
        realisation: "2021-2022"
      }
    ];

    console.log('📋 DONNÉES DE TEST:');
    testReferences.forEach((ref, index) => {
      console.log(`\n${index + 1}. ${ref.residence}`);
      console.log(`   MOA: ${ref.moa}`);
      console.log(`   Montant: ${ref.montant.toLocaleString()} €`);
      console.log(`   Travaux: ${ref.travaux}`);
      console.log(`   Réalisation: ${ref.realisation}`);
    });

    // Vérifier que le template existe
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.log('\n❌ Template template.pptx manquant');
      console.log('💡 Exécutez d\'abord: node create-individual-ref-template.js');
      return;
    }

    console.log('\n✅ Template trouvé');

    // Créer FormData et envoyer la requête
    console.log('\n📤 Envoi de la requête vers l\'API...');
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(testReferences));

    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    if (!response.ok) {
      console.log(`❌ Erreur API: ${response.status}`);
      const errorText = await response.text();
      console.log('Détails:', errorText);
      return;
    }

    console.log('✅ Requête réussie !');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);

    // Sauvegarder le fichier généré
    const buffer = await response.buffer();
    const outputPath = path.join(__dirname, 'cv-individual-refs-test.pptx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`\n💾 FICHIER GÉNÉRÉ:`);
    console.log(`📁 Chemin: ${outputPath}`);
    console.log(`📏 Taille: ${buffer.length} bytes`);

    // Analyser le contenu généré
    console.log('\n🔍 ANALYSE DU CONTENU GÉNÉRÉ:');
    const zip = await JSZip.loadAsync(buffer);
    
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    for (const slideFile of slideFiles) {
      console.log(`\n📄 Analyse du slide: ${slideFile}`);
      const slideContent = await zip.files[slideFile].async('text');
      
      // Chercher les références individuelles
      let foundIndividualRefs = 0;
      let foundCompletePlaceholders = 0;
      let foundOldPlaceholders = 0;
      
      for (let i = 1; i <= 5; i++) {
        // Vérifier les placeholders individuels
        if (slideContent.includes(`REF_${i}_RESIDENCE`) || 
            slideContent.includes(`Résidence Alpha`) ||
            slideContent.includes(`Immeuble Beta`) ||
            slideContent.includes(`Villa Gamma`)) {
          foundIndividualRefs++;
        }
        
        // Vérifier les placeholders complets
        if (slideContent.includes(`{{REF_${i}}}`)) {
          foundCompletePlaceholders++;
        }
      }
      
      // Vérifier les anciens placeholders
      const oldPlaceholders = ['{{REF_RESIDENCE}}', '{{REF_MOA}}', '{{REF_MONTANT}}', '{{REF_TRAVAUX}}', '{{REF_REALISATION}}'];
      oldPlaceholders.forEach(placeholder => {
        if (slideContent.includes(placeholder)) {
          foundOldPlaceholders++;
        }
      });
      
      console.log(`   📊 Références individuelles trouvées: ${foundIndividualRefs}`);
      console.log(`   📊 Placeholders complets restants: ${foundCompletePlaceholders}`);
      console.log(`   📊 Anciens placeholders restants: ${foundOldPlaceholders}`);
      
      // Chercher les noms des résidences dans le contenu
      const residenceNames = testReferences.map(ref => ref.residence);
      let foundResidences = [];
      
      residenceNames.forEach(name => {
        if (slideContent.includes(name)) {
          foundResidences.push(name);
        }
      });
      
      console.log(`   ✅ Résidences trouvées dans le contenu: ${foundResidences.length}/3`);
      foundResidences.forEach(name => console.log(`      - ${name}`));
    }

    console.log('\n🎯 RÉSULTATS DU TEST:');
    console.log('=====================');
    
    // Vérifier globalement les résultats
    let totalIndividualRefs = 0;
    let totalFoundResidences = 0;
    
    for (const slideFile of slideFiles) {
      const slideContent = await zip.files[slideFile].async('text');
      
      // Compter les références individuelles
      for (let i = 1; i <= 5; i++) {
        if (slideContent.includes(`REF_${i}_RESIDENCE`) || 
            slideContent.includes(`Résidence Alpha`) ||
            slideContent.includes(`Immeuble Beta`) ||
            slideContent.includes(`Villa Gamma`)) {
          totalIndividualRefs++;
          break; // Éviter le double comptage par slide
        }
      }
      
      // Compter les résidences trouvées
      testReferences.forEach(ref => {
        if (slideContent.includes(ref.residence)) {
          totalFoundResidences++;
        }
      });
    }
    
    if (totalIndividualRefs > 0 && totalFoundResidences >= 3) {
      console.log('✅ Références individuelles détectées');
      console.log('✅ Le nouveau système fonctionne !');
      console.log(`✅ ${totalFoundResidences} résidences trouvées dans le PowerPoint`);
    } else {
      console.log('⚠️  Références individuelles non détectées');
      console.log('💡 Le template pourrait ne pas avoir les bons placeholders');
    }
    
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Vérifiez le fichier généré dans PowerPoint');
    console.log('2. Assurez-vous que chaque référence apparaît séparément');
    console.log('3. Si nécessaire, modifiez manuellement le template PowerPoint');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('\n💡 SOLUTION:');
    console.log('1. Assurez-vous que le serveur backend est démarré: node index.js');
    console.log('2. Créez le template avec références individuelles: node create-individual-ref-template.js');
    console.log('3. Puis relancez ce test: node test-individual-references.js');
  }
}

if (require.main === module) {
  testIndividualReferences();
}

module.exports = testIndividualReferences;
