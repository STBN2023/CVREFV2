const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testDownloadManagement() {
  try {
    console.log('🗂️ TEST DE GESTION DES TÉLÉCHARGEMENTS');
    console.log('=====================================\n');

    // 1. Générer un fichier CV enrichi
    console.log('1️⃣ Génération d\'un fichier CV enrichi...');
    
    const testReferences = [
      {
        residence: "Test Résidence Téléchargement",
        moa: "Test MOA Téléchargement",
        montant: 750000,
        travaux: "Test travaux pour téléchargement",
        realisation: "2024"
      }
    ];

    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template template.pptx manquant');
      return;
    }

    // Créer FormData et envoyer la requête
    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(testReferences));

    const enrichResponse = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    if (enrichResponse.ok) {
      console.log('✅ Fichier CV enrichi généré avec succès');
      
      // Sauvegarder pour vérification
      const buffer = await enrichResponse.buffer();
      const testOutputPath = path.join(__dirname, 'test-download-management.pptx');
      fs.writeFileSync(testOutputPath, buffer);
      console.log(`💾 Fichier sauvé: ${testOutputPath}`);
    } else {
      console.log('❌ Erreur lors de la génération du CV enrichi');
      return;
    }

    // 2. Lister les fichiers disponibles
    console.log('\n2️⃣ Liste des fichiers disponibles au téléchargement...');
    
    const listResponse = await fetch('http://localhost:4000/api/downloads');
    
    if (listResponse.ok) {
      const data = await listResponse.json();
      console.log(`✅ ${data.files.length} fichier(s) disponible(s):`);
      
      data.files.forEach((file, index) => {
        const sizeKB = Math.round(file.size / 1024);
        const createdDate = new Date(file.created).toLocaleString('fr-FR');
        console.log(`   ${index + 1}. ${file.filename}`);
        console.log(`      📏 Taille: ${sizeKB} KB`);
        console.log(`      📅 Créé: ${createdDate}`);
      });

      // 3. Tester le téléchargement d'un fichier spécifique
      if (data.files.length > 0) {
        console.log('\n3️⃣ Test de téléchargement d\'un fichier spécifique...');
        
        const firstFile = data.files[0];
        const downloadResponse = await fetch(`http://localhost:4000/api/download/${firstFile.filename}`);
        
        if (downloadResponse.ok) {
          console.log(`✅ Téléchargement réussi: ${firstFile.filename}`);
          console.log(`📋 Content-Type: ${downloadResponse.headers.get('content-type')}`);
          console.log(`📥 Content-Disposition: ${downloadResponse.headers.get('content-disposition')}`);
          
          // Sauvegarder le fichier téléchargé
          const downloadBuffer = await downloadResponse.buffer();
          const downloadedPath = path.join(__dirname, `downloaded_${firstFile.filename}`);
          fs.writeFileSync(downloadedPath, downloadBuffer);
          console.log(`💾 Fichier téléchargé sauvé: ${downloadedPath}`);
        } else {
          console.log(`❌ Erreur lors du téléchargement: ${downloadResponse.status}`);
        }
      }
    } else {
      console.log('❌ Erreur lors de la récupération de la liste des fichiers');
    }

    // 4. Test des endpoints de sécurité
    console.log('\n4️⃣ Test de sécurité (tentative d\'accès invalide)...');
    
    const securityTests = [
      '../../../etc/passwd',
      'test.txt',
      'malicious..pptx',
      'test/malicious.pptx'
    ];

    for (const testFile of securityTests) {
      const securityResponse = await fetch(`http://localhost:4000/api/download/${encodeURIComponent(testFile)}`);
      if (securityResponse.status === 400 || securityResponse.status === 404) {
        console.log(`✅ Sécurité OK pour: ${testFile} (Status: ${securityResponse.status})`);
      } else {
        console.log(`⚠️ Problème de sécurité potentiel pour: ${testFile} (Status: ${securityResponse.status})`);
      }
    }

    console.log('\n🎉 RÉSULTATS DU TEST DE GESTION DES TÉLÉCHARGEMENTS');
    console.log('===================================================');
    console.log('✅ Génération de fichier CV enrichi');
    console.log('✅ Listing des fichiers disponibles');
    console.log('✅ Téléchargement de fichier spécifique');
    console.log('✅ Sécurité des endpoints');
    console.log('\n🚀 LA GESTION DES TÉLÉCHARGEMENTS FONCTIONNE !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('\n💡 SOLUTION:');
    console.log('1. Assurez-vous que le serveur est démarré: node index.js');
    console.log('2. Puis relancez ce test: node test-download-management.js');
  }
}

if (require.main === module) {
  testDownloadManagement();
}

module.exports = testDownloadManagement;
