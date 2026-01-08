// Test de l'approche invisible PowerPoint

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

console.log('🧪 === TEST PLACEHOLDERS INVISIBLES POWERPOINT ===\n');
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

// Appliquer la nouvelle logique PowerPoint
let processedContent = xmlContent;

['REF_RESIDENCE', 'REF_MOA'].forEach(placeholder => {
  if (processedContent.includes(`{{${placeholder}}}`)) {
    console.log(`\n🔄 Traitement {{${placeholder}}} :`);
    
    const occurrences = (processedContent.match(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g')) || []).length;
    console.log(`   • ${occurrences} occurrences trouvées, ${references.length} références disponibles`);
    
    if (occurrences > references.length) {
      console.log(`   • Rendu invisible des ${occurrences - references.length} dernières occurrences`);
      
      // Remplacer avec tokens invisibles
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
          console.log(`   Occurrence ${refIndex + 1}: (invisible)`);
          return `__INVISIBLE_${placeholder}_${refIndex++}__`;
        }
      });
      
      // Traiter les tokens invisibles
      const invisibleTokens = processedContent.match(/__INVISIBLE_[^_]+_\d+__/g) || [];
      invisibleTokens.forEach(token => {
        // Simuler l'ajout de couleur blanche
        const runPattern = new RegExp(`(<a:r[^>]*>)(([\s\S]*?)${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\s\S]*?))(</a:r>)`, 'g');
        
        if (runPattern.test(processedContent)) {
          processedContent = processedContent.replace(runPattern, (match, openTag, content, before, after, closeTag) => {
            const whiteColorXml = `
                        <a:rPr>
                          <a:solidFill>
                            <a:srgbClr val="FFFFFF"/>
                          </a:solidFill>
                        </a:rPr>
                        <a:t> </a:t>`;
            
            console.log(`   • Texte rendu invisible (couleur blanche) pour ${token}`);
            return openTag + whiteColorXml + closeTag;
          });
        } else {
          processedContent = processedContent.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), ' ');
          console.log(`   • Token remplacé par espace pour ${token}`);
        }
      });
    }
  }
});

console.log('\n📋 CONTENU XML APRÈS TRAITEMENT :');
console.log(processedContent);

// Vérifier qu'il n'y a plus de placeholders ou tokens visibles
const remainingPlaceholders = processedContent.match(/\{\{[^}]+\}\}|__INVISIBLE_[^_]+_\d+__/g);
if (remainingPlaceholders) {
  console.log('\n❌ PLACEHOLDERS/TOKENS ENCORE VISIBLES :');
  remainingPlaceholders.forEach(p => console.log(`   • ${p}`));
} else {
  console.log('\n✅ AUCUN PLACEHOLDER/TOKEN VISIBLE - PARFAIT !');
}

console.log('\n🎨 RÉSULTAT POWERPOINT :');
console.log('• Références 1-2 : Visibles avec vraies données');
console.log('• Référence 3+ : Invisibles (couleur blanche)');

console.log('\n🏁 === FIN TEST ===');
