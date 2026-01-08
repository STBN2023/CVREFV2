// Analyser la structure complète des volets dans le template

const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function analyzeVoletStructure() {
  console.log('🔍 === ANALYSE STRUCTURE VOLETS TEMPLATE ===\n');
  
  try {
    const templatePath = path.join(__dirname, 'template.pptx');
    const templateBuffer = fs.readFileSync(templatePath);
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(templateBuffer);
    
    // Analyser les slides
    const slideFiles = Object.keys(zipContent.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );
    
    console.log(`📄 Slides trouvés: ${slideFiles.length}`);
    
    for (const slideFile of slideFiles) {
      console.log(`\n🔍 === ANALYSE ${slideFile} ===`);
      
      const slideContent = await zipContent.files[slideFile].async('string');
      
      // Chercher les placeholders et leur contexte
      const placeholderMatches = slideContent.match(/\{\{[^}]+\}\}/g);
      if (placeholderMatches) {
        console.log(`📍 Placeholders trouvés: ${placeholderMatches.length}`);
        
        placeholderMatches.forEach((placeholder, index) => {
          console.log(`\n   ${index + 1}. ${placeholder}`);
          
          // Trouver le contexte autour du placeholder
          const placeholderIndex = slideContent.indexOf(placeholder);
          const contextBefore = slideContent.substring(Math.max(0, placeholderIndex - 500), placeholderIndex);
          const contextAfter = slideContent.substring(placeholderIndex + placeholder.length, placeholderIndex + placeholder.length + 500);
          
          // Analyser la hiérarchie des balises
          console.log('   📋 CONTEXTE AVANT:');
          const beforeTags = contextBefore.match(/<[^>]+>/g) || [];
          const relevantBeforeTags = beforeTags.slice(-10); // 10 dernières balises
          relevantBeforeTags.forEach(tag => {
            if (tag.includes('p:sp') || tag.includes('p:txBody') || tag.includes('a:p') || tag.includes('a:r')) {
              console.log(`      ${tag}`);
            }
          });
          
          console.log('   📋 CONTEXTE APRÈS:');
          const afterTags = contextAfter.match(/<[^>]+>/g) || [];
          const relevantAfterTags = afterTags.slice(0, 10); // 10 premières balises
          relevantAfterTags.forEach(tag => {
            if (tag.includes('/p:sp') || tag.includes('/p:txBody') || tag.includes('/a:p') || tag.includes('/a:r')) {
              console.log(`      ${tag}`);
            }
          });
          
          // Identifier la structure englobante
          console.log('   🏗️ STRUCTURE ENGLOBANTE:');
          if (contextBefore.includes('<p:sp')) {
            console.log('      ✅ Dans une FORME <p:sp> (Shape PowerPoint)');
          }
          if (contextBefore.includes('<p:txBody')) {
            console.log('      ✅ Dans un VOLET TEXTE <p:txBody>');
          }
          if (contextBefore.includes('<a:p')) {
            console.log('      ✅ Dans un PARAGRAPHE <a:p>');
          }
          if (contextBefore.includes('<a:r')) {
            console.log('      ✅ Dans un RUN <a:r>');
          }
          
          console.log('   ─────────────────────────────────────');
        });
      }
    }
    
    console.log('\n🎯 === RECOMMANDATIONS ===');
    console.log('Basé sur l\'analyse, nous devrions supprimer:');
    console.log('1. 🎯 FORME COMPLÈTE <p:sp>...</p:sp> si placeholder dans une forme');
    console.log('2. 📝 VOLET TEXTE <p:txBody>...</p:txBody> si placeholder dans un volet');
    console.log('3. 📄 PARAGRAPHE <a:p>...</a:p> si placeholder dans un paragraphe (actuel)');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

analyzeVoletStructure();
