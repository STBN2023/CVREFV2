const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function cleanTemplateOldPlaceholders() {
  try {
    console.log('🧹 NETTOYAGE DES ANCIENS PLACEHOLDERS');
    console.log('====================================\n');

    const templatePath = path.join(__dirname, 'template.pptx');
    const cleanedPath = path.join(__dirname, 'template-cleaned.pptx');

    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template non trouvé');
      return;
    }

    console.log('📁 Lecture du template...');
    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    // Traiter tous les slides
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    console.log(`📊 ${slideFiles.length} slide(s) à nettoyer`);

    for (const slideFile of slideFiles) {
      console.log(`\n🔍 Nettoyage de ${slideFile}:`);
      
      let slideContent = await zip.files[slideFile].async('text');
      const originalLength = slideContent.length;
      
      // Chercher les anciens placeholders
      const oldPlaceholders = [
        '{{REF_RESIDENCE}}',
        '{{REF_MOA}}',
        '{{REF_MONTANT}}',
        '{{REF_TRAVAUX}}',
        '{{REF_REALISATION}}'
      ];

      let foundOldPlaceholders = [];
      oldPlaceholders.forEach(placeholder => {
        const count = (slideContent.match(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
        if (count > 0) {
          foundOldPlaceholders.push({ placeholder, count });
        }
      });

      if (foundOldPlaceholders.length > 0) {
        console.log('   ⚠️ Anciens placeholders trouvés:');
        foundOldPlaceholders.forEach(({ placeholder, count }) => {
          console.log(`      ${placeholder}: ${count} occurrence(s)`);
        });

        // Supprimer tous les anciens placeholders
        foundOldPlaceholders.forEach(({ placeholder }) => {
          slideContent = slideContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), '');
          console.log(`   🗑️ Supprimé: ${placeholder}`);
        });

        console.log(`   📏 Taille: ${originalLength} → ${slideContent.length} caractères`);
        
        // Sauvegarder le slide nettoyé
        zip.file(slideFile, slideContent);
      } else {
        console.log('   ✅ Aucun ancien placeholder trouvé');
      }
    }

    // Sauvegarder le template nettoyé
    console.log('\n💾 Sauvegarde du template nettoyé...');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(cleanedPath, buffer);

    console.log(`✅ Template nettoyé créé: ${cleanedPath}`);
    console.log(`📏 Taille: ${buffer.length} bytes`);

    // Vérification du template nettoyé
    console.log('\n🧪 Vérification du template nettoyé:');
    const testZip = await JSZip.loadAsync(buffer);
    
    for (const slideFile of slideFiles) {
      const testContent = await testZip.files[slideFile].async('text');
      
      // Vérifier qu'il n'y a plus d'anciens placeholders
      const oldPlaceholders = [
        '{{REF_RESIDENCE}}',
        '{{REF_MOA}}',
        '{{REF_MONTANT}}',
        '{{REF_TRAVAUX}}',
        '{{REF_REALISATION}}'
      ];

      let stillHasOld = false;
      oldPlaceholders.forEach(placeholder => {
        if (testContent.includes(placeholder)) {
          stillHasOld = true;
          console.log(`   ⚠️ ${slideFile}: ${placeholder} encore présent`);
        }
      });

      if (!stillHasOld) {
        console.log(`   ✅ ${slideFile}: Tous les anciens placeholders supprimés`);
      }

      // Compter les nouveaux placeholders
      let newPlaceholderCount = 0;
      for (let i = 1; i <= 5; i++) {
        const newPlaceholders = [
          `{{REF_${i}_RESIDENCE}}`,
          `{{REF_${i}_MOA}}`,
          `{{REF_${i}_MONTANT}}`,
          `{{REF_${i}_TRAVAUX}}`,
          `{{REF_${i}_REALISATION}}`
        ];
        
        newPlaceholders.forEach(placeholder => {
          if (testContent.includes(placeholder)) {
            newPlaceholderCount++;
          }
        });
      }
      
      console.log(`   📊 ${slideFile}: ${newPlaceholderCount} nouveaux placeholders`);
    }

    console.log('\n🎉 NETTOYAGE TERMINÉ !');
    console.log('======================');
    console.log('✅ Anciens placeholders supprimés');
    console.log('✅ Nouveaux placeholders conservés');
    console.log('\n💡 UTILISATION:');
    console.log('1. copy template-cleaned.pptx template.pptx');
    console.log('2. Testez à nouveau avec quick-test-separation.js');
    console.log('3. Chaque référence devrait maintenant être unique');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

if (require.main === module) {
  cleanTemplateOldPlaceholders();
}

module.exports = cleanTemplateOldPlaceholders;
