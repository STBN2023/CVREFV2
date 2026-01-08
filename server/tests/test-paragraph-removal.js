// Test de suppression des paragraphes complets <a:p>

console.log('🧪 === TEST SUPPRESSION PARAGRAPHES COMPLETS ===\n');

// Simuler la structure réelle du template PowerPoint
let xmlContent = `
<a:p>
  <a:r>
    <a:rPr lang="fr-FR" sz="1000"/>
    <a:t>Maître d'ouvrage</a:t>
  </a:r>
  <a:r>
    <a:rPr lang="fr-FR" sz="1000"/>
    <a:t>: {{REF_MOA}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:rPr lang="fr-FR" sz="1000"/>
    <a:t>Montant</a:t>
  </a:r>
  <a:r>
    <a:rPr lang="fr-FR" sz="1000"/>
    <a:t>: {{REF_MONTANT}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:rPr lang="fr-FR" sz="1000"/>
    <a:t>Projet terminé: Hôpital Sud</a:t>
  </a:r>
</a:p>
`;

console.log('📋 AVANT suppression:');
console.log(xmlContent);

// Appliquer la nouvelle logique de suppression de paragraphes
const remainingPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders) {
  console.log(`\n🧹 Suppression de ${remainingPlaceholders.length} paragraphes complets:`);
  
  remainingPlaceholders.forEach(placeholder => {
    console.log(`\n   • Traitement: ${placeholder}`);
    
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const paragraphPattern = new RegExp(`<a:p[^>]*>[\\s\\S]*?${escapedPlaceholder}[\\s\\S]*?</a:p>`, 'g');
    
    console.log(`     Pattern: <a:p[^>]*>[\\s\\S]*?${escapedPlaceholder}[\\s\\S]*?</a:p>`);
    
    if (paragraphPattern.test(xmlContent)) {
      console.log(`     ✅ Paragraphe trouvé !`);
      
      // Montrer ce qui va être supprimé
      const matches = xmlContent.match(paragraphPattern);
      if (matches) {
        console.log(`     Suppression: "${matches[0].substring(0, 100)}..."`);
      }
      
      xmlContent = xmlContent.replace(paragraphPattern, '');
      console.log(`     → Paragraphe complet <a:p> supprimé`);
    } else {
      console.log(`     ❌ Pas de paragraphe trouvé`);
    }
  });
}

console.log('\n📋 APRÈS suppression:');
console.log(xmlContent);

// Vérifier les résultats
const remainingCount = (xmlContent.match(/\{\{[^}]+\}\}/g) || []).length;
const remainingLabels = xmlContent.includes('Maître d\'ouvrage') || xmlContent.includes('Montant');

console.log('\n📊 RÉSULTATS:');
console.log(`• Placeholders restants: ${remainingCount}`);
console.log(`• Labels orphelins restants: ${remainingLabels ? 'OUI' : 'NON'}`);

if (remainingCount === 0 && !remainingLabels) {
  console.log('\n✅ PARFAIT: Paragraphes complets supprimés !');
  console.log('🎯 Dans PowerPoint: Plus aucun label orphelin');
} else if (remainingCount === 0 && remainingLabels) {
  console.log('\n⚠️ Placeholders supprimés mais labels orphelins restent');
} else {
  console.log('\n❌ Des placeholders sont encore présents');
}

console.log('\n🏁 === FIN TEST ===');
