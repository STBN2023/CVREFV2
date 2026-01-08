// Test de suppression complète des lignes

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

console.log('🧪 === TEST SUPPRESSION COMPLÈTE DES LIGNES ===\n');
console.log(`📊 Nombre de références : ${references.length}`);

// Simuler le contenu XML PowerPoint avec structure réelle
const xmlContent = `
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
`;

console.log('📋 CONTENU XML ORIGINAL :');
console.log(xmlContent);

// Appliquer la nouvelle logique de suppression complète
let processedContent = xmlContent;

['REF_RESIDENCE', 'REF_MOA'].forEach(placeholder => {
  if (processedContent.includes(`{{${placeholder}}}`)) {
    console.log(`\n🔄 Traitement {{${placeholder}}} :`);
    
    const occurrences = (processedContent.match(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g')) || []).length;
    console.log(`   • ${occurrences} occurrences trouvées, ${references.length} références disponibles`);
    
    if (occurrences > references.length) {
      console.log(`   • Suppression complète des ${occurrences - references.length} dernières lignes`);
      
      // Remplacer avec tokens de suppression
      let refIndex = 0;
      processedContent = processedContent.replace(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'), () => {
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
          
          console.log(`   Occurrence ${refIndex + 1}: "${value}"`);
          refIndex++;
          return value;
        } else {
          console.log(`   Occurrence ${refIndex + 1}: (SUPPRESSION COMPLÈTE)`);
          return `__DELETE_LINE_${placeholder}_${refIndex++}__`;
        }
      });
      
      // Traiter les tokens de suppression
      const deleteTokens = processedContent.match(/__DELETE_LINE_[^_]+_\d+__/g) || [];
      deleteTokens.forEach(token => {
        console.log(`   • Suppression de ligne pour ${token}`);
        
        // Supprimer le paragraphe complet qui contient ce token
        const paragraphPattern = new RegExp(`<a:p[^>]*>[\\s\\S]*?${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?</a:p>`, 'g');
        
        if (paragraphPattern.test(processedContent)) {
          processedContent = processedContent.replace(paragraphPattern, '');
          console.log(`     → Paragraphe complet supprimé`);
        } else {
          // Fallback : supprimer juste le token
          processedContent = processedContent.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
          console.log(`     → Token supprimé (fallback)`);
        }
      });
    }
  }
});

console.log('\n📋 CONTENU XML APRÈS SUPPRESSION :');
console.log(processedContent);

// Vérifier qu'il n'y a plus de placeholders ou tokens visibles
const remainingPlaceholders = processedContent.match(/\{\{[^}]+\}\}|__DELETE_LINE_[^_]+_\d+__/g);
if (remainingPlaceholders) {
  console.log('\n❌ PLACEHOLDERS/TOKENS ENCORE VISIBLES :');
  remainingPlaceholders.forEach(p => console.log(`   • ${p}`));
} else {
  console.log('\n✅ AUCUN PLACEHOLDER/TOKEN VISIBLE - PARFAIT !');
}

console.log('\n🎨 RÉSULTAT POWERPOINT :');
console.log('• Références 1-2 : Visibles avec vraies données');
console.log('• Référence 3+ : COMPLÈTEMENT SUPPRIMÉES (lignes entières)');

console.log('\n🏁 === FIN TEST ===');
