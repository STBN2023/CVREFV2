const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function createProperTemplate() {
  try {
    console.log('🔧 CRÉATION D\'UN TEMPLATE CORRECT');
    console.log('=================================\n');

    const templatePath = path.join(__dirname, "template.pptx");
    const newTemplatePath = path.join(__dirname, "template-fixed.pptx");

    console.log(`📁 Template original: ${templatePath}`);
    console.log(`📁 Nouveau template: ${newTemplatePath}`);

    // Lire le template original
    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    // Modifier le slide principal
    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    if (slideFiles.length > 0) {
      const slideFile = slideFiles[0]; // Premier slide
      console.log(`🔄 Modification de ${slideFile}...`);
      
      let content = await zip.files[slideFile].async('text');
      
      // Trouver une zone de texte existante et la remplacer par nos placeholders
      // Chercher le pattern d'une zone de texte
      const textBoxPattern = /<a:p[^>]*>.*?<a:t>([^<]*)<\/a:t>.*?<\/a:p>/gs;
      
      // Créer le contenu des références
      const referencesContent = `
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1400" b="1"/>
            <a:t>Expériences professionnelles</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1200"/>
            <a:t>reference_1</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1200"/>
            <a:t>reference_2</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1200"/>
            <a:t>reference_3</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1200"/>
            <a:t>reference_4</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1200"/>
            <a:t>reference_5</a:t>
          </a:r>
        </a:p>
      `;

      // Remplacer le premier "Click to edit Master text styles" par nos références
      content = content.replace(
        /<a:t>Click to edit Master text styles<\/a:t>/,
        `<a:t>Expériences professionnelles</a:t></a:r></a:p>
        <a:p><a:r><a:rPr lang="fr-FR" sz="1000"/><a:t>reference_1</a:t></a:r></a:p>
        <a:p><a:r><a:rPr lang="fr-FR" sz="1000"/><a:t>reference_2</a:t></a:r></a:p>
        <a:p><a:r><a:rPr lang="fr-FR" sz="1000"/><a:t>reference_3</a:t></a:r></a:p>
        <a:p><a:r><a:rPr lang="fr-FR" sz="1000"/><a:t>reference_4</a:t></a:r></a:p>
        <a:p><a:r><a:rPr lang="fr-FR" sz="1000"/><a:t>reference_5</a:t>`
      );

      console.log('✅ Placeholders ajoutés au slide');
      
      // Remettre le contenu modifié
      zip.file(slideFile, content);
    }

    // Sauvegarder le nouveau template
    const newBuffer = await zip.generateAsync({type: 'nodebuffer'});
    fs.writeFileSync(newTemplatePath, newBuffer);

    console.log(`✅ Nouveau template créé: ${newTemplatePath}`);
    console.log(`📏 Taille: ${newBuffer.length} bytes`);

    // Vérifier le nouveau template
    await verifyNewTemplate(newTemplatePath);

    return newTemplatePath;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function verifyNewTemplate(templatePath) {
  try {
    console.log('\n🔍 VÉRIFICATION DU NOUVEAU TEMPLATE');
    console.log('===================================');

    const data = fs.readFileSync(templatePath);
    const zip = await JSZip.loadAsync(data);

    const slideFiles = Object.keys(zip.files).filter(f => 
      f.includes('slide') && f.endsWith('.xml') && !f.includes('_rels')
    );

    if (slideFiles.length > 0) {
      const content = await zip.files[slideFiles[0]].async('text');
      
      // Vérifier les placeholders
      const placeholders = ['reference_1', 'reference_2', 'reference_3', 'reference_4', 'reference_5'];
      const found = [];
      const missing = [];

      placeholders.forEach(placeholder => {
        if (content.includes(placeholder)) {
          found.push(placeholder);
        } else {
          missing.push(placeholder);
        }
      });

      console.log(`✅ Placeholders trouvés: ${found.join(', ')}`);
      if (missing.length > 0) {
        console.log(`❌ Placeholders manquants: ${missing.join(', ')}`);
      }

      // Extraire le texte visible
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
      if (textMatches) {
        console.log('\n📝 Texte visible dans le nouveau template:');
        textMatches.forEach((match, index) => {
          const text = match.replace(/<a:t>|<\/a:t>/g, '');
          if (text.trim() && (text.includes('reference_') || text.includes('Expériences'))) {
            console.log(`   ${index + 1}. "${text}"`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

if (require.main === module) {
  createProperTemplate();
}

module.exports = createProperTemplate;
