// Test de suppression des runs complets <a:r>

console.log('🧪 === TEST SUPPRESSION RUNS COMPLETS ===\n');

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

// Appliquer la nouvelle logique de suppression de runs
const remainingPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders) {
  console.log(`\n🧹 Suppression de ${remainingPlaceholders.length} runs complets:`);
  
  remainingPlaceholders.forEach(placeholder => {
    console.log(`\n   • Traitement: ${placeholder}`);
    
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const runPattern = new RegExp(`<a:r[^>]*>[\\s\\S]*?${escapedPlaceholder}[\\s\\S]*?</a:r>`, 'g');
    
    console.log(`     Pattern: <a:r[^>]*>[\\s\\S]*?${escapedPlaceholder}[\\s\\S]*?</a:r>`);
    
    if (runPattern.test(xmlContent)) {
      console.log(`     ✅ Run trouvé !`);
      
      // Montrer ce qui va être supprimé
      const matches = xmlContent.match(runPattern);
      if (matches) {
        console.log(`     Suppression: "${matches[0]}"`);
      }
      
      xmlContent = xmlContent.replace(runPattern, '');
      console.log(`     → Run complet <a:r> supprimé`);
    } else {
      console.log(`     ❌ Pas de run trouvé`);
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
  console.log('\n✅ PARFAIT: Runs complets supprimés !');
  console.log('🎯 Dans PowerPoint: Plus de labels orphelins');
} else if (remainingCount === 0 && remainingLabels) {
  console.log('\n⚠️ Placeholders supprimés mais labels orphelins restent');
  console.log('💡 Il faut peut-être supprimer le paragraphe complet <a:p>');
} else {
  console.log('\n❌ Des placeholders sont encore présents');
}

console.log('\n🏁 === FIN TEST ===');
