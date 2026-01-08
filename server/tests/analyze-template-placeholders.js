const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

// Script pour analyser en détail tous les placeholders du template

async function analyzeTemplatePlaceholders() {
  console.log('\n🔍 === ANALYSE DÉTAILLÉE DES PLACEHOLDERS ===\n');
  
  const templatePath = path.join(__dirname, 'template.pptx');
  
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Template introuvable:', templatePath);
    return;
  }
  
  try {
    const zip = new JSZip();
    const content = await zip.loadAsync(fs.readFileSync(templatePath));
    
    const allPlaceholders = new Set();
    const placeholdersByFile = {};
    
    // Analyser tous les fichiers XML
    const files = Object.keys(content.files);
    for (const fileName of files) {
      if (fileName.endsWith('.xml')) {
        const file = content.files[fileName];
        if (!file.dir) {
          const xmlContent = await file.async('string');
          
          // Chercher tous les placeholders {{...}}
          const placeholderMatches = xmlContent.match(/\{\{[^}]+\}\}/g);
          if (placeholderMatches) {
            placeholdersByFile[fileName] = placeholderMatches;
            placeholderMatches.forEach(p => allPlaceholders.add(p));
          }
        }
      }
    }
    
    console.log('📊 RÉSUMÉ GLOBAL :');
    console.log(`   • Total placeholders uniques : ${allPlaceholders.size}`);
    console.log(`   • Fichiers contenant des placeholders : ${Object.keys(placeholdersByFile).length}`);
    
    console.log('\n📋 PLACEHOLDERS TROUVÉS :');
    const sortedPlaceholders = Array.from(allPlaceholders).sort();
    sortedPlaceholders.forEach((placeholder, index) => {
      console.log(`   ${index + 1}. ${placeholder}`);
    });
    
    console.log('\n📁 RÉPARTITION PAR FICHIER :');
    Object.entries(placeholdersByFile).forEach(([fileName, placeholders]) => {
      if (fileName.includes('slide')) {
        console.log(`\n🔸 ${fileName} (${placeholders.length} placeholders) :`);
        const uniquePlaceholders = [...new Set(placeholders)];
        uniquePlaceholders.forEach(p => {
          const count = placeholders.filter(ph => ph === p).length;
          console.log(`   • ${p} ${count > 1 ? `(${count}x)` : ''}`);
        });
      }
    });
    
    // Analyser les patterns
    console.log('\n🔍 ANALYSE DES PATTERNS :');
    
    const patterns = {
      'REF_': sortedPlaceholders.filter(p => p.includes('REF_')),
      'REFERENCE_': sortedPlaceholders.filter(p => p.includes('REFERENCE_')),
      'Numérotés': sortedPlaceholders.filter(p => /\d+/.test(p)),
      'Autres': sortedPlaceholders.filter(p => !p.includes('REF_') && !p.includes('REFERENCE_'))
    };
    
    Object.entries(patterns).forEach(([pattern, placeholders]) => {
      if (placeholders.length > 0) {
        console.log(`\n🔸 Pattern "${pattern}" (${placeholders.length}) :`);
        placeholders.forEach(p => console.log(`   • ${p}`));
      }
    });
    
  } catch (error) {
    console.error('💥 Erreur analyse:', error.message);
  }
  
  console.log('\n🏁 === FIN ANALYSE ===\n');
}

// Exécution
if (require.main === module) {
  analyzeTemplatePlaceholders();
}

module.exports = { analyzeTemplatePlaceholders };
