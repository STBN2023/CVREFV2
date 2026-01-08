const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function analyzeTemplatePlaceholders() {
  try {
    console.log('🔍 ANALYSE DES PLACEHOLDERS DU TEMPLATE');
    console.log('=======================================\n');

    const templatePath = path.join(__dirname, 'template.pptx');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template non trouvé');
      return;
    }

    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    // Analyser le slide principal
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide1.xml') && !f.includes('_rels')
    );

    if (slideFiles.length === 0) {
      console.log('❌ Slide principal non trouvé');
      return;
    }

    const slideContent = await zip.files[slideFiles[0]].async('text');
    console.log(`📄 Slide analysé: ${slideFiles[0]}`);
    console.log(`📏 Taille: ${slideContent.length} caractères\n`);

    // Chercher tous les placeholders
    console.log('🔍 PLACEHOLDERS TROUVÉS:');
    
    // Placeholders individuels
    for (let i = 1; i <= 5; i++) {
      console.log(`\n📌 RÉFÉRENCE ${i}:`);
      
      const placeholders = [
        `{{REF_${i}_RESIDENCE}}`,
        `{{REF_${i}_MOA}}`,
        `{{REF_${i}_MONTANT}}`,
        `{{REF_${i}_TRAVAUX}}`,
        `{{REF_${i}_REALISATION}}`
      ];
      
      placeholders.forEach(placeholder => {
        const count = (slideContent.match(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
        console.log(`   ${placeholder}: ${count} occurrence(s)`);
      });
    }

    // Anciens placeholders
    console.log('\n📌 ANCIENS PLACEHOLDERS:');
    const oldPlaceholders = [
      '{{REF_RESIDENCE}}',
      '{{REF_MOA}}',
      '{{REF_MONTANT}}',
      '{{REF_TRAVAUX}}',
      '{{REF_REALISATION}}'
    ];
    
    oldPlaceholders.forEach(placeholder => {
      const count = (slideContent.match(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        console.log(`   ${placeholder}: ${count} occurrence(s) ⚠️`);
      }
    });

    // Chercher les sections
    console.log('\n📋 SECTIONS TROUVÉES:');
    for (let i = 1; i <= 5; i++) {
      const sectionPattern = new RegExp(`RÉFÉRENCE ${i}`, 'i');
      const found = sectionPattern.test(slideContent);
      console.log(`   Section ${i}: ${found ? '✅' : '❌'}`);
    }

    // Diagnostic
    console.log('\n🎯 DIAGNOSTIC:');
    
    // Vérifier s'il y a des anciens placeholders
    const hasOldPlaceholders = oldPlaceholders.some(p => slideContent.includes(p));
    if (hasOldPlaceholders) {
      console.log('⚠️ PROBLÈME: Anciens placeholders détectés !');
      console.log('💡 Ces placeholders sont remplacés par la première référence');
      console.log('💡 Solution: Supprimer tous les anciens placeholders du template');
    }

    // Vérifier la distribution des placeholders
    let totalIndividualPlaceholders = 0;
    for (let i = 1; i <= 5; i++) {
      const refPlaceholders = [
        `{{REF_${i}_RESIDENCE}}`,
        `{{REF_${i}_MOA}}`,
        `{{REF_${i}_MONTANT}}`,
        `{{REF_${i}_TRAVAUX}}`,
        `{{REF_${i}_REALISATION}}`
      ];
      
      const refCount = refPlaceholders.reduce((count, p) => {
        return count + (slideContent.match(new RegExp(p.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
      }, 0);
      
      totalIndividualPlaceholders += refCount;
    }

    console.log(`📊 Total placeholders individuels: ${totalIndividualPlaceholders}`);
    
    if (totalIndividualPlaceholders === 25) { // 5 refs × 5 placeholders
      console.log('✅ Nombre correct de placeholders individuels');
    } else {
      console.log('⚠️ Nombre incorrect de placeholders');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

if (require.main === module) {
  analyzeTemplatePlaceholders();
}

module.exports = analyzeTemplatePlaceholders;
