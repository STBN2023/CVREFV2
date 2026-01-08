const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test rapide pour vérifier le remplacement des placeholders

async function testPlaceholderReplacement() {
  console.log('\n🧪 === TEST REMPLACEMENT PLACEHOLDERS ===\n');
  
  // Données de test
  const testReferences = [
    {
      nom_projet: "Tour Majunga Test",
      client: "Société Générale Test", 
      montant: 12000000,
      annee: 2021,
      type_mission: "Construction Test"
    },
    {
      nom_projet: "Hôpital Sud Test",
      client: "CHU Lyon Test",
      montant: 8000000, 
      annee: 2019,
      type_mission: "Rénovation Test"
    }
  ];
  
  console.log('📋 Données de test préparées:', testReferences.length, 'références');
  
  try {
    // Préparer FormData
    const formData = new FormData();
    
    // Ajouter le template
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Template introuvable:', templatePath);
      return;
    }
    
    formData.append('pptx', fs.createReadStream(templatePath));
    formData.append('references', JSON.stringify(testReferences));
    
    console.log('📦 FormData préparée avec template et références');
    
    // Envoyer la requête
    console.log('🚀 Envoi requête vers http://localhost:4000/api/enrich-cv...');
    
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Succès:', result);
      
      // Vérifier le fichier généré
      const generatedFile = path.join(__dirname, 'downloads', result.filename);
      if (fs.existsSync(generatedFile)) {
        console.log('✅ Fichier généré trouvé:', result.filename);
        
        // Analyser le contenu
        const { analyzeFile } = require('./verify-placeholders');
        await analyzeFile(generatedFile, 'CV généré par test');
        
      } else {
        console.error('❌ Fichier généré introuvable:', result.filename);
      }
      
    } else {
      const error = await response.text();
      console.error('❌ Erreur API:', response.status, error);
    }
    
  } catch (error) {
    console.error('💥 Erreur test:', error.message);
  }
  
  console.log('\n🏁 === FIN TEST ===\n');
}

// Exécution
if (require.main === module) {
  testPlaceholderReplacement();
}

module.exports = { testPlaceholderReplacement };
