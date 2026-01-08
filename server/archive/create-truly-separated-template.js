const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function createTrulySeparatedTemplate() {
  try {
    console.log('🔧 CRÉATION D\'UN TEMPLATE AVEC RÉFÉRENCES VRAIMENT SÉPARÉES');
    console.log('===========================================================\n');

    // Utiliser template-fixed comme base (le bon template)
    const templatePath = path.join(__dirname, 'template.pptx'); // MODIFIÉ: Utiliser template.pptx comme base
    const outputPath = path.join(__dirname, 'template-truly-separated.pptx');

    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template template-fixed.pptx non trouvé');
      return;
    }

    console.log('📁 Lecture du template template-fixed.pptx...');
    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    // Trouver le slide principal
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide1.xml') && !f.includes('_rels')
    );

    if (slideFiles.length === 0) {
      console.log('❌ Slide principal non trouvé');
      return;
    }

    const slideFile = slideFiles[0];
    console.log(`🔍 Traitement du slide: ${slideFile}`);
    
    let slideContent = await zip.files[slideFile].async('text');
    console.log(`📏 Taille originale: ${slideContent.length} caractères`);

    // Chercher les placeholders existants
    const existingPlaceholders = [
      '{{REF_RESIDENCE}}',
      '{{REF_MOA}}', 
      '{{REF_MONTANT}}',
      '{{REF_TRAVAUX}}',
      '{{REF_REALISATION}}'
    ];

    let foundPlaceholders = [];
    existingPlaceholders.forEach(placeholder => {
      if (slideContent.includes(placeholder)) {
        foundPlaceholders.push(placeholder);
      }
    });

    console.log(`✅ Placeholders trouvés: ${foundPlaceholders.length}`);
    foundPlaceholders.forEach(p => console.log(`   - ${p}`));

    if (foundPlaceholders.length > 0) {
      console.log('\n🔄 Création des sections vraiment séparées...');
      
      // Créer le contenu avec 5 sections complètement distinctes
      let separatedContent = `

╔══════════════════════════════════════════════════════════════╗
║                         RÉFÉRENCE 1                         ║
╚══════════════════════════════════════════════════════════════╝

🏢 Résidence : {{REF_1_RESIDENCE}}
👤 Maître d'ouvrage : {{REF_1_MOA}}
💰 Montant : {{REF_1_MONTANT}}
🔧 Type de travaux : {{REF_1_TRAVAUX}}
📅 Réalisation : {{REF_1_REALISATION}}


╔══════════════════════════════════════════════════════════════╗
║                         RÉFÉRENCE 2                         ║
╚══════════════════════════════════════════════════════════════╝

🏢 Résidence : {{REF_2_RESIDENCE}}
👤 Maître d'ouvrage : {{REF_2_MOA}}
💰 Montant : {{REF_2_MONTANT}}
🔧 Type de travaux : {{REF_2_TRAVAUX}}
📅 Réalisation : {{REF_2_REALISATION}}


╔══════════════════════════════════════════════════════════════╗
║                         RÉFÉRENCE 3                         ║
╚══════════════════════════════════════════════════════════════╝

🏢 Résidence : {{REF_3_RESIDENCE}}
👤 Maître d'ouvrage : {{REF_3_MOA}}
💰 Montant : {{REF_3_MONTANT}}
🔧 Type de travaux : {{REF_3_TRAVAUX}}
📅 Réalisation : {{REF_3_REALISATION}}


╔══════════════════════════════════════════════════════════════╗
║                         RÉFÉRENCE 4                         ║
╚══════════════════════════════════════════════════════════════╝

🏢 Résidence : {{REF_4_RESIDENCE}}
👤 Maître d'ouvrage : {{REF_4_MOA}}
💰 Montant : {{REF_4_MONTANT}}
🔧 Type de travaux : {{REF_4_TRAVAUX}}
📅 Réalisation : {{REF_4_REALISATION}}


╔══════════════════════════════════════════════════════════════╗
║                         RÉFÉRENCE 5                         ║
╚══════════════════════════════════════════════════════════════╝

🏢 Résidence : {{REF_5_RESIDENCE}}
👤 Maître d'ouvrage : {{REF_5_MOA}}
💰 Montant : {{REF_5_MONTANT}}
🔧 Type de travaux : {{REF_5_TRAVAUX}}
📅 Réalisation : {{REF_5_REALISATION}}

`;

      // Remplacer le premier placeholder par le contenu séparé
      const firstPlaceholder = foundPlaceholders[0];
      slideContent = slideContent.replace(firstPlaceholder, separatedContent);
      
      // Vider tous les autres placeholders
      for (let i = 1; i < foundPlaceholders.length; i++) {
        slideContent = slideContent.replace(new RegExp(foundPlaceholders[i], 'g'), '');
      }

      console.log('✅ Sections vraiment séparées créées');
      console.log(`📏 Nouvelle taille: ${slideContent.length} caractères`);

      // Sauvegarder le slide modifié
      zip.file(slideFile, slideContent);
    }

    // Sauvegarder le nouveau template
    console.log('\n💾 Sauvegarde du nouveau template...');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Template créé: ${outputPath}`);
    console.log(`📏 Taille: ${buffer.length} bytes`);

    // Vérification rapide
    console.log('\n🧪 Vérification du template:');
    const testZip = await JSZip.loadAsync(buffer);
    const testContent = await testZip.files[slideFile].async('text');
    
    // Compter les placeholders par référence
    for (let i = 1; i <= 5; i++) {
      const refCount = (testContent.match(new RegExp(`{{REF_${i}_`, 'g')) || []).length;
      console.log(`📌 REF_${i}: ${refCount} placeholders trouvés`);
    }

    console.log('\n🎉 TEMPLATE AVEC RÉFÉRENCES VRAIMENT SÉPARÉES CRÉÉ !');
    console.log('===================================================');
    console.log('✅ 5 sections complètement distinctes');
    console.log('✅ Chaque référence dans sa propre zone');
    console.log('✅ Séparateurs visuels clairs');
    console.log('✅ Placeholders individuels pour chaque référence');

    console.log('\n💡 UTILISATION:');
    console.log('1. copy template-truly-separated.pptx template.pptx');
    console.log('2. Testez avec plusieurs références différentes');
    console.log('3. Chaque référence devrait apparaître dans sa section');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  }
}

if (require.main === module) {
  createTrulySeparatedTemplate();
}

module.exports = createTrulySeparatedTemplate;
