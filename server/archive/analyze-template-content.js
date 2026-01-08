const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function analyzeTemplateContent() {
  try {
    console.log('🔍 ANALYSE DU CONTENU DU TEMPLATE');
    console.log('=================================\n');

    const templatePath = path.join(__dirname, 'template.pptx');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template non trouvé:', templatePath);
      return;
    }

    console.log('📁 Lecture du template...');
    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    // Trouver les slides principaux
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels') && !f.includes('Layout') && !f.includes('Master')
    );

    console.log(`📊 ${slideFiles.length} slide(s) principal(aux) trouvé(s)`);

    for (const slideFile of slideFiles) {
      console.log(`\n📄 ANALYSE DU SLIDE: ${slideFile}`);
      console.log('=' + '='.repeat(slideFile.length + 20));
      
      let slideContent = await zip.files[slideFile].async('text');
      
      // Chercher tous les placeholders de références
      console.log('\n🔍 PLACEHOLDERS TROUVÉS:');
      
      // Placeholders individuels
      for (let i = 1; i <= 5; i++) {
        const placeholders = [
          `{{REF_${i}_RESIDENCE}}`,
          `{{REF_${i}_MOA}}`,
          `{{REF_${i}_MONTANT}}`,
          `{{REF_${i}_TRAVAUX}}`,
          `{{REF_${i}_REALISATION}}`,
          `{{REF_${i}}}`
        ];
        
        let foundForRef = [];
        placeholders.forEach(placeholder => {
          if (slideContent.includes(placeholder)) {
            foundForRef.push(placeholder);
          }
        });
        
        if (foundForRef.length > 0) {
          console.log(`\n📌 RÉFÉRENCE ${i}:`);
          foundForRef.forEach(p => console.log(`   ✅ ${p}`));
        }
      }
      
      // Anciens placeholders
      const oldPlaceholders = [
        '{{REF_RESIDENCE}}',
        '{{REF_MOA}}', 
        '{{REF_MONTANT}}',
        '{{REF_TRAVAUX}}',
        '{{REF_REALISATION}}'
      ];
      
      let foundOld = [];
      oldPlaceholders.forEach(placeholder => {
        if (slideContent.includes(placeholder)) {
          foundOld.push(placeholder);
        }
      });
      
      if (foundOld.length > 0) {
        console.log(`\n📌 ANCIENS PLACEHOLDERS (compatibilité):`);
        foundOld.forEach(p => console.log(`   ⚠️  ${p}`));
      }
      
      // Extraire et afficher un échantillon du contenu autour des placeholders
      console.log('\n📝 ÉCHANTILLON DE CONTENU:');
      
      // Chercher le contexte autour des placeholders REF_1
      const ref1Pattern = /(.{0,100}{{REF_1[^}]*}}.{0,100})/g;
      let matches = slideContent.match(ref1Pattern);
      
      if (matches) {
        console.log('\n🎯 Contexte autour de REF_1:');
        matches.slice(0, 3).forEach((match, index) => {
          // Nettoyer le XML pour l'affichage
          const cleanMatch = match
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          console.log(`   ${index + 1}. ...${cleanMatch}...`);
        });
      }
      
      // Chercher le contexte autour des placeholders REF_2, REF_3, etc.
      for (let i = 2; i <= 5; i++) {
        const refPattern = new RegExp(`(.{0,50}{{REF_${i}[^}]*}}.{0,50})`, 'g');
        let refMatches = slideContent.match(refPattern);
        
        if (refMatches) {
          console.log(`\n🎯 Contexte autour de REF_${i}:`);
          refMatches.slice(0, 2).forEach((match, index) => {
            const cleanMatch = match
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            console.log(`   ${index + 1}. ...${cleanMatch}...`);
          });
        }
      }
    }

    console.log('\n📊 RÉSUMÉ DE L\'ANALYSE:');
    console.log('========================');
    console.log('✅ Template analysé avec succès');
    console.log('💡 Vérifiez que les placeholders REF_2, REF_3, etc. sont bien séparés');
    console.log('💡 Si tous les placeholders sont dans la même zone, il faut les répartir manuellement');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

if (require.main === module) {
  analyzeTemplateContent();
}

module.exports = analyzeTemplateContent;
