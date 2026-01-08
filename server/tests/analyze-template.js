const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function analyzeTemplate() {
  try {
    console.log('🔍 Analyse du template PowerPoint...');
    
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
    console.log('📁 Fichiers dans le template:', Object.keys(content.files).length);
    
    // Chercher les fichiers de slides
    const slideFiles = Object.keys(content.files).filter(fileName => 
      fileName.includes('slide') && fileName.endsWith('.xml')
    );
    
    console.log('📋 Fichiers de slides trouvés:', slideFiles.length);
    
    // Analyser chaque slide
    for (const fileName of slideFiles) {
      console.log(`\n📄 Analyse de ${fileName}`);
      const file = content.files[fileName];
      if (!file.dir) {
        let xmlContent = await file.async('string');
        
        // Chercher les shapes nommées
        const shapePattern = /<p:cNvPr[^>]*name="([^"]*)"/g;
        let match;
        const shapes = [];
        while ((match = shapePattern.exec(xmlContent)) !== null) {
          shapes.push(match[1]);
        }
        
        console.log(`   🎯 Shapes trouvées:`, shapes.filter(s => s.includes('reference')));
        
        // Chercher les placeholders
        const placeholderPattern = /\{\{REF_[A-Z_]*\}\}/g;
        const placeholders = xmlContent.match(placeholderPattern) || [];
        
        if (placeholders.length > 0) {
          console.log(`   🔤 Placeholders trouvés:`, [...new Set(placeholders)]);
          
          // Afficher un extrait du contenu pour chaque référence
          for (let i = 1; i <= 5; i++) {
            const shapeName = `reference_${i}`;
            const shapePattern = new RegExp(`(<p:sp[\\s\\S]*?<p:cNvPr[^>]*name="${shapeName}"[\\s\\S]*?</p:sp>)`, 'g');
            const shapeMatch = shapePattern.exec(xmlContent);
            
            if (shapeMatch) {
              console.log(`   📦 Contenu de ${shapeName}:`);
              const contentExcerpt = shapeMatch[1].substring(0, 300) + (shapeMatch[1].length > 300 ? '...' : '');
              console.log(`      ${contentExcerpt}`);
            }
          }
        }
      }
    }
    
    console.log('\n✅ Analyse terminée');
  } catch (error) {
    console.error('💥 Erreur lors de l\'analyse:', error.message);
    console.error(error.stack);
  }
}

analyzeTemplate();
