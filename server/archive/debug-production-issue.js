const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function debugProductionIssue() {
  try {
    console.log('🔍 DEBUG PROBLÈME DE PRODUCTION');
    console.log('===============================\n');

    // 1. Vérifier l'état du serveur
    console.log('1. VÉRIFICATION DU SERVEUR:');
    try {
      const healthCheck = await fetch('http://localhost:4000/api/downloads');
      console.log(`✅ Serveur accessible: ${healthCheck.status}`);
    } catch (e) {
      console.log('❌ Serveur inaccessible:', e.message);
      return;
    }

    // 2. Vérifier le template
    console.log('\n2. VÉRIFICATION DU TEMPLATE:');
    const templatePath = path.join(__dirname, 'template.pptx');
    if (fs.existsSync(templatePath)) {
      const stats = fs.statSync(templatePath);
      console.log(`✅ Template existe: ${stats.size} bytes`);
    } else {
      console.log('❌ Template manquant !');
      return;
    }

    // 3. Test simple avec 1 référence
    console.log('\n3. TEST SIMPLE AVEC 1 RÉFÉRENCE:');
    const simpleRef = {
      residence: "TEST PROD",
      moa: "TEST MOA PROD",
      montant: 500000,
      travaux: "TEST TRAVAUX PROD",
      realisation: "2024"
    };

    console.log('Référence de test:', simpleRef);

    // 4. Envoyer la requête
    console.log('\n4. ENVOI DE LA REQUÊTE:');
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify([simpleRef]));

    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ ERREUR API:', errorText);
      return;
    }

    // 5. Vérifier la réponse
    console.log('\n5. VÉRIFICATION DE LA RÉPONSE:');
    const buffer = await response.buffer();
    console.log(`Taille reçue: ${buffer.length} bytes`);

    if (buffer.length === 0) {
      console.log('❌ PROBLÈME: Fichier vide !');
      return;
    }

    // 6. Sauvegarder et analyser
    console.log('\n6. ANALYSE DU FICHIER:');
    const outputPath = path.join(__dirname, 'debug-prod.pptx');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Fichier sauvé: debug-prod.pptx`);

    // Vérification rapide du contenu
    const content = buffer.toString('utf8');
    const hasTestData = content.includes('TEST PROD');
    console.log(`Contient les données de test: ${hasTestData ? '✅' : '❌'}`);

    // 7. Vérifier le dossier downloads
    console.log('\n7. VÉRIFICATION DU DOSSIER DOWNLOADS:');
    const downloadsDir = path.join(__dirname, 'downloads');
    
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir)
        .filter(f => f.endsWith('.pptx'))
        .sort((a, b) => {
          const aPath = path.join(downloadsDir, a);
          const bPath = path.join(downloadsDir, b);
          return fs.statSync(bPath).mtime - fs.statSync(aPath).mtime;
        });

      console.log(`Fichiers dans downloads: ${files.length}`);
      
      if (files.length > 0) {
        const latestFile = files[0];
        const latestPath = path.join(downloadsDir, latestFile);
        const latestStats = fs.statSync(latestPath);
        
        console.log(`Dernier fichier: ${latestFile}`);
        console.log(`Taille: ${latestStats.size} bytes`);
        console.log(`Créé: ${latestStats.birthtime.toLocaleString()}`);
        
        // Vérifier si c'est notre fichier de test
        const now = new Date();
        const fileAge = now - latestStats.birthtime;
        
        if (fileAge < 60000) { // Moins d'1 minute
          console.log('✅ Fichier récent trouvé - génération OK');
        } else {
          console.log('⚠️ Fichier ancien - possible problème de génération');
        }
      }
    } else {
      console.log('❌ Dossier downloads manquant');
    }

    // 8. Diagnostic final
    console.log('\n🎯 DIAGNOSTIC:');
    if (hasTestData && buffer.length > 1000000) {
      console.log('✅ PRODUCTION OK: Fichier généré avec données');
    } else if (buffer.length > 1000000) {
      console.log('⚠️ FICHIER GÉNÉRÉ mais données manquantes');
      console.log('💡 Problème dans le remplacement des placeholders');
    } else {
      console.log('❌ PROBLÈME DE GÉNÉRATION');
      console.log('💡 Fichier trop petit ou vide');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

if (require.main === module) {
  debugProductionIssue();
}

module.exports = debugProductionIssue;
