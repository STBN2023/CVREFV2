// Analyser la vraie structure du template PowerPoint

const fs = require('fs');
const JSZip = require('jszip');

async function analyzeTemplate() {
  console.log('🔍 === ANALYSE STRUCTURE TEMPLATE RÉEL ===\n');
  
  try {
    // Lire le template
    const templatePath = './template.pptx';
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template non trouvé');
      return;
    }
    
    const templateBuffer = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(templateBuffer);
    
    console.log('📋 Fichiers dans le template:');
    Object.keys(zip.files).forEach(fileName => {
      if (fileName.includes('slide') && fileName.endsWith('.xml')) {
        console.log(`  • ${fileName}`);
      }
    });
    
    // Analyser les slides qui contiennent des placeholders
    for (const fileName of Object.keys(zip.files)) {
      if (fileName.includes('slide') && fileName.endsWith('.xml')) {
        const content = await zip.files[fileName].async('text');
        
        if (content.includes('{{REF_')) {
          console.log(`\n🎯 SLIDE AVEC PLACEHOLDERS: ${fileName}`);
          
          // Chercher les placeholders et leur contexte
          const placeholders = content.match(/\{\{[^}]+\}\}/g);
          if (placeholders) {
            console.log(`   Placeholders trouvés: ${placeholders.length}`);
            placeholders.slice(0, 2).forEach(ph => console.log(`     • ${ph}`));
            
            // Analyser la structure autour d'un placeholder
            const firstPlaceholder = placeholders[0];
            const escapedPh = firstPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Chercher différents types de conteneurs
            const contexts = [
              { name: 'p:sp (shape)', pattern: new RegExp(`<p:sp[\\s\\S]{0,500}${escapedPh}[\\s\\S]{0,200}</p:sp>`, 'g') },
              { name: 'a:p (paragraph)', pattern: new RegExp(`<a:p[\\s\\S]{0,200}${escapedPh}[\\s\\S]{0,100}</a:p>`, 'g') },
              { name: 'a:r (run)', pattern: new RegExp(`<a:r[\\s\\S]{0,100}${escapedPh}[\\s\\S]{0,50}</a:r>`, 'g') },
              { name: 'a:t (text)', pattern: new RegExp(`<a:t[\\s\\S]{0,50}${escapedPh}[\\s\\S]{0,50}</a:t>`, 'g') },
              { name: 'p:txBody (text body)', pattern: new RegExp(`<p:txBody[\\s\\S]{0,300}${escapedPh}[\\s\\S]{0,100}</p:txBody>`, 'g') }
            ];
            
            console.log(`\n   📊 Contexte autour de "${firstPlaceholder}":`);
            contexts.forEach(ctx => {
              const matches = content.match(ctx.pattern);
              if (matches && matches.length > 0) {
                console.log(`     ✅ ${ctx.name}: ${matches.length} trouvé(s)`);
                if (matches[0].length < 500) {
                  console.log(`        Exemple: ${matches[0].substring(0, 200)}...`);
                }
              } else {
                console.log(`     ❌ ${ctx.name}: non trouvé`);
              }
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

analyzeTemplate();
