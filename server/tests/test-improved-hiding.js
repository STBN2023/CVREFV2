// Test de la logique améliorée de masquage

console.log('🧪 === TEST MASQUAGE AMÉLIORÉ ===\n');

let xmlContent = `
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

console.log('📋 AVANT:');
console.log(xmlContent);

// Appliquer la nouvelle logique
const remainingPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders) {
  console.log(`\n🙈 Masquage de ${remainingPlaceholders.length} placeholders:`);
  
  remainingPlaceholders.forEach(placeholder => {
    console.log(`\n   • Traitement: ${placeholder}`);
    
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const shapePattern = new RegExp(`<p:sp[\\s\\S]*?${escapedPlaceholder}[\\s\\S]*?</p:sp>`, 'g');
    
    if (shapePattern.test(xmlContent)) {
      console.log(`     ✅ Shape trouvé !`);
      
      xmlContent = xmlContent.replace(shapePattern, (match) => {
        if (match.includes('<p:nvSpPr>')) {
          const hiddenShape = match.replace(
            /<p:cNvPr([^>]*)>/,
            '<p:cNvPr$1 hidden="1">'
          );
          console.log(`     → Shape masqué avec hidden="1"`);
          return hiddenShape;
        } else {
          const cleanShape = match.replace(new RegExp(escapedPlaceholder, 'g'), '');
          console.log(`     → Placeholder supprimé (fallback)`);
          return cleanShape;
        }
      });
    } else {
      console.log(`     ❌ Pas de shape trouvé`);
    }
  });
}

console.log('\n📋 APRÈS:');
console.log(xmlContent);

// Vérifier les résultats
const hiddenCount = (xmlContent.match(/hidden="1"/g) || []).length;
const remainingCount = (xmlContent.match(/\{\{[^}]+\}\}/g) || []).length;

console.log('\n📊 RÉSULTATS:');
console.log(`• Shapes masqués: ${hiddenCount}`);
console.log(`• Placeholders restants: ${remainingCount}`);

if (hiddenCount > 0) {
  console.log('\n✅ SUCCÈS: Volets masqués avec hidden="1"');
  console.log('🎯 Dans PowerPoint: Ces volets seront invisibles');
} else {
  console.log('\n❌ Aucun volet masqué');
}

console.log('\n🏁 === FIN TEST ===');
