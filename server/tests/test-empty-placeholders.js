// Test avec 4 références sur 5 placeholders

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
  },
  {
    nom_projet: "Campus Innovation",
    client: "Université Toulouse",
    montant: 5000000, 
    annee: 2022,
    type_mission: "Extension"
  },
  {
    nom_projet: "EcoQuartier Nord",
    client: "Ville de Lille",
    montant: 9500000, 
    annee: 2020,
    type_mission: "Construction"
  }
  // Seulement 4 références pour 5 placeholders
];

console.log('🧪 === TEST 4 RÉFÉRENCES SUR 5 PLACEHOLDERS ===\n');
console.log(`📊 Nombre de références : ${references.length}`);

// Simuler le contenu XML avec 5 placeholders
const xmlContent = `
<slide>
  <text>Projet 1: {{REF_RESIDENCE}}</text>
  <text>Client 1: {{REF_MOA}}</text>
</slide>
<slide>
  <text>Projet 2: {{REF_RESIDENCE}}</text>
  <text>Client 2: {{REF_MOA}}</text>
</slide>
<slide>
  <text>Projet 3: {{REF_RESIDENCE}}</text>
  <text>Client 3: {{REF_MOA}}</text>
</slide>
<slide>
  <text>Projet 4: {{REF_RESIDENCE}}</text>
  <text>Client 4: {{REF_MOA}}</text>
</slide>
<slide>
  <text>Projet 5: {{REF_RESIDENCE}}</text>
  <text>Client 5: {{REF_MOA}}</text>
</slide>
`;

console.log('📋 CONTENU XML ORIGINAL (5 slides) :');
console.log(xmlContent);

// Appliquer la nouvelle logique de remplacement
let processedContent = xmlContent;

['REF_RESIDENCE', 'REF_MOA'].forEach(placeholder => {
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
          default:
            value = 'Donnée non spécifiée';
        }
        
        console.log(`   Occurrence ${refIndex + 1}: "${value}"`);
        refIndex++;
        return value;
      } else {
        // Si plus de placeholders que de références, remplacer par du contenu invisible
        console.log(`   Occurrence ${refIndex + 1}: (espace invisible - pas de référence)`);
        return ' '; // Espace invisible au lieu de placeholder visible
      }
    });
  }
});

console.log('\n📋 CONTENU XML APRÈS REMPLACEMENT :');
console.log(processedContent);

// Vérifier qu'il n'y a plus de placeholders visibles
const remainingPlaceholders = processedContent.match(/\{\{[^}]+\}\}/g);
if (remainingPlaceholders) {
  console.log('\n❌ PLACEHOLDERS ENCORE VISIBLES :');
  remainingPlaceholders.forEach(p => console.log(`   • ${p}`));
} else {
  console.log('\n✅ AUCUN PLACEHOLDER VISIBLE - PARFAIT !');
}

console.log('\n🏁 === FIN TEST ===');
