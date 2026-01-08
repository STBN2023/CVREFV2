// Test de suppression complète des lignes

console.log('🧪 === TEST SUPPRESSION COMPLÈTE DES LIGNES ===\n');

// Simuler le contenu réel du template
let xmlContent = `
<a:t>Maître d'ouvrage: {{REF_MOA}}</a:t>
<a:t>Montant: {{REF_MONTANT}}</a:t>
<a:t>Type de travaux effectués: {{REF_TRAVAUX}}</a:t>
<a:t>Réalisation: {{REF_REALISATION}}</a:t>
<a:t>Projet terminé: Hôpital Sud</a:t>
`;

console.log('📋 AVANT suppression:');
console.log(xmlContent);

// Appliquer la logique de suppression
const remainingPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders) {
  console.log(`\n🧹 Suppression de ${remainingPlaceholders.length} éléments complets:`);
  
  remainingPlaceholders.forEach(placeholder => {
    console.log(`\n   • Traitement: ${placeholder}`);
    
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const textElementPattern = new RegExp(`<a:t[^>]*>[^<]*${escapedPlaceholder}[^<]*</a:t>`, 'g');
    
    console.log(`     Pattern: <a:t[^>]*>[^<]*${escapedPlaceholder}[^<]*</a:t>`);
    
    if (textElementPattern.test(xmlContent)) {
      console.log(`     ✅ Élément trouvé !`);
      
      // Montrer ce qui va être supprimé
      const matches = xmlContent.match(textElementPattern);
      if (matches) {
        console.log(`     Suppression: "${matches[0]}"`);
      }
      
      xmlContent = xmlContent.replace(textElementPattern, '');
      console.log(`     → Élément complet supprimé`);
    } else {
      console.log(`     ❌ Pas d'élément trouvé`);
    }
  });
}

console.log('\n📋 APRÈS suppression:');
console.log(xmlContent);

// Vérifier les résultats
const remainingCount = (xmlContent.match(/\{\{[^}]+\}\}/g) || []).length;
const remainingLabels = xmlContent.includes('Maître d\'ouvrage:') || xmlContent.includes('Montant:') || xmlContent.includes('Type de travaux');

console.log('\n📊 RÉSULTATS:');
console.log(`• Placeholders restants: ${remainingCount}`);
console.log(`• Labels vides restants: ${remainingLabels ? 'OUI' : 'NON'}`);

if (remainingCount === 0 && !remainingLabels) {
  console.log('\n✅ PARFAIT: Lignes complètes supprimées !');
  console.log('🎯 Dans PowerPoint: Plus de labels vides');
} else if (remainingCount === 0 && remainingLabels) {
  console.log('\n⚠️ Placeholders supprimés mais labels vides restent');
} else {
  console.log('\n❌ Des placeholders sont encore présents');
}

console.log('\n🏁 === FIN TEST ===');
