const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function debugDownloadsPage() {
  try {
    console.log('🔍 DEBUG DE LA PAGE TÉLÉCHARGEMENTS');
    console.log('===================================\n');

    const baseUrl = 'http://localhost:4000';

    // 1. Vérifier l'état du dossier downloads
    console.log('1. ÉTAT DU DOSSIER DOWNLOADS:');
    const downloadsDir = path.join(__dirname, 'downloads');
    
    if (fs.existsSync(downloadsDir)) {
      const files = fs.readdirSync(downloadsDir)
        .filter(f => f.endsWith('.pptx'))
        .map(f => {
          const filePath = path.join(downloadsDir, f);
          const stats = fs.statSync(filePath);
          return {
            name: f,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created);

      console.log(`📁 Dossier downloads: ${files.length} fichier(s)`);
      
      if (files.length > 0) {
        console.log('\n📄 FICHIERS PRÉSENTS:');
        files.slice(0, 5).forEach((file, i) => {
          console.log(`${i+1}. ${file.name}`);
          console.log(`   Taille: ${file.size} bytes`);
          console.log(`   Créé: ${file.created.toLocaleString()}`);
          console.log(`   Modifié: ${file.modified.toLocaleString()}\n`);
        });
      }
    } else {
      console.log('❌ Dossier downloads n\'existe pas');
      return;
    }

    // 2. Tester l'API /api/downloads
    console.log('2. TEST DE L\'API /api/downloads:');
    
    try {
      const apiResponse = await fetch(`${baseUrl}/api/downloads`);
      console.log(`📊 Status: ${apiResponse.status}`);
      console.log(`📋 Content-Type: ${apiResponse.headers.get('content-type')}`);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log(`✅ API OK: ${apiData.files.length} fichier(s) retournés`);
        
        if (apiData.files.length > 0) {
          console.log('\n📄 FICHIERS VIA API:');
          apiData.files.slice(0, 3).forEach((file, i) => {
            console.log(`${i+1}. ${file.filename}`);
            console.log(`   Taille: ${file.size} bytes`);
            console.log(`   Créé: ${new Date(file.created).toLocaleString()}\n`);
          });
        }
      } else {
        const errorText = await apiResponse.text();
        console.log('❌ Erreur API:', errorText);
      }
    } catch (apiError) {
      console.log('❌ Erreur de connexion API:', apiError.message);
    }

    // 3. Simuler une requête frontend
    console.log('3. SIMULATION REQUÊTE FRONTEND:');
    
    try {
      const frontendResponse = await fetch(`${baseUrl}/api/downloads`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:8081',
          'Referer': 'http://localhost:8081/downloads'
        }
      });
      
      console.log(`📊 Status frontend: ${frontendResponse.status}`);
      
      if (frontendResponse.ok) {
        const frontendData = await frontendResponse.json();
        console.log(`✅ Frontend OK: ${frontendData.files.length} fichier(s)`);
        
        // Comparer avec les fichiers du système
        const systemFiles = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.pptx'));
        
        if (frontendData.files.length === systemFiles.length) {
          console.log('✅ Cohérence: API et système de fichiers correspondent');
        } else {
          console.log(`⚠️ Incohérence: API=${frontendData.files.length}, Système=${systemFiles.length}`);
        }
      } else {
        console.log('❌ Erreur simulation frontend');
      }
    } catch (frontendError) {
      console.log('❌ Erreur simulation frontend:', frontendError.message);
    }

    // 4. Vérifier les CORS
    console.log('\n4. VÉRIFICATION CORS:');
    
    try {
      const corsResponse = await fetch(`${baseUrl}/api/downloads`, {
        method: 'OPTIONS'
      });
      
      console.log(`📊 OPTIONS Status: ${corsResponse.status}`);
      console.log(`📋 Access-Control-Allow-Origin: ${corsResponse.headers.get('access-control-allow-origin')}`);
      console.log(`📋 Access-Control-Allow-Methods: ${corsResponse.headers.get('access-control-allow-methods')}`);
    } catch (corsError) {
      console.log('⚠️ CORS non testé:', corsError.message);
    }

    // 5. Test de génération et vérification immédiate
    console.log('\n5. TEST GÉNÉRATION + VÉRIFICATION:');
    
    const testRef = {
      residence: `TEST_DEBUG_${Date.now()}`,
      moa: "MOA_DEBUG",
      montant: 999999,
      travaux: "TRAVAUX_DEBUG",
      realisation: "2024"
    };

    console.log(`🔄 Génération d'un fichier de test: ${testRef.residence}`);
    
    // Compter les fichiers avant
    const filesBefore = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.pptx')).length;
    console.log(`📊 Fichiers avant génération: ${filesBefore}`);

    // Générer un fichier
    const FormData = require('form-data');
    const templatePath = path.join(__dirname, 'template.pptx');
    
    if (fs.existsSync(templatePath)) {
      const form = new FormData();
      form.append('pptx', fs.createReadStream(templatePath));
      form.append('references', JSON.stringify([testRef]));

      const generateResponse = await fetch(`${baseUrl}/api/enrich-cv`, {
        method: 'POST',
        body: form
      });

      if (generateResponse.ok) {
        console.log('✅ Fichier généré avec succès');
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Compter les fichiers après
        const filesAfter = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.pptx')).length;
        console.log(`📊 Fichiers après génération: ${filesAfter}`);
        
        if (filesAfter > filesBefore) {
          console.log('✅ Nouveau fichier détecté dans le système');
          
          // Tester l'API immédiatement après
          const immediateApiResponse = await fetch(`${baseUrl}/api/downloads`);
          if (immediateApiResponse.ok) {
            const immediateData = await immediateApiResponse.json();
            console.log(`📊 API immédiate: ${immediateData.files.length} fichier(s)`);
            
            if (immediateData.files.length === filesAfter) {
              console.log('✅ API mise à jour immédiatement');
            } else {
              console.log('⚠️ API pas encore mise à jour');
            }
          }
        } else {
          console.log('❌ Nouveau fichier non détecté');
        }
      } else {
        console.log('❌ Erreur lors de la génération');
      }
    }

    console.log('\n🎯 DIAGNOSTIC:');
    console.log('==============');
    console.log('Si l\'API fonctionne mais la page frontend ne se met pas à jour:');
    console.log('1. Problème de cache navigateur');
    console.log('2. Problème de timing dans le frontend');
    console.log('3. Erreurs JavaScript dans la console du navigateur');
    console.log('4. Problème de CORS ou de réseau');
    
    console.log('\n💡 SOLUTIONS À TESTER:');
    console.log('1. Ouvrir F12 → Console dans le navigateur sur /downloads');
    console.log('2. Cliquer sur "Actualiser" dans l\'interface');
    console.log('3. Vider le cache du navigateur (Ctrl+F5)');
    console.log('4. Redémarrer le serveur frontend');

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
  }
}

if (require.main === module) {
  debugDownloadsPage();
}

module.exports = debugDownloadsPage;
