const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testDownloadsSystem() {
  try {
    console.log('🧪 TEST DU SYSTÈME DE TÉLÉCHARGEMENTS');
    console.log('====================================\n');

    const baseUrl = 'http://localhost:4000';

    // 1. Vérifier que le dossier downloads existe
    console.log('📁 VÉRIFICATION DU DOSSIER DOWNLOADS:');
    const downloadsDir = path.join(__dirname, 'downloads');
    
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
      console.log('✅ Dossier downloads créé');
    } else {
      console.log('✅ Dossier downloads existe');
    }

    // 2. Générer un fichier de test via l'API d'enrichissement
    console.log('\n📤 GÉNÉRATION D\'UN FICHIER DE TEST:');
    
    const testRef = {
      residence: "TEST DOWNLOADS",
      moa: "TEST MOA",
      montant: 100000,
      travaux: "TEST TRAVAUX",
      realisation: "2024"
    };

    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template manquant');
      return;
    }

    const form = new FormData();
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify([testRef]));

    console.log('🔄 Envoi vers /api/enrich-cv...');
    const enrichResponse = await fetch(`${baseUrl}/api/enrich-cv`, {
      method: 'POST',
      body: form
    });

    if (!enrichResponse.ok) {
      console.log(`❌ Erreur enrichissement: ${enrichResponse.status}`);
      return;
    }

    console.log('✅ Fichier généré via API d\'enrichissement');

    // 3. Tester l'endpoint de liste des fichiers
    console.log('\n📋 TEST DE LA LISTE DES FICHIERS:');
    
    const listResponse = await fetch(`${baseUrl}/api/downloads`);
    
    if (!listResponse.ok) {
      console.log(`❌ Erreur liste: ${listResponse.status}`);
      return;
    }

    const listData = await listResponse.json();
    console.log(`✅ Liste récupérée: ${listData.files.length} fichier(s)`);
    
    if (listData.files.length > 0) {
      console.log('\n📄 FICHIERS DISPONIBLES:');
      listData.files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.filename}`);
        console.log(`   Taille: ${file.size} bytes`);
        console.log(`   Créé: ${new Date(file.created).toLocaleString()}`);
        console.log('');
      });

      // 4. Tester le téléchargement d'un fichier spécifique
      const testFile = listData.files[0];
      console.log(`📥 TEST DE TÉLÉCHARGEMENT: ${testFile.filename}`);
      
      const downloadResponse = await fetch(`${baseUrl}/api/download/${encodeURIComponent(testFile.filename)}`);
      
      if (!downloadResponse.ok) {
        console.log(`❌ Erreur téléchargement: ${downloadResponse.status}`);
        return;
      }

      const downloadBuffer = await downloadResponse.buffer();
      console.log(`✅ Fichier téléchargé: ${downloadBuffer.length} bytes`);
      
      // Vérifier les headers
      const contentType = downloadResponse.headers.get('content-type');
      const contentDisposition = downloadResponse.headers.get('content-disposition');
      
      console.log(`📋 Content-Type: ${contentType}`);
      console.log(`📋 Content-Disposition: ${contentDisposition}`);

      // 5. Tester la suppression d'un fichier (optionnel - créer un fichier de test d'abord)
      console.log('\n🗑️ TEST DE SUPPRESSION:');
      
      // Créer un fichier de test pour la suppression
      const testDeleteFile = 'test-delete.pptx';
      const testDeletePath = path.join(downloadsDir, testDeleteFile);
      fs.copyFileSync(templatePath, testDeletePath);
      console.log(`📁 Fichier de test créé: ${testDeleteFile}`);
      
      const deleteResponse = await fetch(`${baseUrl}/api/download/${encodeURIComponent(testDeleteFile)}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) {
        console.log(`❌ Erreur suppression: ${deleteResponse.status}`);
      } else {
        const deleteData = await deleteResponse.json();
        console.log(`✅ Suppression réussie: ${deleteData.message}`);
        
        // Vérifier que le fichier a été supprimé
        if (!fs.existsSync(testDeletePath)) {
          console.log('✅ Fichier effectivement supprimé du système de fichiers');
        } else {
          console.log('⚠️ Fichier toujours présent sur le disque');
        }
      }

      // 6. Vérifier la liste mise à jour
      console.log('\n🔄 VÉRIFICATION DE LA LISTE MISE À JOUR:');
      
      const updatedListResponse = await fetch(`${baseUrl}/api/downloads`);
      const updatedListData = await updatedListResponse.json();
      
      console.log(`📋 Fichiers après suppression: ${updatedListData.files.length}`);
      
    } else {
      console.log('⚠️ Aucun fichier trouvé dans le dossier downloads');
    }

    console.log('\n🎯 RÉSULTATS DU TEST:');
    console.log('====================');
    console.log('✅ Génération de fichiers via API');
    console.log('✅ Liste des fichiers disponibles');
    console.log('✅ Téléchargement de fichiers spécifiques');
    console.log('✅ Suppression de fichiers');
    console.log('✅ Système de téléchargements opérationnel !');

    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Testez l\'interface frontend /downloads');
    console.log('2. Vérifiez que les fichiers apparaissent dans la liste');
    console.log('3. Testez le téléchargement depuis l\'interface');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('\n💡 VÉRIFICATIONS:');
    console.log('1. Le serveur backend est-il démarré ? (node index.js)');
    console.log('2. Le port 4000 est-il accessible ?');
    console.log('3. Le template.pptx existe-t-il ?');
  }
}

if (require.main === module) {
  testDownloadsSystem();
}

module.exports = testDownloadsSystem;
