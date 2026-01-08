const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'database', 'cv_enrichment.db');

console.log('🗑️ Suppression simple des agences ID 4 à 10...');

// Ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur connexion base:', err.message);
    return;
  }
  console.log('✅ Connexion à la base SQLite');
});

// Supprimer les agences ID 4 à 10
db.run('DELETE FROM agences WHERE id_agence BETWEEN 4 AND 10', function(err) {
  if (err) {
    console.error('❌ Erreur suppression:', err.message);
  } else {
    console.log(`✅ ${this.changes} agences supprimées (ID 4 à 10)`);
  }
  
  // Afficher les agences restantes
  db.all('SELECT * FROM agences ORDER BY id_agence', (err, rows) => {
    if (err) {
      console.error('❌ Erreur lecture:', err.message);
    } else {
      console.log('\n📋 Agences restantes:');
      rows.forEach(agence => {
        console.log(`  - ID ${agence.id_agence}: ${agence.nom} (actif: ${agence.actif})`);
      });
    }
    
    // Fermer la base
    db.close((err) => {
      if (err) {
        console.error('❌ Erreur fermeture:', err.message);
      } else {
        console.log('\n✅ Suppression terminée');
      }
    });
  });
});
