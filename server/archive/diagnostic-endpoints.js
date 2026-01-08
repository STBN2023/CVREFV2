const fetch = require('node-fetch');

async function testEndpoints() {
  console.log('🔍 DIAGNOSTIC DES ENDPOINTS BACKEND');
  console.log('=====================================\n');

  const baseUrl = 'http://localhost:4000';
  const endpoints = [
    { path: '/api/test-pptx', method: 'HEAD', description: 'Test fichier PowerPoint' },
    { path: '/api/test-pptx', method: 'GET', description: 'Téléchargement test PowerPoint' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.path}...`);
      
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method
      });

      if (response.ok) {
        console.log(`✅ ${endpoint.description}: OK (${response.status})`);
        if (endpoint.method === 'HEAD') {
          console.log(`   Headers: Content-Length=${response.headers.get('content-length')}`);
        }
      } else {
        console.log(`❌ ${endpoint.description}: ERREUR (${response.status})`);
        const text = await response.text();
        console.log(`   Détail: ${text}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.description}: CONNEXION ÉCHOUÉE`);
      console.log(`   Erreur: ${error.message}`);
    }
    console.log('');
  }

  // Test de l'endpoint enrich-cv avec des données factices
  console.log('Testing POST /api/enrich-cv...');
  try {
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');

    const form = new FormData();
    
    // Utiliser le template comme fichier de test
    const templatePath = path.join(__dirname, 'template.pptx');
    if (fs.existsSync(templatePath)) {
      form.append('pptx', fs.createReadStream(templatePath));
      form.append('references', JSON.stringify([
        {
          residence: "Test Résidence",
          moa: "Test MOA",
          montant: 100000,
          travaux: "Test travaux",
          realisation: "2023"
        }
      ]));

      const response = await fetch(`${baseUrl}/api/enrich-cv`, {
        method: 'POST',
        body: form
      });

      if (response.ok) {
        console.log(`✅ Enrichissement PowerPoint: OK (${response.status})`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      } else {
        console.log(`❌ Enrichissement PowerPoint: ERREUR (${response.status})`);
        const text = await response.text();
        console.log(`   Détail: ${text.substring(0, 200)}...`);
      }
    } else {
      console.log(`❌ Template PowerPoint manquant: ${templatePath}`);
    }
  } catch (error) {
    console.log(`❌ Enrichissement PowerPoint: CONNEXION ÉCHOUÉE`);
    console.log(`   Erreur: ${error.message}`);
  }

  console.log('\n🎯 RÉSUMÉ');
  console.log('=========');
  console.log('Si tous les tests sont ✅, le backend fonctionne correctement.');
  console.log('Si des tests échouent, vérifiez:');
  console.log('- Que le serveur est démarré (npm start)');
  console.log('- Que les fichiers template.pptx et test.pptx existent');
  console.log('- Que le port 4000 n\'est pas bloqué par un firewall');
}

if (require.main === module) {
  testEndpoints();
}

module.exports = testEndpoints;
