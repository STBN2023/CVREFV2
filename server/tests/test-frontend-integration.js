const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

/**
 * Test d'intégration avec des données réalistes du frontend
 */
async function testFrontendIntegration() {
  try {
    console.log('=== TEST INTÉGRATION FRONTEND ===');
    
    // Données réalistes comme celles du frontend
    const testReferences = [
      {
        residence: "Résidence Les Jardins de Provence",
        moa: "SCI Les Jardins SARL",
        montant: 2500000,
        travaux: "Rénovation énergétique complète, isolation thermique, changement des menuiseries",
        realisation: "2023-2024"
      },
      {
        residence: "Immeuble Le Central",
        moa: "Copropriété Le Central",
        montant: 850000,
        travaux: "Ravalement de façade, réfection de la toiture, mise aux normes électriques",
        realisation: "2022-2023"
      },
      {
        residence: "Résidence Villa Marina",
        moa: "Promoteur Immobilier Marina SA",
        montant: 1200000,
        travaux: "Construction neuve, aménagements extérieurs, VRD",
        realisation: "2021-2022"
      },
      {
        residence: "Complexe Les Oliviers",
        moa: "Société HLM Provence Habitat",
        montant: 3200000,
        travaux: "Réhabilitation lourde, mise aux normes PMR, rénovation énergétique",
        realisation: "2020-2021"
      }
    ];

    // Vérifier que le template existe
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Template template.pptx manquant');
      return;
    }
    console.log('✓ Template trouvé');

    // Créer FormData
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(testReferences));

    console.log(`Envoi de ${testReferences.length} références...`);
    
    // Envoyer la requête
    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    if (response.ok) {
      console.log('✓ Enrichissement réussi');
      
      // Sauvegarder le fichier résultat
      const buffer = await response.buffer();
      const outputPath = path.join(__dirname, 'cv-enrichi-frontend-test.pptx');
      fs.writeFileSync(outputPath, buffer);
      console.log(`✓ CV enrichi sauvegardé: ${outputPath}`);
      console.log(`✓ Taille du fichier: ${buffer.length} bytes`);
      
      // Résumé des références traitées
      console.log('\n📋 RÉSUMÉ DES RÉFÉRENCES TRAITÉES:');
      testReferences.forEach((ref, index) => {
        console.log(`${index + 1}. ${ref.residence}`);
        console.log(`   MOA: ${ref.moa}`);
        console.log(`   Montant: ${ref.montant.toLocaleString()} €`);
        console.log(`   Travaux: ${ref.travaux}`);
        console.log(`   Réalisation: ${ref.realisation}\n`);
      });
      
    } else {
      const error = await response.text();
      console.error('❌ Erreur:', response.status, error);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test avec différents formats de données
async function testEdgeCases() {
  console.log('\n=== TEST CAS LIMITES ===');
  
  const edgeCases = [
    // Test avec données manquantes
    {
      name: "Données partielles",
      data: [
        {
          residence: "Résidence Test",
          moa: "", // MOA vide
          montant: null, // Montant null
          travaux: "Travaux test",
          realisation: "2023"
        }
      ]
    },
    // Test avec tableau vide
    {
      name: "Aucune référence",
      data: []
    },
    // Test avec plus de 5 références
    {
      name: "Plus de 5 références",
      data: Array.from({length: 7}, (_, i) => ({
        residence: `Résidence ${i + 1}`,
        moa: `MOA ${i + 1}`,
        montant: (i + 1) * 100000,
        travaux: `Travaux ${i + 1}`,
        realisation: `202${i}`
      }))
    }
  ];

  for (const testCase of edgeCases) {
    console.log(`\nTest: ${testCase.name}`);
    
    try {
      const form = new FormData();
      form.append('pptx', fs.createReadStream(path.join(__dirname, 'template.pptx')));
      form.append('references', JSON.stringify(testCase.data));

      const response = await fetch('http://localhost:4000/api/enrich-cv', {
        method: 'POST',
        body: form
      });

      if (response.ok) {
        console.log(`✓ ${testCase.name}: Succès`);
      } else {
        const error = await response.text();
        console.log(`❌ ${testCase.name}: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: ${error.message}`);
    }
  }
}

if (require.main === module) {
  console.log('Assurez-vous que le serveur est démarré avec: npm start');
  console.log('Puis exécutez ce test avec: node test-frontend-integration.js\n');
  
  testFrontendIntegration()
    .then(() => testEdgeCases())
    .then(() => console.log('\n🎉 Tests terminés !'));
}

module.exports = { testFrontendIntegration, testEdgeCases };
