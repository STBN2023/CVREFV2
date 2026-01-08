// Test de suppression des formes PowerPoint complètes <p:sp>

console.log('🧪 === TEST SUPPRESSION FORMES COMPLÈTES ===\n');

// Simuler la structure réelle du template PowerPoint avec formes
let xmlContent = `
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="52" name="reference_1"/>
  </p:nvSpPr>
  <p:txBody>
    <a:p>
      <a:r>
        <a:t>Maître d'ouvrage: {{REF_MOA}}</a:t>
      </a:r>
    </a:p>
    <a:p>
      <a:r>
        <a:t>Montant: {{REF_MONTANT}}</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="53" name="reference_2"/>
  </p:nvSpPr>
  <p:txBody>
    <a:p>
      <a:r>
        <a:t>Résidence: {{REF_RESIDENCE}}</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="54" name="static_content"/>
  </p:nvSpPr>
  <p:txBody>
    <a:p>
      <a:r>
        <a:t>Projet terminé: Hôpital Sud</a:t>
      </a:r>
    </a:p>
  </p:txBody>
</p:sp>
`;

console.log('📋 AVANT suppression:');
console.log(xmlContent);

// Appliquer la nouvelle logique de suppression de formes
const remainingPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders) {
  console.log(`\n🔍 Placeholders trouvés: ${remainingPlaceholders.length}`);
  remainingPlaceholders.forEach(ph => console.log(`   • ${ph}`));
  
  // Identifier les formes complètes qui contiennent des placeholders
  const shapesWithPlaceholders = new Set();
  
  remainingPlaceholders.forEach(placeholder => {
    console.log(`\n   🔍 Recherche de la forme contenant: ${placeholder}`);
    
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const shapePattern = new RegExp(`<p:sp[^>]*>[\\s\\S]*?${escapedPlaceholder}[\\s\\S]*?</p:sp>`, 'g');
    const matches = xmlContent.match(shapePattern);
    
    if (matches) {
      matches.forEach(match => {
        shapesWithPlaceholders.add(match);
        console.log(`     ✅ Forme PowerPoint identifiée (${match.length} caractères)`);
      });
    } else {
      console.log(`     ❌ Pas de forme trouvée`);
    }
  });
  
  // Supprimer toutes les formes identifiées
  console.log(`\n🧹 Suppression de ${shapesWithPlaceholders.size} formes PowerPoint complètes:`);
  
  shapesWithPlaceholders.forEach((shape, index) => {
    console.log(`\n   ${index + 1}. Suppression d'une forme complète:`);
    console.log(`      Extrait: "${shape.substring(0, 100)}..."`);
    xmlContent = xmlContent.replace(shape, '');
    console.log(`     → FORME COMPLÈTE <p:sp> SUPPRIMÉE !`);
  });
}

console.log('\n📋 APRÈS suppression:');
console.log(xmlContent);

// Vérifier les résultats
const remainingCount = (xmlContent.match(/\{\{[^}]+\}\}/g) || []).length;
const remainingShapes = (xmlContent.match(/<p:sp[^>]*>/g) || []).length;

console.log('\n📊 RÉSULTATS:');
console.log(`• Placeholders restants: ${remainingCount}`);
console.log(`• Formes PowerPoint restantes: ${remainingShapes}`);

if (remainingCount === 0) {
  console.log('\n✅ PARFAIT: Formes complètes avec placeholders supprimées !');
  console.log('🎯 Dans PowerPoint: VOLETS ENTIERS INVISIBLES');
  console.log('🎉 Plus de labels orphelins, plus de volets vides !');
} else {
  console.log('\n❌ Des placeholders sont encore présents');
}

console.log('\n🏁 === FIN TEST ===');
