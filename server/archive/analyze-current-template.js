const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function analyzeCurrentTemplate() {
  try {
    console.log('🔍 ANALYSE DU TEMPLATE ACTUEL');
    console.log('=============================\n');

    const templatePath = path.join(__dirname, "template.pptx");
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template non trouvé');
      return;
    }

    console.log(`📁 Analyse du template: ${templatePath}`);
    
    // Lire le template
    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    // Analyser le premier slide
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    if (slideFiles.length > 0) {
      const slideFile = slideFiles[0];
      console.log(`📄 Analyse de ${slideFile}...`);
      
      const content = await zip.files[slideFile].async('text');
      
      // Chercher tous les placeholders
      const placeholders = [];
      
      // Anciens placeholders
      const oldPlaceholders = ['{{REF_RESIDENCE}}', '{{REF_MOA}}', '{{REF_MONTANT}}', '{{REF_TRAVAUX}}', '{{REF_REALISATION}}'];
      
      // Nouveaux placeholders multi-références
      const newPlaceholders = [];
      for (let i = 1; i <= 3; i++) {
        newPlaceholders.push(`{{REF_${i}_RESIDENCE}}`);
        newPlaceholders.push(`{{REF_${i}_MOA}}`);
        newPlaceholders.push(`{{REF_${i}_MONTANT}}`);
        newPlaceholders.push(`{{REF_${i}_TRAVAUX}}`);
        newPlaceholders.push(`{{REF_${i}_REALISATION}}`);
      }
      
      const allPlaceholders = [...oldPlaceholders, ...newPlaceholders];
      
      console.log('\n🔍 RECHERCHE DES PLACEHOLDERS:');
      console.log('==============================');
      
      const foundPlaceholders = [];
      const missingPlaceholders = [];
      
      allPlaceholders.forEach(placeholder => {
        if (content.includes(placeholder)) {
          foundPlaceholders.push(placeholder);
        } else {
          missingPlaceholders.push(placeholder);
        }
      });
      
      if (foundPlaceholders.length > 0) {
        console.log('✅ Placeholders trouvés:');
        foundPlaceholders.forEach(p => console.log(`   - ${p}`));
      }
      
      if (missingPlaceholders.length > 0) {
        console.log('\n❌ Placeholders manquants:');
        missingPlaceholders.forEach(p => console.log(`   - ${p}`));
      }
      
      // Extraire le texte visible
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
      
      if (textMatches) {
        console.log('\n📝 TEXTE VISIBLE CONTENANT DES PLACEHOLDERS:');
        console.log('===========================================');
        
        const placeholderTexts = textMatches
          .map(match => match.replace(/<a:t>|<\/a:t>/g, ''))
          .filter(text => text.includes('{{') && text.includes('}}'))
          .slice(0, 10); // Limiter à 10 pour éviter trop de sortie
        
        if (placeholderTexts.length > 0) {
          placeholderTexts.forEach((text, index) => {
            console.log(`   ${index + 1}. "${text}"`);
          });
        } else {
          console.log('   Aucun placeholder trouvé dans le texte visible');
        }
      }
      
      // Statistiques
      console.log('\n📊 STATISTIQUES:');
      console.log('================');
      console.log(`- Placeholders trouvés: ${foundPlaceholders.length}`);
      console.log(`- Placeholders manquants: ${missingPlaceholders.length}`);
      console.log(`- Total textes visibles: ${textMatches ? textMatches.length : 0}`);

    } else {
      console.log('❌ Aucun slide trouvé dans le template');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  analyzeCurrentTemplate();
}

module.exports = analyzeCurrentTemplate;
