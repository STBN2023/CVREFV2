const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function analyzeReference2() {
  try {
    console.log('🔍 Analyse spécifique de reference_2...');
    
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
    
    // Chercher le fichier slide1.xml (le plus probablement celui qui contient les références)
    const slideFile = content.files['ppt/slides/slide1.xml'];
    if (!slideFile) {
      console.error('❌ slide1.xml non trouvé');
      return;
    }
    
    let xmlContent = await slideFile.async('string');
    console.log('📄 Contenu de slide1.xml chargé, taille:', xmlContent.length, 'caractères');
    
    // Chercher spécifiquement reference_2
    const shapeName = 'reference_2';
    const shapePattern = new RegExp(`(<p:sp[\\s\\S]*?<p:cNvPr[^>]*name="${shapeName}"[\\s\\S]*?</p:sp>)`, 'g');
    const shapeMatch = shapePattern.exec(xmlContent);
    
    if (shapeMatch) {
      console.log(`✅ Shape ${shapeName} trouvée`);
      const shapeContent = shapeMatch[1];
      console.log(`📏 Taille de la shape:`, shapeContent.length, 'caractères');
      
      // Afficher le contenu complet de la shape
      console.log(`📦 Contenu complet de ${shapeName}:`);
      console.log(shapeContent);
      
      // Chercher les placeholders dans cette shape
      const placeholderPattern = /\{\{REF_[A-Z_]*\}\}/g;
      const placeholders = shapeContent.match(placeholderPattern) || [];
      
      if (placeholders.length > 0) {
        console.log(`🔤 Placeholders trouvés dans ${shapeName}:`, placeholders);
      } else {
        console.log(`✅ Aucun placeholder trouvé dans ${shapeName}`);
      }
    } else {
      console.log(`❌ Shape ${shapeName} non trouvée`);
      
      // Chercher toutes les shapes dans le fichier
      const allShapesPattern = /<p:cNvPr[^>]*name="([^"]*)"/g;
      let match;
      const foundShapes = [];
      while ((match = allShapesPattern.exec(xmlContent)) !== null) {
        foundShapes.push(match[1]);
      }
      console.log(`🎯 Toutes les shapes trouvées:`, foundShapes.filter(s => s.includes('reference')));
    }
    
    console.log('\n✅ Analyse terminée');
  } catch (error) {
    console.error('💥 Erreur lors de l\'analyse:', error.message);
    console.error(error.stack);
  }
}

analyzeReference2();
