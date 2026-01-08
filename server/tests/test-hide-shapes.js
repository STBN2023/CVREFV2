// Test du masquage de volets complets

console.log('🧪 === TEST MASQUAGE DE VOLETS COMPLETS ===\n');

// Simuler le contenu XML PowerPoint avec des shapes
let xmlContent = `
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="1" name="TextBox1"/>
  </p:nvSpPr>
  <p:spPr/>
  <p:txBody>
    <a:p>
      <a:r>
        <a:t>Projet 1: Tour Majunga</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="2" name="TextBox2"/>
  </p:nvSpPr>
  <p:spPr/>
  <p:txBody>
    <a:p>
      <a:r>
        <a:t>Projet 2: {{REF_RESIDENCE}}</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="3" name="TextBox3"/>
  </p:nvSpPr>
  <p:spPr/>
  <p:txBody>
    <a:p>
      <a:r>
        <a:t>Montant: {{REF_MONTANT}}</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>
`;

console.log('📋 CONTENU XML ORIGINAL :');
console.log(xmlContent);

// Appliquer la logique de masquage de shapes
console.log('\n🙈 MASQUAGE DES VOLETS AVEC PLACEHOLDERS NON MIS À JOUR');

const remainingPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders && remainingPlaceholders.length > 0) {
  console.log(`   Placeholders trouvés: ${remainingPlaceholders.length}`);
  
  remainingPlaceholders.forEach(placeholder => {
    console.log(`\n   • Traitement: ${placeholder}`);
    
    // Trouver le shape parent qui contient ce placeholder
    const shapePattern = new RegExp(`(<p:sp[^>]*>)([\s\S]*?${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\s\S]*?)(</p:sp>)`, 'g');
    
    if (shapePattern.test(xmlContent)) {
      xmlContent = xmlContent.replace(shapePattern, (match, openTag, content, closeTag) => {
        if (content.includes('<p:nvSpPr>')) {
          // Ajouter la propriété hidden
          const hiddenShape = content.replace(
            '<p:nvSpPr>',
            '<p:nvSpPr><p:cNvPr id="0" name="hidden" hidden="1"/></p:nvSpPr><p:nvSpPr>'
          );
          console.log(`     → Shape complet masqué avec propriété hidden="1"`);
          return openTag + hiddenShape + closeTag;
        } else {
          console.log(`     → Pas de nvSpPr trouvé, suppression du placeholder`);
          return match.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        }
      });
    } else {
      console.log(`     → Pas de shape parent trouvé`);
    }
  });
}

console.log('\n📋 CONTENU XML APRÈS MASQUAGE :');
console.log(xmlContent);

// Vérifier le résultat
const hiddenShapes = (xmlContent.match(/hidden="1"/g) || []).length;
const remainingPlaceholdersAfter = xmlContent.match(/\{\{[^}]+\}\}/g);

console.log('\n📊 RÉSULTATS :');
console.log(`• Shapes masqués: ${hiddenShapes}`);
console.log(`• Placeholders restants: ${remainingPlaceholdersAfter ? remainingPlaceholdersAfter.length : 0}`);

if (hiddenShapes > 0) {
  console.log('\n✅ SUCCÈS: Volets complets masqués avec propriété PowerPoint hidden="1"');
  console.log('🎯 Dans PowerPoint: Les volets seront complètement invisibles');
} else {
  console.log('\n⚠️ Aucun shape masqué - vérifier la structure XML');
}

console.log('\n🏁 === FIN TEST ===');
