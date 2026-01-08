const dbManager = require('./database/database');

async function deleteAgencies() {
  try {
    console.log('🗑️ Suppression des agences ID 4 à 10...');
    
    // Pas besoin d'initialiser, dbManager est déjà prêt
    
    // Supprimer les agences de ID 4 à 10 (désactivation)
    for (let id = 4; id <= 10; id++) {
      try {
        const result = await dbManager.deleteAgence(id);
        
        if (result.changes > 0) {
          console.log(`✅ Agence ID ${id} désactivée`);
        } else {
          console.log(`⚠️ Agence ID ${id} non trouvée`);
        }
      } catch (error) {
        console.error(`❌ Erreur suppression agence ID ${id}:`, error.message);
      }
    }
    
    // Vérifier les agences restantes
    const remainingAgencies = await dbManager.all('SELECT * FROM agences ORDER BY id_agence');
    console.log('\n📋 Agences restantes:');
    remainingAgencies.forEach(agence => {
      console.log(`  - ID ${agence.id_agence}: ${agence.nom} (actif: ${agence.actif})`);
    });
    
    console.log('\n✅ Suppression terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le script
deleteAgencies();
