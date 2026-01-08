const Automizer = require("pptx-automizer").default;
const path = require("path");

async function debugTemplate() {
  try {
    console.log('🔍 DEBUG DU TEMPLATE POWERPOINT');
    console.log('================================\n');

    const templatePath = path.join(__dirname, "template.pptx");
    console.log(`📁 Template: ${templatePath}`);

    // Initialiser Automizer
    const automizer = new Automizer({
      templateDir: __dirname,
      outputDir: __dirname
    });

    console.log('📖 Chargement du template...');
    await automizer.loadRoot(templatePath);

    // Essayer de lister les placeholders disponibles
    console.log('\n🔍 Recherche des placeholders...');
    
    // Test avec différents noms de placeholders
    const placeholdersToTest = [
      'reference_1',
      'reference_2', 
      'reference_3',
      'reference_4',
      'reference_5',
      '{reference_1}',
      '{{reference_1}}',
      'REF_1',
      'REFERENCE_1'
    ];

    for (const placeholder of placeholdersToTest) {
      try {
        await automizer.setText(placeholder, `TEST_${placeholder}`);
        console.log(`✅ Placeholder trouvé: ${placeholder}`);
      } catch (error) {
        console.log(`❌ Placeholder non trouvé: ${placeholder}`);
        // console.log(`   Erreur: ${error.message}`);
      }
    }

    // Essayer de générer un fichier de test
    console.log('\n💾 Génération d\'un fichier de test...');
    try {
      const result = await automizer.write('debug-template-output.pptx');
      console.log('✅ Fichier de debug généré: debug-template-output.pptx');
      console.log('📊 Résultat:', result);
    } catch (error) {
      console.log('❌ Erreur lors de la génération:', error.message);
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Fonction pour vérifier la structure du template
async function analyzeTemplate() {
  try {
    console.log('\n🔬 ANALYSE DE LA STRUCTURE DU TEMPLATE');
    console.log('======================================');

    const JSZip = require('jszip');
    const fs = require('fs');
    
    const templatePath = path.join(__dirname, "template.pptx");
    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    console.log('📄 Fichiers dans le template:');
    Object.keys(zip.files).forEach(filename => {
      if (filename.includes('slide') && filename.endsWith('.xml')) {
        console.log(`   - ${filename}`);
      }
    });

    // Analyser le contenu des slides
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    for (const slideFile of slideFiles.slice(0, 3)) { // Limiter à 3 slides
      console.log(`\n📄 Contenu de ${slideFile}:`);
      try {
        const content = await zip.files[slideFile].async('text');
        
        // Chercher des patterns de placeholder
        const patterns = [
          /reference_\d+/g,
          /\{reference_\d+\}/g,
          /\{\{reference_\d+\}\}/g,
          /REF_\d+/g,
          /<a:t>([^<]*reference[^<]*)<\/a:t>/g
        ];

        patterns.forEach((pattern, index) => {
          const matches = content.match(pattern);
          if (matches) {
            console.log(`   Pattern ${index + 1} trouvé:`, matches);
          }
        });

        // Chercher tout texte contenant "reference"
        const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
        if (textMatches) {
          const referenceTexts = textMatches.filter(t => 
            t.toLowerCase().includes('reference') || 
            t.toLowerCase().includes('ref_')
          );
          if (referenceTexts.length > 0) {
            console.log('   Textes contenant "reference":', referenceTexts);
          }
        }

      } catch (error) {
        console.log(`   ❌ Erreur lecture ${slideFile}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erreur analyse template:', error.message);
  }
}

if (require.main === module) {
  debugTemplate()
    .then(() => analyzeTemplate())
    .then(() => console.log('\n🎯 Debug terminé !'));
}

module.exports = { debugTemplate, analyzeTemplate };
