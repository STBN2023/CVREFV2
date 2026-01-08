const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

async function testDocxTemplater() {
  try {
    console.log('🔬 TEST DOCXTEMPLATER POUR POWERPOINT');
    console.log('=====================================\n');

    const templatePath = path.join(__dirname, "template.pptx");
    console.log(`📁 Template: ${templatePath}`);

    // Lire le fichier template
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // Créer l'instance docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Données de test
    const data = {
      reference_1: "DOCXTEMPLATER TEST - RÉFÉRENCE 1\nMaître d'ouvrage: Test MOA 1\nMontant: 500 000 €\nTravaux: Test travaux 1\nRéalisation: 2023",
      reference_2: "DOCXTEMPLATER TEST - RÉFÉRENCE 2\nMaître d'ouvrage: Test MOA 2\nMontant: 750 000 €\nTravaux: Test travaux 2\nRéalisation: 2024",
      reference_3: "DOCXTEMPLATER TEST - RÉFÉRENCE 3\nMaître d'ouvrage: Test MOA 3\nMontant: 1 000 000 €\nTravaux: Test travaux 3\nRéalisation: 2025",
      reference_4: "",
      reference_5: ""
    };

    console.log('📝 Données à injecter:', data);

    // Rendre le document avec les données
    doc.render(data);

    // Générer le fichier de sortie
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const outputPath = path.join(__dirname, 'test-docxtemplater-output.pptx');
    fs.writeFileSync(outputPath, buf);

    console.log(`✅ Fichier généré avec succès: ${outputPath}`);
    console.log(`📏 Taille: ${buf.length} bytes`);

    return outputPath;

  } catch (error) {
    console.error('❌ Erreur DocxTemplater:', error.message);
    if (error.properties && error.properties.errors) {
      console.error('Détails des erreurs:', error.properties.errors);
    }
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testDocxTemplater();
}

module.exports = testDocxTemplater;
