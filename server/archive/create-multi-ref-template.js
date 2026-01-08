const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function createMultiRefTemplate() {
  try {
    console.log('🔧 CRÉATION D\'UN TEMPLATE MULTI-RÉFÉRENCES');
    console.log('==========================================\n');

    const templatePath = path.join(__dirname, "template.pptx");
    const newTemplatePath = path.join(__dirname, "template-multi-ref.pptx");

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
      
      // Remplacer les placeholders génériques par des placeholders spécifiques
      // pour 3 références maximum
      const multiRefContent = `
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1400" b="1"/>
            <a:t>Expériences professionnelles</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1200" b="1"/>
            <a:t>{{REF_1_RESIDENCE}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Maître d'ouvrage: {{REF_1_MOA}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Montant: {{REF_1_MONTANT}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Travaux: {{REF_1_TRAVAUX}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Réalisation: {{REF_1_REALISATION}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="800"/>
            <a:t> </a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1200" b="1"/>
            <a:t>{{REF_2_RESIDENCE}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Maître d'ouvrage: {{REF_2_MOA}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Montant: {{REF_2_MONTANT}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Travaux: {{REF_2_TRAVAUX}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Réalisation: {{REF_2_REALISATION}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="800"/>
            <a:t> </a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1200" b="1"/>
            <a:t>{{REF_3_RESIDENCE}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Maître d'ouvrage: {{REF_3_MOA}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Montant: {{REF_3_MONTANT}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Travaux: {{REF_3_TRAVAUX}}</a:t>
          </a:r>
        </a:p>
        <a:p>
          <a:r>
            <a:rPr lang="fr-FR" sz="1000"/>
            <a:t>Réalisation: {{REF_3_REALISATION}}</a:t>
          </a:r>
        </a:p>
      `;

      // Remplacer le contenu existant par le nouveau contenu multi-références
      // Chercher une zone de texte existante et la remplacer
      content = content.replace(
        /<a:t>Expériences professionnelles<\/a:t>.*?<a:t>2023-2024<\/a:t>/gs,
        multiRefContent.trim()
      );

      console.log('✅ Placeholders multi-références ajoutés au slide');
      
      // Remettre le contenu modifié
      zip.file(slideFile, content);
    }

    // Sauvegarder le nouveau template
    const newBuffer = await zip.generateAsync({type: 'nodebuffer'});
    fs.writeFileSync(newTemplatePath, newBuffer);

    console.log(`✅ Nouveau template multi-références créé: ${newTemplatePath}`);
    console.log(`📏 Taille: ${newBuffer.length} bytes`);

    return newTemplatePath;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  createMultiRefTemplate();
}

module.exports = createMultiRefTemplate;
