const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

// Script pour vérifier que les références sont bien injectées dans les placeholders

async function verifyPlaceholders() {
  console.log('\n🔍 === VÉRIFICATION DES PLACEHOLDERS ===\n');
  
  // 1. Analyser le template original
  console.log('📋 1. ANALYSE DU TEMPLATE ORIGINAL');
  await analyzeFile('template.pptx', 'Template original');
  
  // 2. Analyser les CV générés dans downloads
  console.log('\n📋 2. ANALYSE DES CV GÉNÉRÉS');
  const downloadsDir = path.join(__dirname, 'downloads');
  
  if (!fs.existsSync(downloadsDir)) {
    console.log('❌ Dossier downloads introuvable');
    return;
  }
  
  const files = fs.readdirSync(downloadsDir)
    .filter(f => f.endsWith('.pptx'))
    .sort((a, b) => {
      const statA = fs.statSync(path.join(downloadsDir, a));
      const statB = fs.statSync(path.join(downloadsDir, b));
      return statB.mtime - statA.mtime; // Plus récents en premier
    });
  
  if (files.length === 0) {
    console.log('❌ Aucun fichier CV trouvé dans downloads');
    return;
  }
  
  console.log(`📊 ${files.length} fichier(s) CV trouvé(s)`);
  
  // Analyser les 3 plus récents
  for (let i = 0; i < Math.min(3, files.length); i++) {
    const filename = files[i];
    const filePath = path.join(downloadsDir, filename);
    console.log(`\n--- Analyse ${i + 1}/${Math.min(3, files.length)} : ${filename} ---`);
    await analyzeFile(filePath, `CV généré ${i + 1}`);
  }
  
  console.log('\n🏁 === FIN VÉRIFICATION ===\n');
}

async function analyzeFile(filePath, description) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${description} : Fichier introuvable - ${filePath}`);
      return;
    }
    
    const stat = fs.statSync(filePath);
    console.log(`📁 ${description} : ${Math.round(stat.size / 1024)} KB`);
    
    // Lire le fichier PPTX
    const zip = new JSZip();
    const content = await zip.loadAsync(fs.readFileSync(filePath));
    
    let placeholdersFound = [];
    let referencesFound = [];
    let slidesAnalyzed = 0;
    
    // Analyser tous les fichiers XML des slides
    const files = Object.keys(content.files);
    for (const fileName of files) {
      if (fileName.includes('slide') && fileName.endsWith('.xml')) {
        const file = content.files[fileName];
        if (!file.dir) {
          slidesAnalyzed++;
          const xmlContent = await file.async('string');
          
          // Chercher les placeholders non remplacés
          const placeholderMatches = xmlContent.match(/\{\{[^}]+\}\}/g);
          if (placeholderMatches) {
            placeholdersFound.push(...placeholderMatches);
          }
          
          // Chercher des indices de références injectées
          const referencePatterns = [
            /\d+\.\s+[A-Za-zÀ-ÿ\s]+/g, // Pattern "1. Nom Projet"
            /Client\s*:\s*[A-Za-zÀ-ÿ\s]+/g, // Pattern "Client: ..."
            /Montant\s*:\s*[\d\s€]+/g, // Pattern "Montant: ..."
            /Année\s*:\s*\d{4}/g // Pattern "Année: 2021"
          ];
          
          referencePatterns.forEach(pattern => {
            const matches = xmlContent.match(pattern);
            if (matches) {
              referencesFound.push(...matches);
            }
          });
        }
      }
    }
    
    // Résultats
    console.log(`📊 Slides analysés : ${slidesAnalyzed}`);
    
    if (placeholdersFound.length > 0) {
      console.log(`⚠️  Placeholders NON remplacés : ${placeholdersFound.length}`);
      const uniquePlaceholders = [...new Set(placeholdersFound)];
      uniquePlaceholders.forEach(p => console.log(`   • ${p}`));
    } else {
      console.log(`✅ Aucun placeholder non remplacé trouvé`);
    }
    
    if (referencesFound.length > 0) {
      console.log(`✅ Références détectées : ${referencesFound.length}`);
      // Afficher quelques exemples
      const examples = referencesFound.slice(0, 3);
      examples.forEach(r => console.log(`   • ${r.substring(0, 50)}${r.length > 50 ? '...' : ''}`));
      if (referencesFound.length > 3) {
        console.log(`   • ... et ${referencesFound.length - 3} autres`);
      }
    } else {
      console.log(`❌ Aucune référence détectée`);
    }
    
  } catch (error) {
    console.error(`💥 Erreur analyse ${description}:`, error.message);
  }
}

// Test avec données simulées
async function testWithMockData() {
  console.log('\n🧪 === TEST AVEC DONNÉES SIMULÉES ===\n');
  
  const mockReferences = [
    {
      nom_projet: "Tour Majunga",
      client: "Société Générale", 
      montant: 12000000,
      annee: 2021
    },
    {
      nom_projet: "Hôpital Sud",
      client: "CHU Lyon",
      montant: 8000000, 
      annee: 2019
    }
  ];
  
  console.log('📋 Données de test :');
  mockReferences.forEach((ref, i) => {
    console.log(`   ${i + 1}. ${ref.nom_projet} - ${ref.client} - ${ref.montant.toLocaleString()} € - ${ref.annee}`);
  });
  
  // Simuler la génération du texte comme dans server.js
  const refsText = mockReferences.map((ref, index) => {
    const nom = ref.nom_projet || `Projet ${index + 1}`;
    const client = ref.client || 'Client non spécifié';
    const montant = ref.montant ? `${ref.montant.toLocaleString()} €` : 'Non spécifié';
    const annee = ref.annee || 'Non spécifié';
    
    return `${index + 1}. ${nom}\n   Client: ${client}\n   Montant: ${montant}\n   Année: ${annee}`;
  }).join('\n\n');
  
  console.log('\n📝 Texte généré pour remplacement :');
  console.log('---');
  console.log(refsText);
  console.log('---');
  
  console.log(`\n📊 Longueur du texte : ${refsText.length} caractères`);
  console.log(`📊 Nombre de lignes : ${refsText.split('\n').length}`);
}

// Exécution
if (require.main === module) {
  (async () => {
    await testWithMockData();
    await verifyPlaceholders();
  })();
}

module.exports = { verifyPlaceholders, analyzeFile };
