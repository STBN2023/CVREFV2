const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function quickTestSeparation() {
  try {
    console.log('🧪 TEST RAPIDE DE SÉPARATION');
    console.log('============================\n');

    // 3 références avec des noms très distincts
    const refs = [
      { residence: "REF_A", moa: "MOA_A", montant: 100000, travaux: "TRAVAUX_A", realisation: "2024" },
      { residence: "REF_B", moa: "MOA_B", montant: 200000, travaux: "TRAVAUX_B", realisation: "2023" },
      { residence: "REF_C", moa: "MOA_C", montant: 300000, travaux: "TRAVAUX_C", realisation: "2022" }
    ];

    console.log('📋 Références de test:');
    refs.forEach((ref, i) => console.log(`${i+1}. ${ref.residence} - ${ref.moa}`));

    const templatePath = path.join(__dirname, 'template.pptx');
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(refs));

    console.log('\n📤 Envoi...');
    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    if (!response.ok) {
      console.log('❌ Erreur:', response.status);
      return;
    }

    const buffer = await response.buffer();
    fs.writeFileSync(path.join(__dirname, 'quick-test.pptx'), buffer);
    
    console.log('💾 Fichier créé: quick-test.pptx');
    console.log(`📏 Taille: ${buffer.length} bytes`);

    // Test rapide du contenu
    const content = buffer.toString('utf8');
    
    console.log('\n🔍 Vérification:');
    refs.forEach((ref, i) => {
      const found = content.includes(ref.residence);
      console.log(`${i+1}. ${ref.residence}: ${found ? '✅' : '❌'}`);
    });

    // Compter les occurrences
    console.log('\n📊 Occurrences:');
    refs.forEach((ref, i) => {
      const count = (content.match(new RegExp(ref.residence, 'g')) || []).length;
      console.log(`${i+1}. ${ref.residence}: ${count} fois`);
    });

    console.log('\n✅ Test terminé - Vérifiez quick-test.pptx');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

if (require.main === module) {
  quickTestSeparation();
}

module.exports = quickTestSeparation;
