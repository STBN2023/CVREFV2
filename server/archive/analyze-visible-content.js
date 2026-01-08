const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function analyzeVisibleContent() {
  try {
    console.log('🔍 ANALYSE DU CONTENU VISIBLE DU TEMPLATE');
    console.log('=========================================\n');

    const templatePath = path.join(__dirname, "template.pptx");
    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    // Analyser tous les fichiers XML du PowerPoint
    const xmlFiles = Object.keys(zip.files).filter(f => f.endsWith('.xml'));
    
    console.log('📄 Fichiers XML trouvés:');
    xmlFiles.forEach(file => console.log(`   - ${file}`));

    // Analyser spécifiquement les slides
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    for (const slideFile of slideFiles) {
      console.log(`\n📄 ANALYSE DE ${slideFile.toUpperCase()}`);
      console.log('=' + '='.repeat(slideFile.length + 12));
      
      const content = await zip.files[slideFile].async('text');
      
      // Extraire tout le texte visible (balises <a:t>)
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
      if (textMatches) {
        console.log('\n📝 TEXTE VISIBLE DANS LE SLIDE:');
        textMatches.forEach((match, index) => {
          const text = match.replace(/<a:t>|<\/a:t>/g, '');
          if (text.trim()) {
            console.log(`   ${index + 1}. "${text}"`);
          }
        });
      }

      // Chercher des patterns spécifiques
      console.log('\n🔍 RECHERCHE DE PATTERNS:');
      
      // Patterns à chercher
      const patterns = [
        { name: 'Placeholders reference_X', regex: /reference_\d+/g },
        { name: 'Placeholders {{REF_X}}', regex: /\{\{REF_[A-Z]+\}\}/g },
        { name: 'Texte "Expériences"', regex: /[Ee]xpériences?/g },
        { name: 'Texte "Références"', regex: /[Rr]éférences?/g },
        { name: 'Texte "Compétences"', regex: /[Cc]ompétences?/g },
        { name: 'Zones de texte vides', regex: /<a:t><\/a:t>/g }
      ];

      patterns.forEach(pattern => {
        const matches = content.match(pattern.regex);
        if (matches) {
          console.log(`   ✅ ${pattern.name}: ${matches.length} occurrence(s)`);
          if (matches.length <= 10) {
            matches.forEach(match => console.log(`      - "${match}"`));
          }
        } else {
          console.log(`   ❌ ${pattern.name}: Non trouvé`);
        }
      });

      // Analyser la structure des zones de texte
      console.log('\n🏗️ STRUCTURE DES ZONES DE TEXTE:');
      const textBoxes = content.match(/<a:p[^>]*>.*?<\/a:p>/gs);
      if (textBoxes) {
        console.log(`   ${textBoxes.length} paragraphes trouvés`);
        
        textBoxes.slice(0, 5).forEach((box, index) => {
          const textContent = box.match(/<a:t>([^<]*)<\/a:t>/g);
          if (textContent) {
            const texts = textContent.map(t => t.replace(/<a:t>|<\/a:t>/g, '')).join(' ');
            if (texts.trim()) {
              console.log(`   ${index + 1}. "${texts.substring(0, 100)}${texts.length > 100 ? '...' : ''}"`);
            }
          }
        });
      }
    }

    // Analyser aussi les layouts et masters
    console.log('\n🎨 ANALYSE DES LAYOUTS ET MASTERS:');
    const layoutFiles = Object.keys(zip.files).filter(f => 
      (f.includes('slideLayout') || f.includes('slideMaster')) && f.endsWith('.xml')
    );

    for (const layoutFile of layoutFiles.slice(0, 3)) {
      console.log(`\n📄 ${layoutFile}:`);
      const content = await zip.files[layoutFile].async('text');
      
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
      if (textMatches) {
        const relevantTexts = textMatches
          .map(match => match.replace(/<a:t>|<\/a:t>/g, ''))
          .filter(text => text.trim() && (
            text.includes('reference') || 
            text.includes('REF_') ||
            text.includes('{{') ||
            text.length > 5
          ));
        
        if (relevantTexts.length > 0) {
          relevantTexts.slice(0, 5).forEach(text => {
            console.log(`   - "${text}"`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

if (require.main === module) {
  analyzeVisibleContent();
}

module.exports = analyzeVisibleContent;
