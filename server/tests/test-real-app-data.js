const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testRealAppData() {
  try {
    console.log('🎯 TEST AVEC DONNÉES RÉELLES DE L\'APPLICATION');
    console.log('==============================================\n');

    // Données exactement comme dans l'application React
    const realReferences = [
      {
        residence: "Résidence Les Jardins de Provence",
        moa: "SCI Les Jardins SARL",
        montant: 2500000,
        travaux: "Rénovation énergétique complète, isolation thermique par l'extérieur, changement des menuiseries, installation VMC double flux",
        realisation: "2023-2024"
      },
      {
        residence: "Immeuble Le Central - 45 logements",
        moa: "Copropriété Le Central",
        montant: 850000,
        travaux: "Ravalement de façade, réfection de la toiture, mise aux normes électriques, installation d'un ascenseur",
        realisation: "2022-2023"
      },
      {
        residence: "Résidence Villa Marina - Programme neuf",
        moa: "Promoteur Immobilier Marina SA",
        montant: 1200000,
        travaux: "Construction neuve de 25 logements, aménagements extérieurs, VRD, espaces verts",
        realisation: "2021-2022"
      }
    ];

    console.log('📋 DONNÉES DE TEST (format application):');
    realReferences.forEach((ref, index) => {
      console.log(`\n${index + 1}. ${ref.residence}`);
      console.log(`   MOA: ${ref.moa}`);
      console.log(`   Montant: ${ref.montant.toLocaleString()} €`);
      console.log(`   Travaux: ${ref.travaux}`);
      console.log(`   Réalisation: ${ref.realisation}`);
    });

    // Créer FormData comme le fait l'application
    const form = new FormData();
    const templatePath = path.join(__dirname, 'template.pptx');
    form.append('pptx', fs.createReadStream(templatePath));
    form.append('references', JSON.stringify(realReferences));

    console.log('\n📤 Envoi de la requête vers l\'API...');
    
    // Envoyer la requête exactement comme le frontend
    const response = await fetch('http://localhost:4000/api/enrich-cv', {
      method: 'POST',
      body: form
    });

    if (response.ok) {
      console.log('✅ Requête réussie !');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
      
      // Sauvegarder le fichier
      const buffer = await response.buffer();
      const outputPath = path.join(__dirname, 'cv-enrichi-test-app.pptx');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`\n💾 FICHIER CV ENRICHI GÉNÉRÉ:`);
      console.log(`📁 Chemin: ${outputPath}`);
      console.log(`📏 Taille: ${buffer.length} bytes`);
      
      // Vérifier le contenu du fichier généré
      await verifyPlaceholderReplacement(outputPath, realReferences);
      
    } else {
      const error = await response.text();
      console.log('❌ Erreur dans la requête:');
      console.log(`Status: ${response.status}`);
      console.log(`Erreur: ${error}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Fonction pour vérifier que les placeholders ont été remplacés
async function verifyPlaceholderReplacement(filePath, references) {
  try {
    console.log('\n🔍 VÉRIFICATION DES REMPLACEMENTS');
    console.log('=================================');

    const JSZip = require('jszip');
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);

    // Analyser le premier slide
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    if (slideFiles.length > 0) {
      const slideContent = await zip.files[slideFiles[0]].async('text');
      
      console.log('🔍 Vérification des placeholders dans le slide:');
      
      // Vérifier si les placeholders originaux existent encore
      const originalPlaceholders = ['{{REF_RESIDENCE}}', '{{REF_MOA}}', '{{REF_MONTANT}}', '{{REF_TRAVAUX}}', '{{REF_REALISATION}}'];
      const stillPresent = [];
      const replaced = [];
      
      originalPlaceholders.forEach(placeholder => {
        if (slideContent.includes(placeholder)) {
          stillPresent.push(placeholder);
        } else {
          replaced.push(placeholder);
        }
      });

      if (stillPresent.length > 0) {
        console.log('❌ Placeholders NON remplacés:', stillPresent);
      }
      
      if (replaced.length > 0) {
        console.log('✅ Placeholders remplacés:', replaced);
      }

      // Vérifier si le contenu des références est présent
      console.log('\n🔍 Vérification du contenu des références:');
      references.forEach((ref, index) => {
        const refNumber = index + 1;
        const found = slideContent.includes(ref.residence);
        console.log(`${found ? '✅' : '❌'} Référence ${refNumber}: ${ref.residence} ${found ? 'TROUVÉE' : 'NON TROUVÉE'}`);
      });

      // Statistiques
      console.log(`\n📊 STATISTIQUES:`);
      console.log(`- Placeholders remplacés: ${replaced.length}/5`);
      console.log(`- Références trouvées: ${references.filter((ref, i) => slideContent.includes(ref.residence)).length}/${references.length}`);
      
      if (replaced.length === references.length && stillPresent.length === 0) {
        console.log('\n🎉 SUCCÈS TOTAL ! Tous les placeholders ont été correctement remplacés !');
      } else if (replaced.length > 0) {
        console.log('\n⚠️  SUCCÈS PARTIEL : Certains placeholders ont été remplacés.');
      } else {
        console.log('\n❌ ÉCHEC : Aucun placeholder n\'a été remplacé.');
      }

    } else {
      console.log('❌ Aucun slide trouvé dans le fichier');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

if (require.main === module) {
  testRealAppData();
}

module.exports = testRealAppData;
