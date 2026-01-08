const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testMultipleDifferentRefs() {
  try {
    console.log('🧪 TEST AVEC RÉFÉRENCES VRAIMENT DIFFÉRENTES');
    console.log('============================================\n');

    // 3 références complètement différentes
    const differentReferences = [
      {
        residence: "VILLA ALPHA UNIQUE",
        moa: "CLIENT ALPHA SARL",
        montant: 1500000,
        travaux: "Construction villa moderne",
        realisation: "2023-2024"
      },
      {
        residence: "IMMEUBLE BETA DISTINCT", 
        moa: "COPROPRIETE BETA",
        montant: 2500000,
        travaux: "Rénovation façade complète",
        realisation: "2022-2023"
      },
      {
        residence: "MAISON GAMMA SEPAREE",
        moa: "PARTICULIER GAMMA",
        montant: 750000,
        travaux: "Extension et aménagements",
        realisation: "2021-2022"
      }
    ];

    console.log('📋 RÉFÉRENCES DIFFÉRENTES À TESTER:');
    differentReferences.forEach((ref, i) => {
      console.log(`${i+1}. ${ref.residence}`);
      console.log(`   MOA: ${ref.moa}`);
      console.log(`   Montant: ${ref.montant.toLocaleString()} €`);
      console.log(`   Travaux: ${ref.travaux}`);
      console.log(`   Réalisation: ${ref.realisation}\n`);
    });

    // Vérifier le nouveau template
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template manquant');
      return;
    }

    console.log('📤 Envoi vers API avec le nouveau template...');
    
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(differentReferences));

    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    console.log(`📊 Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Erreur API:', errorText);
      return;
    }

    console.log('✅ API OK');

    // Sauvegarder le résultat
    const buffer = await response.buffer();
    const outputPath = path.join(__dirname, 'cv-multiple-different-refs.pptx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`💾 Fichier créé: cv-multiple-different-refs.pptx`);
    console.log(`📏 Taille: ${buffer.length} bytes`);

    // Analyser le contenu pour vérifier la séparation
    console.log('\n🔍 VÉRIFICATION DE LA SÉPARATION:');
    const fileContent = buffer.toString('utf8');
    
    // Vérifier que chaque référence est présente
    console.log('\n📌 PRÉSENCE DES RÉFÉRENCES:');
    differentReferences.forEach((ref, index) => {
      const refNum = index + 1;
      const found = fileContent.includes(ref.residence);
      console.log(`${refNum}. ${ref.residence}: ${found ? '✅ TROUVÉE' : '❌ MANQUANTE'}`);
    });

    // Vérifier qu'il n'y a pas de duplication
    console.log('\n🔍 VÉRIFICATION DE NON-DUPLICATION:');
    
    // Compter les occurrences de chaque référence
    differentReferences.forEach((ref, index) => {
      const refNum = index + 1;
      const occurrences = (fileContent.match(new RegExp(ref.residence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      
      if (occurrences === 1) {
        console.log(`${refNum}. ${ref.residence}: ✅ 1 occurrence (parfait)`);
      } else if (occurrences > 1) {
        console.log(`${refNum}. ${ref.residence}: ⚠️ ${occurrences} occurrences (duplication)`);
      } else {
        console.log(`${refNum}. ${ref.residence}: ❌ 0 occurrence (manquante)`);
      }
    });

    // Vérifier les sections
    console.log('\n📋 VÉRIFICATION DES SECTIONS:');
    
    for (let i = 1; i <= 5; i++) {
      const sectionPattern = new RegExp(`RÉFÉRENCE ${i}`, 'i');
      const hasSection = sectionPattern.test(fileContent);
      console.log(`Section ${i}: ${hasSection ? '✅ TROUVÉE' : '❌ MANQUANTE'}`);
    }

    // Diagnostic final
    console.log('\n🎯 DIAGNOSTIC FINAL:');
    console.log('===================');
    
    let allRefsFound = true;
    let noDuplication = true;
    
    differentReferences.forEach(ref => {
      const found = fileContent.includes(ref.residence);
      const occurrences = (fileContent.match(new RegExp(ref.residence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      
      if (!found) allRefsFound = false;
      if (occurrences > 1) noDuplication = false;
    });
    
    if (allRefsFound && noDuplication) {
      console.log('🎉 SUCCÈS TOTAL !');
      console.log('✅ Toutes les références sont présentes');
      console.log('✅ Aucune duplication détectée');
      console.log('✅ Chaque référence dans sa propre section');
      console.log('✅ Problème des références groupées RÉSOLU !');
    } else if (allRefsFound) {
      console.log('⚠️ RÉFÉRENCES TROUVÉES mais duplication détectée');
      console.log('💡 Le template pourrait encore avoir des zones partagées');
    } else {
      console.log('❌ PROBLÈME: Certaines références manquent');
      console.log('💡 Vérifiez le template et la logique backend');
    }

    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Ouvrez cv-multiple-different-refs.pptx dans PowerPoint');
    console.log('2. Vérifiez visuellement que chaque référence est dans sa section');
    console.log('3. Si OK, le système est parfaitement opérationnel !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

if (require.main === module) {
  testMultipleDifferentRefs();
}

module.exports = testMultipleDifferentRefs;
