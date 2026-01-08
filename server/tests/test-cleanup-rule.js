// Test de la règle de nettoyage des placeholders

const references = [
  {
    nom_projet: "Tour Majunga",
    client: "Société Générale", 
    montant: 12000000,
    annee: 2021,
    type_mission: "Construction"
  },
  {
    nom_projet: "Hôpital Sud", 
    client: "CHU Lyon",
    montant: 8000000,
    annee: 2019,
    type_mission: "Rénovation"
  }
  // Seulement 2 références pour 5 placeholders
];

console.log('🧪 === TEST RÈGLE DE NETTOYAGE ===\n');
console.log(`📊 Nombre de références : ${references.length}`);

// Simuler le contenu XML avec placeholders mixtes
let xmlContent = `
<a:p>
  <a:r>
    <a:t>Projet 1: {{REF_RESIDENCE}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:t>Projet 2: {{REF_RESIDENCE}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:t>Projet 3: {{REF_RESIDENCE}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:t>Client 1: {{REF_MOA}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:t>Client 2: {{REF_MOA}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:t>Client 3: {{REF_MOA}}</a:t>
  </a:r>
</a:p>
<a:p>
  <a:r>
    <a:t>Montant: {{REF_MONTANT}}</a:t>
  </a:r>
</a:p>
`;

console.log('📋 CONTENU XML ORIGINAL :');
console.log(xmlContent);

// ÉTAPE 1: Remplacer les placeholders connus
console.log('\n🔄 ÉTAPE 1: Remplacement des placeholders connus');

['REF_RESIDENCE', 'REF_MOA'].forEach(placeholder => {
  if (xmlContent.includes(`{{${placeholder}}}`)) {
    console.log(`\n   Traitement {{${placeholder}}} :`);
    
    let refIndex = 0;
    xmlContent = xmlContent.replace(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'), () => {
      if (refIndex < references.length) {
        const ref = references[refIndex];
        let value = '';
        
        switch(placeholder) {
          case 'REF_RESIDENCE':
            value = ref.nom_projet || `Projet ${refIndex + 1}`;
            break;
          case 'REF_MOA':
            value = ref.client || 'Client non spécifié';
            break;
        }
        
        console.log(`     • Occurrence ${refIndex + 1}: "${value}"`);
        refIndex++;
        return value;
      } else {
        console.log(`     • Occurrence ${refIndex + 1}: (vide)`);
        return '';
      }
    });
  }
});

console.log('\n📋 APRÈS REMPLACEMENT INITIAL :');
console.log(xmlContent);

// ÉTAPE 2: RÈGLE DE NETTOYAGE - Supprimer tous les placeholders restants
console.log('\n🧹 ÉTAPE 2: RÈGLE DE NETTOYAGE');

const remainingPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders && remainingPlaceholders.length > 0) {
  console.log(`   Placeholders non mis à jour trouvés :`);
  remainingPlaceholders.forEach(placeholder => {
    console.log(`     • Suppression: ${placeholder}`);
  });
  
  // Supprimer tous les placeholders restants
  xmlContent = xmlContent.replace(/\{\{[^}]+\}\}/g, '');
  
  console.log(`   ✅ ${remainingPlaceholders.length} placeholders supprimés`);
} else {
  console.log('   ✅ Aucun placeholder restant à supprimer');
}

console.log('\n📋 CONTENU XML FINAL (APRÈS NETTOYAGE) :');
console.log(xmlContent);

// Vérification finale
const finalCheck = xmlContent.match(/\{\{[^}]+\}\}/g);
if (finalCheck) {
  console.log('\n❌ ERREUR: Placeholders encore présents :');
  finalCheck.forEach(p => console.log(`   • ${p}`));
} else {
  console.log('\n✅ PARFAIT: Aucun placeholder visible dans le document final !');
}

console.log('\n🎨 RÉSULTAT POWERPOINT :');
console.log('• Références 1-2 : Visibles avec vraies données');
console.log('• Référence 3+ : Complètement supprimées (pas de placeholder visible)');
console.log('• Placeholders non traités (REF_MONTANT) : Supprimés par la règle de nettoyage');

console.log('\n🏁 === FIN TEST ===');
