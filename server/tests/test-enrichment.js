const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testEnrichment() {
  try {
    console.log('=== TEST D\'ENRICHISSEMENT POWERPOINT ===');
    
    // Données de test
    const testReferences = [
      {
        residence: "Résidence Les Jardins",
        moa: "SCI Les Jardins",
        montant: 150000,
        travaux: "Rénovation énergétique",
        realisation: "2023"
      },
      {
        residence: "Immeuble Central",
        moa: "Copropriété Central",
        montant: 85000,
        travaux: "Ravalement de façade",
        realisation: "2022"
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

    console.log('Envoi de la requête...');
    
    // Envoyer la requête
    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    if (response.ok) {
      console.log('✓ Enrichissement réussi');
      
      // Sauvegarder le fichier résultat
      const buffer = await response.buffer();
      const outputPath = path.join(__dirname, 'test-result.pptx');
      fs.writeFileSync(outputPath, buffer);
      console.log(`✓ Fichier sauvegardé: ${outputPath}`);
      
    } else {
      const error = await response.text();
      console.error('❌ Erreur:', response.status, error);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Vérifier que le serveur est démarré
console.log('Assurez-vous que le serveur est démarré avec: npm start');
console.log('Puis exécutez ce test avec: node test-enrichment.js');

if (require.main === module) {
  testEnrichment();
}

module.exports = testEnrichment;
