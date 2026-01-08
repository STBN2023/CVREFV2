const Automizer = require("pptx-automizer").default;
const path = require("path");

async function testSimpleAutomizer() {
  try {
    console.log('🔬 TEST SIMPLE AUTOMIZER v0.7.2');
    console.log('================================\n');

    const templatePath = path.join(__dirname, "template.pptx");
    console.log(`📁 Template: ${templatePath}`);

    // Créer une instance d'Automizer
    const automizer = new Automizer({
      templateDir: __dirname,
      outputDir: __dirname
    });

    console.log('🔍 Méthodes disponibles:');
    console.log('- loadRoot:', typeof automizer.loadRoot);
    console.log('- load:', typeof automizer.load);
    console.log('- loadTemplate:', typeof automizer.loadTemplate);
    console.log('- template:', typeof automizer.template);
    console.log('- write:', typeof automizer.write);

    // Essayons la méthode la plus basique
    console.log('\n📖 Chargement du template...');
    const pptx = automizer.loadRoot(templatePath);
    
    console.log('🔍 Méthodes disponibles sur pptx:');
    console.log('- template:', typeof pptx.template);
    console.log('- write:', typeof pptx.write);
    console.log('- setText:', typeof pptx.setText);
    console.log('- addText:', typeof pptx.addText);

    // Test avec des données simples
    const testData = {
      reference_1: "SIMPLE TEST - RÉFÉRENCE 1",
      reference_2: "SIMPLE TEST - RÉFÉRENCE 2"
    };

    console.log('\n💾 Test de génération basique...');
    
    // Si template() existe, l'utiliser
    if (typeof pptx.template === 'function') {
      console.log('Utilisation de template()...');
      pptx.template(testData);
    } else if (typeof pptx.setText === 'function') {
      console.log('Utilisation de setText()...');
      for (const [key, value] of Object.entries(testData)) {
        try {
          pptx.setText(key, value);
          console.log(`✅ ${key} défini`);
        } catch (error) {
          console.log(`❌ ${key} échoué:`, error.message);
        }
      }
    }

    // Générer le fichier
    console.log('Génération du fichier...');
    const result = await pptx.write('test-simple-output.pptx');
    console.log('✅ Fichier généré:', result);

    console.log('\n🎯 Test terminé !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testSimpleAutomizer();
}

module.exports = testSimpleAutomizer;
