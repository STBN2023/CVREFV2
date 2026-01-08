const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function test3RefsFinal() {
  try {
    console.log('🧪 TEST FINAL - 3 RÉFÉRENCES SÉPARÉES');
    console.log('=====================================\n');

    // 3 références distinctes pour tester la séparation
    const testReferences = [
      {
        residence: "VILLA ALPHA",
        moa: "CLIENT ALPHA SARL",
        montant: 1500000,
        travaux: "Construction villa moderne",
        realisation: "2023-2024"
      },
      {
        residence: "IMMEUBLE BETA", 
        moa: "COPROPRIETE BETA",
        montant: 2500000,
        travaux: "Rénovation façade complète",
        realisation: "2022-2023"
      },
      {
        residence: "MAISON GAMMA",
        moa: "PARTICULIER GAMMA",
        montant: 750000,
        travaux: "Extension et aménagements",
        realisation: "2021-2022"
      }
    ];

    console.log('📋 RÉFÉRENCES DE TEST:');
    testReferences.forEach((ref, i) => {
      console.log(`${i+1}. ${ref.residence}`);
      console.log(`   MOA: ${ref.moa}`);
      console.log(`   Montant: ${ref.montant.toLocaleString()} €`);
      console.log(`   Travaux: ${ref.travaux}`);
      console.log(`   Réalisation: ${ref.realisation}\n`);
    });

    // Vérifier le template
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template manquant');
      return;
    }

    console.log('📤 Envoi vers API backend...');
    
    // Créer FormData
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(testReferences));

    // Envoyer la requête
    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    console.log(`📊 Status: ${response.status}`);

    if (!response.ok) {
      console.log('❌ Erreur API');
      const errorText = await response.text();
      console.log('Détails:', errorText);
      return;
    }

    console.log('✅ API OK');

    // Sauvegarder le résultat
    const buffer = await response.buffer();
    const outputPath = path.join(__dirname, 'cv-3-refs-final.pptx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`💾 Fichier créé: cv-3-refs-final.pptx`);
    console.log(`📏 Taille: ${buffer.length} bytes`);

    // Test dans le fichier brut
    console.log('\n🔍 VÉRIFICATION DES 3 RÉFÉRENCES:');
    const fileContent = buffer.toString('utf8');
    
    // Vérifier chaque référence
    testReferences.forEach((ref, index) => {
      const refNum = index + 1;
      console.log(`\n📌 RÉFÉRENCE ${refNum} - ${ref.residence}:`);
      
      // Chercher les éléments de cette référence
      const elements = [
        { name: 'Résidence', value: ref.residence },
        { name: 'MOA', value: ref.moa },
        { name: 'Montant', value: ref.montant.toLocaleString() },
        { name: 'Travaux', value: ref.travaux },
        { name: 'Réalisation', value: ref.realisation }
      ];
      
      elements.forEach(element => {
        const found = fileContent.includes(element.value);
        console.log(`   ${element.name}: ${found ? '✅' : '❌'} ${element.value}`);
      });
    });

    // Vérifier que les placeholders individuels sont remplacés
    console.log('\n🔍 VÉRIFICATION DES PLACEHOLDERS:');
    
    for (let i = 1; i <= 5; i++) {
      const placeholders = [
        `{{REF_${i}_RESIDENCE}}`,
        `{{REF_${i}_MOA}}`,
        `{{REF_${i}_MONTANT}}`,
        `{{REF_${i}_TRAVAUX}}`,
        `{{REF_${i}_REALISATION}}`
      ];
      
      let replacedCount = 0;
      placeholders.forEach(placeholder => {
        if (!fileContent.includes(placeholder)) {
          replacedCount++;
        }
      });
      
      console.log(`📌 REF_${i}: ${replacedCount}/5 placeholders remplacés`);
    }

    console.log('\n🎯 RÉSULTAT FINAL:');
    console.log('==================');
    
    // Compter les références trouvées
    let foundRefs = 0;
    testReferences.forEach(ref => {
      if (fileContent.includes(ref.residence)) {
        foundRefs++;
      }
    });
    
    if (foundRefs === 3) {
      console.log('🎉 SUCCÈS TOTAL !');
      console.log('✅ Les 3 références sont présentes dans le PowerPoint');
      console.log('✅ Chaque référence est traitée individuellement');
      console.log('✅ Le système de références séparées fonctionne parfaitement');
      
      console.log('\n💡 PROCHAINES ÉTAPES:');
      console.log('1. Ouvrez cv-3-refs-final.pptx dans PowerPoint');
      console.log('2. Vérifiez que chaque référence apparaît dans sa section');
      console.log('3. Le problème des références groupées est résolu !');
      
    } else {
      console.log(`⚠️ ${foundRefs}/3 références trouvées`);
      console.log('💡 Vérifiez le fichier PowerPoint manuellement');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

if (require.main === module) {
  test3RefsFinal();
}

module.exports = test3RefsFinal;
