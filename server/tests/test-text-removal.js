// Test de suppression d'éléments <a:t>

console.log('🧪 === TEST SUPPRESSION ÉLÉMENTS <a:t> ===\n');

let xmlContent = `
<a:p>
  <a:r>
    <a:t>Projet 1: Tour Majunga</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:t>Projet 2: {{REF_RESIDENCE}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:t>Client: {{REF_MOA}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:t>Montant: {{REF_MONTANT}}</a:t>
  </a:r>
</a:p>
`;

console.log('📋 AVANT:');
console.log(xmlContent);

// Appliquer la nouvelle logique de suppression d'éléments <a:t>
const remainingPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders) {
  console.log(`\n🧹 Suppression de ${remainingPlaceholders.length} éléments <a:t>:`);
  
  remainingPlaceholders.forEach(placeholder => {
    console.log(`\n   • Traitement: ${placeholder}`);
    
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const textElementPattern = new RegExp(`<a:t[^>]*>[^<]*${escapedPlaceholder}[^<]*</a:t>`, 'g');
    
    if (textElementPattern.test(xmlContent)) {
      console.log(`     ✅ Élément <a:t> trouvé !`);
      xmlContent = xmlContent.replace(textElementPattern, '');
      console.log(`     → Élément <a:t> supprimé complètement`);
    } else {
      console.log(`     ❌ Pas d'élément <a:t> trouvé`);
      xmlContent = xmlContent.replace(new RegExp(escapedPlaceholder, 'g'), '');
      console.log(`     → Placeholder supprimé (fallback)`);
    }
  });
}

console.log('\n📋 APRÈS:');
console.log(xmlContent);

// Vérifier les résultats
const removedElements = xmlContent.split('<a:t>').length - 1;
const remainingCount = (xmlContent.match(/\{\{[^}]+\}\}/g) || []).length;

console.log('\n📊 RÉSULTATS:');
console.log(`• Éléments <a:t> restants: ${removedElements}`);
console.log(`• Placeholders restants: ${remainingCount}`);

if (remainingCount === 0) {
  console.log('\n✅ PARFAIT: Tous les placeholders supprimés !');
  console.log('🎯 Dans PowerPoint: Les lignes avec placeholders vides disparaissent');
} else {
  console.log('\n❌ Des placeholders sont encore présents');
}

console.log('\n🏁 === FIN TEST ===');
