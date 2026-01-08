const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testProductionWorkflow() {
  try {
    console.log('🧪 TEST DU WORKFLOW DE PRODUCTION');
    console.log('=================================\n');

    const baseUrl = 'http://localhost:4000';

    // Simuler exactement les données que le frontend envoie
    console.log('📋 SIMULATION DES DONNÉES FRONTEND:');
    
    // Données typiques du frontend (comme dans l'application réelle)
    const productionReferences = [
      {
        id: "ref1",
        residence: "Résidence Les Jardins",
        moa: "SCI Les Jardins",
        montant: 1200000,
        travaux: "Rénovation énergétique complète",
        realisation: "2023-2024"
      },
      {
        id: "ref2", 
        residence: "Immeuble Centre Ville",
        moa: "Copropriété Centre",
        montant: 850000,
        travaux: "Ravalement de façade",
        realisation: "2022-2023"
      }
    ];

    console.log('📤 DONNÉES À ENVOYER:');
    productionReferences.forEach((ref, i) => {
      console.log(`${i+1}. ${ref.residence}`);
      console.log(`   MOA: ${ref.moa}`);
      console.log(`   Montant: ${ref.montant.toLocaleString()} €`);
      console.log(`   Travaux: ${ref.travaux}`);
      console.log(`   Réalisation: ${ref.realisation}\n`);
    });

    // Vérifier le template
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template manquant - c\'est peut-être le problème !');
      return;
    }

    console.log('✅ Template trouvé');

    // Vérifier la taille du template
    const templateStats = fs.statSync(templatePath);
    console.log(`📏 Taille du template: ${templateStats.size} bytes`);

    // Simuler exactement la requête du frontend
    console.log('\n📤 SIMULATION DE LA REQUÊTE FRONTEND:');
    
    const form = new FormData();
    
    // Ajouter le fichier PowerPoint
    form.append('pptx', fs.createReadStream(templatePath), {
      filename: 'template.pptx',
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });
    
    // Ajouter les références (exactement comme le frontend)
    form.append('references', JSON.stringify(productionReferences));

    console.log('📦 FormData préparé:');
    console.log('- pptx: template.pptx');
    console.log('- references: JSON avec 2 références');

    // Envoyer la requête avec logs détaillés
    console.log('\n🔄 ENVOI VERS API...');
    console.log(`URL: ${baseUrl}/api/enrich-cv`);
    
    const startTime = Date.now();
    
    const response = await fetch(`${baseUrl}/api/enrich-cv`, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️ Temps de réponse: ${duration}ms`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📋 Content-Length: ${response.headers.get('content-length')}`);

    if (!response.ok) {
      console.log('❌ ERREUR DE L\'API:');
      const errorText = await response.text();
      console.log('Réponse d\'erreur:', errorText);
      
      // Analyser l'erreur
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Détails de l\'erreur:', errorJson);
      } catch (e) {
        console.log('Erreur brute:', errorText);
      }
      
      return;
    }

    console.log('✅ API OK - Récupération du fichier...');

    // Récupérer le fichier
    const buffer = await response.buffer();
    console.log(`📏 Taille du fichier reçu: ${buffer.length} bytes`);

    if (buffer.length === 0) {
      console.log('❌ PROBLÈME: Fichier vide reçu !');
      return;
    }

    // Sauvegarder le fichier de test
    const outputPath = path.join(__dirname, 'cv-production-test.pptx');
    fs.writeFileSync(outputPath, buffer);
    console.log(`💾 Fichier sauvé: cv-production-test.pptx`);

    // Vérifier le contenu
    console.log('\n🔍 VÉRIFICATION DU CONTENU:');
    const fileContent = buffer.toString('utf8');
    
    // Chercher les données de production
    const searchTerms = [
      'Résidence Les Jardins',
      'SCI Les Jardins', 
      'Immeuble Centre Ville',
      'Copropriété Centre',
      '1 200 000',
      '850 000'
    ];

    let foundCount = 0;
    searchTerms.forEach(term => {
      const found = fileContent.includes(term);
      console.log(`   ${term}: ${found ? '✅' : '❌'}`);
      if (found) foundCount++;
    });

    // Vérifier les placeholders
    console.log('\n🔍 VÉRIFICATION DES PLACEHOLDERS:');
    const placeholders = [
      '{{REF_RESIDENCE}}',
      '{{REF_MOA}}',
      '{{REF_MONTANT}}',
      '{{REF_TRAVAUX}}',
      '{{REF_REALISATION}}'
    ];

    placeholders.forEach(placeholder => {
      const found = fileContent.includes(placeholder);
      console.log(`   ${placeholder}: ${found ? '⚠️ NON REMPLACÉ' : '✅ REMPLACÉ'}`);
    });

    // Diagnostic final
    console.log('\n🎯 DIAGNOSTIC DE PRODUCTION:');
    console.log('============================');
    
    if (foundCount >= 4) {
      console.log('✅ SUCCÈS: Les données de production sont présentes');
      console.log('✅ Le système fonctionne en production');
    } else if (foundCount > 0) {
      console.log(`⚠️ PARTIEL: ${foundCount}/${searchTerms.length} données trouvées`);
      console.log('💡 Certaines données ne sont pas traitées correctement');
    } else {
      console.log('❌ ÉCHEC: Aucune donnée de production trouvée');
      console.log('💡 Problème dans le traitement des données');
    }

    // Vérifier le dossier downloads
    console.log('\n📁 VÉRIFICATION DU DOSSIER DOWNLOADS:');
    const downloadsDir = path.join(__dirname, 'downloads');
    
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.pptx'));
      console.log(`📋 Fichiers dans downloads: ${files.length}`);
      
      if (files.length > 0) {
        console.log('📄 Derniers fichiers:');
        files.slice(-3).forEach(file => {
          const filePath = path.join(downloadsDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   - ${file} (${stats.size} bytes, ${stats.mtime.toLocaleString()})`);
        });
      }
    } else {
      console.log('❌ Dossier downloads manquant');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test de production:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n💡 VÉRIFICATIONS POUR LA PRODUCTION:');
    console.log('1. Le serveur backend est-il démarré ?');
    console.log('2. Le template.pptx existe-t-il et est-il valide ?');
    console.log('3. Le dossier downloads est-il accessible en écriture ?');
    console.log('4. Y a-t-il des erreurs dans les logs du serveur ?');
  }
}

if (require.main === module) {
  testProductionWorkflow();
}

module.exports = testProductionWorkflow;
