const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function createIndividualRefTemplate() {
  try {
    console.log('🔧 CRÉATION DU TEMPLATE AVEC RÉFÉRENCES INDIVIDUELLES');
    console.log('====================================================\n');

    const templatePath = path.join(__dirname, 'template.pptx');
    const outputPath = path.join(__dirname, 'template-individual-refs.pptx');

    if (!fs.existsSync(templatePath)) {
      console.log('❌ Template original non trouvé:', templatePath);
      return;
    }

    console.log('📁 Lecture du template original...');
    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    // Trouver les slides
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
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

      // Ajouter des sections pour 5 références individuelles
      if (foundPlaceholders.length > 0) {
        console.log('\n🔄 Ajout des placeholders individuels...');
        
        // Créer le contenu pour les références individuelles
        let individualRefsContent = '';
        
        for (let i = 1; i <= 5; i++) {
          individualRefsContent += `

RÉFÉRENCE ${i}:
{{REF_${i}_RESIDENCE}}
Maître d'ouvrage: {{REF_${i}_MOA}}
Montant: {{REF_${i}_MONTANT}}
Type de travaux: {{REF_${i}_TRAVAUX}}
Réalisation: {{REF_${i}_REALISATION}}

--- OU FORMAT COMPLET ---
{{REF_${i}}}

`;
        }

        // Remplacer le premier placeholder par le contenu des références individuelles
        const firstPlaceholder = foundPlaceholders[0];
        slideContent = slideContent.replace(firstPlaceholder, individualRefsContent);
        
        // Vider les autres placeholders pour éviter la duplication
        for (let i = 1; i < foundPlaceholders.length; i++) {
          slideContent = slideContent.replace(foundPlaceholders[i], '');
        }

        console.log('✅ Placeholders individuels ajoutés');
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
    console.log('\n🧪 Test rapide du nouveau template...');
    const testZip = await JSZip.loadAsync(buffer);
    const testSlideFiles = Object.keys(testZip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    for (const slideFile of testSlideFiles) {
      const content = await testZip.files[slideFile].async('text');
      
      // Compter les nouveaux placeholders
      let individualPlaceholderCount = 0;
      for (let i = 1; i <= 5; i++) {
        if (content.includes(`{{REF_${i}_RESIDENCE}}`)) individualPlaceholderCount++;
        if (content.includes(`{{REF_${i}}}`)) individualPlaceholderCount++;
      }
      
      console.log(`📊 Slide ${slideFile}: ${individualPlaceholderCount} placeholders individuels trouvés`);
    }

    console.log('\n🎉 TEMPLATE AVEC RÉFÉRENCES INDIVIDUELLES CRÉÉ !');
    console.log('================================================');
    console.log('✅ Placeholders individuels ajoutés');
    console.log('✅ Format: {{REF_1_RESIDENCE}}, {{REF_1_MOA}}, etc.');
    console.log('✅ Format complet: {{REF_1}}, {{REF_2}}, etc.');
    console.log('✅ Support jusqu\'à 5 références séparées');
    console.log('\n💡 Pour utiliser ce template:');
    console.log('1. Remplacez template.pptx par template-individual-refs.pptx');
    console.log('2. Ou renommez template-individual-refs.pptx en template.pptx');

  } catch (error) {
    console.error('❌ Erreur lors de la création du template:', error);
  }
}

if (require.main === module) {
  createIndividualRefTemplate();
}

module.exports = createIndividualRefTemplate;
