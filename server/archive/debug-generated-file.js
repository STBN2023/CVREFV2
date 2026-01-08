const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function debugGeneratedFile() {
  try {
    console.log('🔍 DEBUG DU FICHIER GÉNÉRÉ');
    console.log('===========================\n');

    const filePath = path.join(__dirname, 'cv-separated-test.pptx');
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Fichier généré non trouvé');
      return;
    }

    console.log('📁 Lecture du fichier généré...');
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);

    // Analyser le slide principal
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide1.xml')
    );

    if (slideFiles.length > 0) {
      const slideContent = await zip.files[slideFiles[0]].async('text');
      
      console.log('📄 CONTENU DU SLIDE:');
      console.log(`📏 Taille: ${slideContent.length} caractères\n`);
      
      // Chercher les placeholders restants
      console.log('🔍 PLACEHOLDERS RESTANTS:');
      
      const placeholdersToCheck = [];
      for (let i = 1; i <= 5; i++) {
        placeholdersToCheck.push(`{{REF_${i}_RESIDENCE}}`);
        placeholdersToCheck.push(`{{REF_${i}_MOA}}`);
        placeholdersToCheck.push(`{{REF_${i}_MONTANT}}`);
        placeholdersToCheck.push(`{{REF_${i}_TRAVAUX}}`);
        placeholdersToCheck.push(`{{REF_${i}_REALISATION}}`);
      }
      
      let foundPlaceholders = [];
      placeholdersToCheck.forEach(placeholder => {
        if (slideContent.includes(placeholder)) {
          foundPlaceholders.push(placeholder);
        }
      });
      
      if (foundPlaceholders.length > 0) {
        console.log('⚠️  Placeholders non remplacés:');
        foundPlaceholders.forEach(p => console.log(`   - ${p}`));
      } else {
        console.log('✅ Tous les placeholders ont été remplacés');
      }
      
      // Chercher les valeurs de test
      console.log('\n🔍 RECHERCHE DES VALEURS DE TEST:');
      
      const testValues = [
        'Villa Alpha',
        'Immeuble Beta', 
        'Maison Gamma',
        'Client Alpha',
        'Client Beta',
        'Client Gamma',
        '1 000 000',
        '2 000 000',
        '500 000'
      ];
      
      testValues.forEach(value => {
        const found = slideContent.includes(value);
        console.log(`   ${value}: ${found ? '✅ TROUVÉ' : '❌ ABSENT'}`);
      });
      
      // Extraire un échantillon du contenu
      console.log('\n📝 ÉCHANTILLON DU CONTENU (premiers 1000 caractères):');
      console.log('─'.repeat(60));
      
      // Nettoyer le XML pour l'affichage
      const cleanContent = slideContent
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 1000);
      
      console.log(cleanContent);
      console.log('─'.repeat(60));
      
      // Chercher les sections de références
      console.log('\n🎯 RECHERCHE DES SECTIONS:');
      
      const sectionPatterns = [
        'RÉFÉRENCE 1',
        'RÉFÉRENCE 2',
        'RÉFÉRENCE 3',
        'RÉFÉRENCE 4',
        'RÉFÉRENCE 5'
      ];
      
      sectionPatterns.forEach(pattern => {
        const found = slideContent.includes(pattern);
        console.log(`   ${pattern}: ${found ? '✅ TROUVÉ' : '❌ ABSENT'}`);
      });
      
    } else {
      console.log('❌ Aucun slide principal trouvé');
    }

    console.log('\n💡 DIAGNOSTIC:');
    console.log('==============');
    console.log('Si les placeholders ne sont pas remplacés:');
    console.log('1. Vérifiez que le backend utilise la bonne logique');
    console.log('2. Vérifiez que les placeholders dans le template sont corrects');
    console.log('3. Vérifiez que les données sont bien envoyées à l\'API');

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

if (require.main === module) {
  debugGeneratedFile();
}

module.exports = debugGeneratedFile;
