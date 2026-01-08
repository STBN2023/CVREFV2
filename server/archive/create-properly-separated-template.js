const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function createProperlySeparatedTemplate() {
  try {
    console.log('🔧 CRÉATION DU TEMPLATE AVEC RÉFÉRENCES VRAIMENT SÉPARÉES');
    console.log('========================================================\n');

    const templatePath = path.join(__dirname, 'template-backup.pptx');
    const outputPath = path.join(__dirname, 'template-separated-refs.pptx');

    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template de sauvegarde non trouvé:', templatePath);
      return;
    }

    console.log('📁 Lecture du template de sauvegarde...');
    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    // Trouver les slides
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels') && !f.includes('Layout') && !f.includes('Master')
    );

    console.log(`📊 ${slideFiles.length} slide(s) trouvé(s)`);

    for (const slideFile of slideFiles) {
      console.log(`\n🔍 Traitement du slide: ${slideFile}`);
      
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

      // Créer le contenu avec références vraiment séparées
      if (foundPlaceholders.length > 0) {
        console.log('\n🔄 Création des sections séparées...');
        
        // Créer le contenu pour les références individuelles avec séparation claire
        let separatedRefsContent = `

═══════════════════════════════════════
            RÉFÉRENCE 1
═══════════════════════════════════════

Résidence : {{REF_1_RESIDENCE}}
Maître d'ouvrage : {{REF_1_MOA}}
Montant : {{REF_1_MONTANT}}
Type de travaux : {{REF_1_TRAVAUX}}
Réalisation : {{REF_1_REALISATION}}


═══════════════════════════════════════
            RÉFÉRENCE 2
═══════════════════════════════════════

Résidence : {{REF_2_RESIDENCE}}
Maître d'ouvrage : {{REF_2_MOA}}
Montant : {{REF_2_MONTANT}}
Type de travaux : {{REF_2_TRAVAUX}}
Réalisation : {{REF_2_REALISATION}}


═══════════════════════════════════════
            RÉFÉRENCE 3
═══════════════════════════════════════

Résidence : {{REF_3_RESIDENCE}}
Maître d'ouvrage : {{REF_3_MOA}}
Montant : {{REF_3_MONTANT}}
Type de travaux : {{REF_3_TRAVAUX}}
Réalisation : {{REF_3_REALISATION}}


═══════════════════════════════════════
            RÉFÉRENCE 4
═══════════════════════════════════════

Résidence : {{REF_4_RESIDENCE}}
Maître d'ouvrage : {{REF_4_MOA}}
Montant : {{REF_4_MONTANT}}
Type de travaux : {{REF_4_TRAVAUX}}
Réalisation : {{REF_4_REALISATION}}


═══════════════════════════════════════
            RÉFÉRENCE 5
═══════════════════════════════════════

Résidence : {{REF_5_RESIDENCE}}
Maître d'ouvrage : {{REF_5_MOA}}
Montant : {{REF_5_MONTANT}}
Type de travaux : {{REF_5_TRAVAUX}}
Réalisation : {{REF_5_REALISATION}}

`;

        // Remplacer le premier placeholder par le contenu des références séparées
        const firstPlaceholder = foundPlaceholders[0];
        slideContent = slideContent.replace(firstPlaceholder, separatedRefsContent);
        
        // Vider les autres placeholders pour éviter la duplication
        for (let i = 1; i < foundPlaceholders.length; i++) {
          slideContent = slideContent.replace(foundPlaceholders[i], '');
        }

        console.log('✅ Sections séparées créées');
        console.log(`📏 Nouvelle taille: ${slideContent.length} caractères`);

        // Sauvegarder le slide modifié
        zip.file(slideFile, slideContent);
      }
    }

    // Sauvegarder le nouveau template
    console.log('\n💾 Sauvegarde du nouveau template...');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buffer);

    console.log(`✅ Nouveau template créé: ${outputPath}`);
    console.log(`📏 Taille: ${buffer.length} bytes`);

    // Test rapide du nouveau template
    console.log('\n🧪 Vérification du nouveau template...');
    const testZip = await JSZip.loadAsync(buffer);
    const testSlideFiles = Object.keys(testZip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels') && !f.includes('Layout') && !f.includes('Master')
    );

    for (const slideFile of testSlideFiles) {
      const content = await testZip.files[slideFile].async('text');
      
      console.log(`\n📊 Vérification du slide ${slideFile}:`);
      
      // Compter les placeholders par référence
      for (let i = 1; i <= 5; i++) {
        let refCount = 0;
        const refPlaceholders = [
          `{{REF_${i}_RESIDENCE}}`,
          `{{REF_${i}_MOA}}`,
          `{{REF_${i}_MONTANT}}`,
          `{{REF_${i}_TRAVAUX}}`,
          `{{REF_${i}_REALISATION}}`
        ];
        
        refPlaceholders.forEach(placeholder => {
          if (content.includes(placeholder)) {
            refCount++;
          }
        });
        
        console.log(`   📌 Référence ${i}: ${refCount}/5 placeholders trouvés`);
      }
      
      // Vérifier la séparation
      const ref1Count = (content.match(/RÉFÉRENCE 1/g) || []).length;
      const ref2Count = (content.match(/RÉFÉRENCE 2/g) || []).length;
      const ref3Count = (content.match(/RÉFÉRENCE 3/g) || []).length;
      
      console.log(`   🔍 Sections trouvées: REF1=${ref1Count}, REF2=${ref2Count}, REF3=${ref3Count}`);
    }

    console.log('\n🎉 TEMPLATE AVEC RÉFÉRENCES VRAIMENT SÉPARÉES CRÉÉ !');
    console.log('===================================================');
    console.log('✅ 5 sections distinctes créées');
    console.log('✅ Chaque référence a sa propre zone');
    console.log('✅ Séparateurs visuels ajoutés');
    console.log('\n💡 Pour utiliser ce template:');
    console.log('1. Remplacez template.pptx par template-separated-refs.pptx');
    console.log('2. Testez avec le script de test des références individuelles');

  } catch (error) {
    console.error('❌ Erreur lors de la création du template:', error);
  }
}

if (require.main === module) {
  createProperlySeparatedTemplate();
}

module.exports = createProperlySeparatedTemplate;
