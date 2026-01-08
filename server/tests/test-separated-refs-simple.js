const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const JSZip = require('jszip');

async function testSeparatedRefsSimple() {
  try {
    console.log('🧪 TEST SIMPLE DES RÉFÉRENCES SÉPARÉES');
    console.log('======================================\n');

    // 3 références différentes pour tester la séparation
    const testReferences = [
      {
        residence: "Villa Alpha",
        moa: "Client Alpha",
        montant: 1000000,
        travaux: "Construction villa",
        realisation: "2023"
      },
      {
        residence: "Immeuble Beta", 
        moa: "Client Beta",
        montant: 2000000,
        travaux: "Rénovation immeuble",
        realisation: "2022"
      },
      {
        residence: "Maison Gamma",
        moa: "Client Gamma",
        montant: 500000,
        travaux: "Extension maison",
        realisation: "2021"
      }
    ];

    console.log('📋 RÉFÉRENCES DE TEST:');
    testReferences.forEach((ref, i) => {
      console.log(`${i+1}. ${ref.residence} - ${ref.montant.toLocaleString()} €`);
    });

    // Vérifier le template
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.log('\n❌ Template manquant');
      return;
    }

    console.log('\n📤 Envoi vers API...');
    
    // Envoyer la requête
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(testReferences));

    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    if (!response.ok) {
      console.log(`❌ Erreur API: ${response.status}`);
      return;
    }

    console.log('✅ API OK');

    // Sauvegarder le résultat
    const buffer = await response.buffer();
    const outputPath = path.join(__dirname, 'cv-separated-test.pptx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`💾 Fichier créé: cv-separated-test.pptx (${buffer.length} bytes)`);

    // Analyser le contenu
    console.log('\n🔍 ANALYSE DU CONTENU:');
    const zip = await JSZip.loadAsync(buffer);
    
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide1.xml')
    );

    if (slideFiles.length > 0) {
      const slideContent = await zip.files[slideFiles[0]].async('text');
      
      console.log('\n📊 VÉRIFICATION DES RÉFÉRENCES:');
      
      // Chercher chaque référence
      testReferences.forEach((ref, index) => {
        const refNum = index + 1;
        const found = slideContent.includes(ref.residence);
        console.log(`${refNum}. ${ref.residence}: ${found ? '✅ TROUVÉE' : '❌ MANQUANTE'}`);
        
        // Chercher dans quelle section elle apparaît
        if (found) {
          for (let i = 1; i <= 5; i++) {
            const sectionPattern = new RegExp(`RÉFÉRENCE ${i}[\\s\\S]{0,500}${ref.residence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
            if (sectionPattern.test(slideContent)) {
              console.log(`   → Trouvée dans la section RÉFÉRENCE ${i}`);
            }
          }
        }
      });
      
      // Vérifier si les références sont bien séparées
      console.log('\n🎯 RÉSULTAT DE LA SÉPARATION:');
      
      let ref1Section = slideContent.match(/RÉFÉRENCE 1[\s\S]*?(?=RÉFÉRENCE 2|$)/i);
      let ref2Section = slideContent.match(/RÉFÉRENCE 2[\s\S]*?(?=RÉFÉRENCE 3|$)/i);
      let ref3Section = slideContent.match(/RÉFÉRENCE 3[\s\S]*?(?=RÉFÉRENCE 4|$)/i);
      
      if (ref1Section) {
        const ref1Content = ref1Section[0];
        const ref1HasAlpha = ref1Content.includes('Villa Alpha');
        const ref1HasBeta = ref1Content.includes('Immeuble Beta');
        const ref1HasGamma = ref1Content.includes('Maison Gamma');
        console.log(`📌 SECTION 1: Alpha=${ref1HasAlpha ? '✅' : '❌'}, Beta=${ref1HasBeta ? '⚠️' : '✅'}, Gamma=${ref1HasGamma ? '⚠️' : '✅'}`);
      }
      
      if (ref2Section) {
        const ref2Content = ref2Section[0];
        const ref2HasAlpha = ref2Content.includes('Villa Alpha');
        const ref2HasBeta = ref2Content.includes('Immeuble Beta');
        const ref2HasGamma = ref2Content.includes('Maison Gamma');
        console.log(`📌 SECTION 2: Alpha=${ref2HasAlpha ? '⚠️' : '✅'}, Beta=${ref2HasBeta ? '✅' : '❌'}, Gamma=${ref2HasGamma ? '⚠️' : '✅'}`);
      }
      
      if (ref3Section) {
        const ref3Content = ref3Section[0];
        const ref3HasAlpha = ref3Content.includes('Villa Alpha');
        const ref3HasBeta = ref3Content.includes('Immeuble Beta');
        const ref3HasGamma = ref3Content.includes('Maison Gamma');
        console.log(`📌 SECTION 3: Alpha=${ref3HasAlpha ? '⚠️' : '✅'}, Beta=${ref3HasBeta ? '⚠️' : '✅'}, Gamma=${ref3HasGamma ? '✅' : '❌'}`);
      }
    }

    console.log('\n🎉 TEST TERMINÉ !');
    console.log('================');
    console.log('💡 Ouvrez cv-separated-test.pptx pour voir le résultat');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

if (require.main === module) {
  testSeparatedRefsSimple();
}

module.exports = testSeparatedRefsSimple;
