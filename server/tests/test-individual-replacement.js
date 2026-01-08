// Test de la logique de remplacement individuel

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
];

console.log('🧪 === TEST REMPLACEMENT INDIVIDUEL ===\n');

// Simuler le contenu XML avec des placeholders répétés
const xmlContent = `
<slide>
  <text>Projet: {{REF_RESIDENCE}}</text>
  <text>Client: {{REF_MOA}}</text>
  <text>Montant: {{REF_MONTANT}}</text>
</slide>
<slide>
  <text>Projet: {{REF_RESIDENCE}}</text>
  <text>Client: {{REF_MOA}}</text>
  <text>Montant: {{REF_MONTANT}}</text>
</slide>
`;

console.log('📋 CONTENU XML ORIGINAL :');
console.log(xmlContent);

// Appliquer la logique de remplacement
let processedContent = xmlContent;

['REF_RESIDENCE', 'REF_MOA', 'REF_MONTANT'].forEach(placeholder => {
  if (processedContent.includes(`{{${placeholder}}}`)) {
    console.log(`\n🔄 Traitement {{${placeholder}}} :`);
    
    // Remplacer chaque occurrence par une référence différente
    let refIndex = 0;
    processedContent = processedContent.replace(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'), () => {
      if (refIndex < references.length) {
        const ref = references[refIndex];
        let value = '';
        
        switch(placeholder) {
          case 'REF_RESIDENCE':
            value = ref.nom_projet || ref.residence || `Projet ${refIndex + 1}`;
            break;
          case 'REF_MOA':
            value = ref.client || ref.moa || 'Client non spécifié';
            break;
          case 'REF_MONTANT':
            value = ref.montant ? `${ref.montant.toLocaleString()} €` : 'Non spécifié';
            break;
          default:
            value = 'Donnée non spécifiée';
        }
        
        console.log(`   Occurrence ${refIndex + 1}: "${value}"`);
        refIndex++;
        return value;
      } else {
        console.log(`   Occurrence ${refIndex + 1}: (vide - pas assez de références)`);
        return '';
      }
    });
  }
});

console.log('\n📋 CONTENU XML APRÈS REMPLACEMENT :');
console.log(processedContent);

console.log('\n🏁 === FIN TEST ===');
