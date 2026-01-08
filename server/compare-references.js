const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function compareReferences() {
  try {
    console.log('🔍 Comparaison des références...');
    
    // Charger le template
    const templatePath = path.join(__dirname, 'template.pptx');
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Template non trouvé:', templatePath);
      return;
    }
    
    const fileBuffer = fs.readFileSync(templatePath);
    const zip = new JSZip();
    const content = await zip.loadAsync(fileBuffer);
    
    console.log('✅ Template chargé avec succès');
    
    // Chercher le fichier slide1.xml
    const slideFile = content.files['ppt/slides/slide1.xml'];
    if (!slideFile) {
      console.error('❌ slide1.xml non trouvé');
      return;
    }
    
    let xmlContent = await slideFile.async('string');
    console.log('📄 Contenu de slide1.xml chargé');
    
    // Analyser chaque référence
    for (let i = 1; i <= 5; i++) {
      const shapeName = `reference_${i}`;
      const shapePattern = new RegExp(`(<p:sp[\\s\\S]*?<p:cNvPr[^>]*name="${shapeName}"[\\s\\S]*?</p:sp>)`, 'g');
      const shapeMatch = shapePattern.exec(xmlContent);
      
      console.log(`\n--- ${shapeName} ---`);
      
      if (shapeMatch) {
        const shapeContent = shapeMatch[1];
        
        // Chercher les placeholders dans cette shape
        const placeholderPattern = /\{\{REF_[A-Z_]*\}\}/g;
        const placeholders = shapeContent.match(placeholderPattern) || [];
        
        console.log(`Placeholders trouvés:`, [...new Set(placeholders)]);
        console.log(`Nombre total de placeholders:`, placeholders.length);
      } else {
        console.log(`❌ Shape non trouvée`);
      }
    }
    
    console.log('\n✅ Comparaison terminée');
  } catch (error) {
    console.error('💥 Erreur lors de la comparaison:', error.message);
    console.error(error.stack);
  }
}

compareReferences();
