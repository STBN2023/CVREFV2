// Test simple pour voir le nouveau format des placeholders

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

console.log('🧪 === TEST FORMAT PLACEHOLDERS ===\n');

// Nouveau format structuré
const placeholderData = {
  'REF_RESIDENCE': references.map((ref, i) => `${i + 1}. ${ref.nom_projet || ref.residence || 'Projet non spécifié'}`).join('\n'),
  'REF_MOA': references.map((ref, i) => `${i + 1}. ${ref.client || ref.moa || 'Client non spécifié'}`).join('\n'),
  'REF_MONTANT': references.map((ref, i) => `${i + 1}. ${ref.montant ? ref.montant.toLocaleString() + ' €' : 'Non spécifié'}`).join('\n'),
  'REF_TRAVAUX': references.map((ref, i) => `${i + 1}. ${ref.type_mission || ref.travaux || 'Mission non spécifiée'}`).join('\n'),
  'REF_REALISATION': references.map((ref, i) => `${i + 1}. ${ref.annee || ref.realisation || 'Année non spécifiée'}`).join('\n')
};

console.log('📝 NOUVEAU FORMAT (structuré) :\n');

Object.entries(placeholderData).forEach(([key, value]) => {
  console.log(`🔸 ${key}:`);
  console.log(value);
  console.log('');
});

console.log('🏁 === FIN TEST ===');
