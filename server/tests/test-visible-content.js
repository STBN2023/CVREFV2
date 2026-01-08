const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function testVisibleContent() {
  try {
    console.log('🔍 TEST DU CONTENU VISIBLE APRÈS REMPLACEMENT');
    console.log('==============================================\n');

    const enrichedFile = path.join(__dirname, 'cv-enrichi-test-app.pptx');
    
    if (!fs.existsSync(enrichedFile)) {
      console.log('❌ Fichier enrichi non trouvé. Exécutez d\'abord test-real-app-data.js');
      return;
    }

    console.log(`📁 Analyse du fichier: ${enrichedFile}`);
    
    // Lire le fichier enrichi
    const data = fs.readFileSync(enrichedFile);
    const zip = await JSZip.loadAsync(data);

    // Analyser le premier slide
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    if (slideFiles.length > 0) {
      const slideFile = slideFiles[0];
      console.log(`📄 Analyse de ${slideFile}...`);
      
      const content = await zip.files[slideFile].async('text');
      
      // Extraire tout le texte visible
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
      
      if (textMatches) {
        console.log('\n📝 TOUT LE TEXTE VISIBLE DANS LE SLIDE:');
        console.log('=====================================');
        
        const visibleTexts = textMatches
          .map(match => match.replace(/<a:t>|<\/a:t>/g, ''))
          .filter(text => text.trim())
          .map((text, index) => ({ index: index + 1, text }));

        visibleTexts.forEach(item => {
          const isReference = item.text.includes('Résidence') || 
                             item.text.includes('Immeuble') || 
                             item.text.includes('Villa') ||
                             item.text.includes('MOA') ||
                             item.text.includes('Montant') ||
                             item.text.includes('Travaux');
          
          const marker = isReference ? '🎯' : '📄';
          console.log(`   ${marker} ${item.index}. "${item.text}"`);
        });

        // Compter les références visibles
        const referenceTexts = visibleTexts.filter(item => 
          item.text.includes('Résidence') || 
          item.text.includes('Immeuble') || 
          item.text.includes('Villa')
        );

        console.log(`\n📊 RÉSUMÉ:`);
        console.log(`- Total de textes visibles: ${visibleTexts.length}`);
        console.log(`- Références visibles: ${referenceTexts.length}`);
        
        if (referenceTexts.length > 0) {
          console.log('\n🎉 SUCCÈS ! Les références sont maintenant VISIBLES dans le PowerPoint !');
          console.log('\n🎯 Références trouvées dans le contenu visible:');
          referenceTexts.forEach((ref, index) => {
            console.log(`   ${index + 1}. ${ref.text}`);
          });
        } else {
          console.log('\n❌ PROBLÈME : Aucune référence visible dans le contenu du slide');
        }

        // Vérifier si "Expériences professionnelles" est visible
        const hasTitle = visibleTexts.some(item => 
          item.text.toLowerCase().includes('expérience') || 
          item.text.toLowerCase().includes('référence')
        );
        
        if (hasTitle) {
          console.log('✅ Titre de section trouvé dans le contenu visible');
        } else {
          console.log('❌ Titre de section non trouvé dans le contenu visible');
        }

      } else {
        console.log('❌ Aucun texte visible trouvé dans le slide');
      }

    } else {
      console.log('❌ Aucun slide trouvé dans le fichier');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  testVisibleContent();
}

module.exports = testVisibleContent;
