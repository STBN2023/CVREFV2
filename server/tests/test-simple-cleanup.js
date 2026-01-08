// Test simple de la règle de nettoyage

console.log('🧪 TEST RÈGLE DE NETTOYAGE\n');

// Contenu avec placeholders mixtes
let content = `
Projet 1: Tour Majunga
Projet 2: Hôpital Sud  
Projet 3: {{REF_RESIDENCE}}
Client 1: Société Générale
Client 2: CHU Lyon
Client 3: {{REF_MOA}}
Montant: {{REF_MONTANT}}
Travaux: {{REF_TRAVAUX}}
`;

console.log('AVANT NETTOYAGE:');
console.log(content);

// RÈGLE DE NETTOYAGE
const remainingPlaceholders = content.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders) {
  console.log('\nPlaceholders à supprimer:');
  remainingPlaceholders.forEach(p => console.log(`  • ${p}`));
  
  // Supprimer tous les placeholders restants
  content = content.replace(/\{\{[^}]+\}\}/g, '');
  
  console.log(`\n✅ ${remainingPlaceholders.length} placeholders supprimés`);
}

console.log('\nAPRÈS NETTOYAGE:');
console.log(content);

// Vérification finale
const check = content.match(/\{\{[^}]+\}\}/g);
console.log(check ? '❌ Placeholders restants' : '✅ Aucun placeholder restant');

console.log('\n🎯 RÉSULTAT: Tous les placeholders non mis à jour sont supprimés!');
