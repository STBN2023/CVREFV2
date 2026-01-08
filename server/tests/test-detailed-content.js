const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function testDetailedContent() {
  try {
    console.log('🔍 TEST DÉTAILLÉ DU CONTENU APRÈS REMPLACEMENT');
    console.log('==============================================\n');

    const enrichedFile = path.join(__dirname, 'cv-integration-test.pptx');
    
    if (!fs.existsSync(enrichedFile)) {
      console.log('❌ Fichier enrichi non trouvé. Exécutez d\'abord test-full-integration.js');
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
        const visibleTexts = textMatches
          .map(match => match.replace(/<a:t>|<\/a:t>/g, ''))
          .filter(text => text.trim());

        console.log('\n📝 RECHERCHE DES RÉFÉRENCES DANS LE CONTENU:');
        console.log('===========================================');
        
        // Chercher les références spécifiques
        const references = [
          'Résidence Les Jardins de Provence',
          'Immeuble Le Central - 45 logements', 
          'Résidence Villa Marina - Programme neuf'
        ];
        
        const foundReferences = new Set();
        
        visibleTexts.forEach((text, index) => {
          references.forEach(ref => {
            if (text.includes(ref)) {
              foundReferences.add(ref);
              console.log(`✅ Trouvé "${ref}" dans le texte ${index + 1}: "${text}"`);
            }
          });
          
          // Chercher aussi les MOA
          if (text.includes('SCI Les Jardins SARL')) {
            console.log(`💼 MOA trouvé dans le texte ${index + 1}: "${text}"`);
          }
          if (text.includes('Copropriété Le Central')) {
            console.log(`💼 MOA trouvé dans le texte ${index + 1}: "${text}"`);
          }
          if (text.includes('Promoteur Immobilier Marina SA')) {
            console.log(`💼 MOA trouvé dans le texte ${index + 1}: "${text}"`);
          }
          
          // Chercher les montants
          if (text.includes('2 500 000')) {
            console.log(`💰 Montant trouvé dans le texte ${index + 1}: "${text}"`);
          }
          if (text.includes('850 000')) {
            console.log(`💰 Montant trouvé dans le texte ${index + 1}: "${text}"`);
          }
          if (text.includes('1 200 000')) {
            console.log(`💰 Montant trouvé dans le texte ${index + 1}: "${text}"`);
          }
        });

        console.log(`\n📊 RÉSUMÉ:`);
        console.log(`- Références uniques trouvées: ${foundReferences.size}/3`);
        console.log(`- Références trouvées: ${Array.from(foundReferences).join(', ')}`);
        
        // Chercher les textes les plus longs (qui pourraient contenir plusieurs références)
        console.log('\n📄 TEXTES LES PLUS LONGS (possibles multi-références):');
        console.log('====================================================');
        
        const longTexts = visibleTexts
          .filter(text => text.length > 50)
          .sort((a, b) => b.length - a.length)
          .slice(0, 5);
          
        longTexts.forEach((text, index) => {
          console.log(`${index + 1}. (${text.length} chars) "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
        });

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
  testDetailedContent();
}

module.exports = testDetailedContent;
