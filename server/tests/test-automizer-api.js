const Automizer = require("pptx-automizer").default;
const path = require("path");

async function testAutomizerAPI() {
  try {
    console.log('🧪 TEST DES DIFFÉRENTES MÉTHODES AUTOMIZER');
    console.log('==========================================\n');

    const templatePath = path.join(__dirname, "template.pptx");
    console.log(`📁 Template: ${templatePath}`);

    // Test 1: Méthode basique
    console.log('\n🔬 Test 1: Méthode basique');
    try {
      const automizer = new Automizer({
        templateDir: __dirname,
        outputDir: __dirname
      });

      console.log('Chargement du template...');
      const pptx = automizer.loadRoot(templatePath);
      console.log('✅ Template chargé');

      // Test avec des données simples
      const testData = {
        reference_1: "TEST REFERENCE 1 - SUCCÈS !",
        reference_2: "TEST REFERENCE 2 - SUCCÈS !",
        reference_3: "TEST REFERENCE 3 - SUCCÈS !"
      };

      console.log('Application des données:', testData);
      pptx.template(testData);
      console.log('✅ Données appliquées');

      console.log('Génération du fichier...');
      const result = await pptx.write('test-api-method1.pptx');
      console.log('✅ Fichier généré:', result);

    } catch (error) {
      console.log('❌ Méthode 1 échouée:', error.message);
    }

    // Test 2: Méthode avec loadTemplate
    console.log('\n🔬 Test 2: Méthode avec loadTemplate');
    try {
      const automizer = new Automizer({
        templateDir: __dirname,
        outputDir: __dirname
      });

      const testData = {
        reference_1: "MÉTHODE 2 - RÉFÉRENCE 1",
        reference_2: "MÉTHODE 2 - RÉFÉRENCE 2"
      };

      console.log('Utilisation de loadTemplate...');
      const result = await automizer
        .loadTemplate(templatePath)
        .template(testData)
        .write('test-api-method2.pptx');

      console.log('✅ Méthode 2 réussie:', result);

    } catch (error) {
      console.log('❌ Méthode 2 échouée:', error.message);
    }

    // Test 3: Méthode avec load
    console.log('\n🔬 Test 3: Méthode avec load');
    try {
      const automizer = new Automizer({
        templateDir: __dirname,
        outputDir: __dirname
      });

      const testData = {
        reference_1: "MÉTHODE 3 - RÉFÉRENCE 1",
        reference_2: "MÉTHODE 3 - RÉFÉRENCE 2"
      };

      console.log('Utilisation de load...');
      const result = await automizer
        .load(templatePath)
        .template(testData)
        .write('test-api-method3.pptx');

      console.log('✅ Méthode 3 réussie:', result);

    } catch (error) {
      console.log('❌ Méthode 3 échouée:', error.message);
    }

    // Test 4: Méthode synchrone
    console.log('\n🔬 Test 4: Méthode synchrone');
    try {
      const automizer = new Automizer({
        templateDir: __dirname,
        outputDir: __dirname
      });

      const testData = {
        reference_1: "MÉTHODE 4 - RÉFÉRENCE 1",
        reference_2: "MÉTHODE 4 - RÉFÉRENCE 2"
      };

      console.log('Chargement synchrone...');
      automizer.loadRoot(templatePath);
      automizer.template(testData);
      const result = automizer.write('test-api-method4.pptx');

      console.log('✅ Méthode 4 réussie:', result);

    } catch (error) {
      console.log('❌ Méthode 4 échouée:', error.message);
    }

    console.log('\n🎯 Tests terminés ! Vérifiez les fichiers générés.');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testAutomizerAPI();
}

module.exports = testAutomizerAPI;
