const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function testZipReplacement() {
  try {
    console.log('🔬 TEST REMPLACEMENT ZIP');
    console.log('========================\n');

    const templatePath = path.join(__dirname, "template.pptx");
    const outputPath = path.join(__dirname, "test-zip-output.pptx");

    console.log(`📁 Template: ${templatePath}`);
    console.log(`📁 Output: ${outputPath}`);

    // Copier le template
    fs.copyFileSync(templatePath, outputPath);
    console.log('✅ Template copié');

    // Lire comme ZIP
    const data = fs.readFileSync(outputPath);
    const zip = await JSZip.loadAsync(data);
    console.log('✅ ZIP chargé');

    // Trouver les slides
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );
    console.log(`📄 ${slideFiles.length} slides trouvés:`, slideFiles);

    // Test de remplacement simple
    const testData = {
      reference_1: "TEST REMPLACEMENT 1",
      reference_2: "TEST REMPLACEMENT 2"
    };

    for (const slideFile of slideFiles.slice(0, 1)) { // Seulement le premier slide
      console.log(`\n🔍 Traitement de ${slideFile}...`);
      let content = await zip.files[slideFile].async('text');
      
      console.log(`📏 Taille du contenu: ${content.length} caractères`);
      
      // Chercher les placeholders
      const foundPlaceholders = [];
      for (const key of Object.keys(testData)) {
        if (content.includes(key)) {
          foundPlaceholders.push(key);
        }
      }
      console.log(`🔍 Placeholders trouvés: ${foundPlaceholders.join(', ')}`);

      // Faire les remplacements
      for (const [key, value] of Object.entries(testData)) {
        if (content.includes(key)) {
          console.log(`🔄 Remplacement de "${key}" par "${value}"`);
          content = content.replace(new RegExp(key, 'g'), value);
        }
      }

      // Remettre le contenu
      zip.file(slideFile, content);
      console.log('✅ Contenu mis à jour');
    }

    // Générer le fichier final
    console.log('\n💾 Génération du fichier final...');
    const finalBuffer = await zip.generateAsync({type: 'nodebuffer'});
    fs.writeFileSync(outputPath, finalBuffer);

    console.log(`✅ Fichier généré: ${outputPath}`);
    console.log(`📏 Taille: ${finalBuffer.length} bytes`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testZipReplacement();
}

module.exports = testZipReplacement;
