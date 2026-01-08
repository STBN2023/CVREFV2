const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'cv_enrichment.db');

console.log('📊 Vérification de la base de données...');
console.log('📁 Chemin:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur connexion:', err.message);
        return;
    }
    console.log('✅ Connecté à la base de données\n');
});

// Vérifier les références
db.get('SELECT COUNT(*) as count FROM projets_references', (err, row) => {
    if (err) {
        console.error('❌ Erreur comptage références:', err.message);
    } else {
        console.log(`📋 Références: ${row.count}`);
    }
});

// Vérifier les associations
db.get('SELECT COUNT(*) as count FROM salaries_references', (err, row) => {
    if (err) {
        console.error('❌ Erreur comptage associations:', err.message);
    } else {
        console.log(`🔗 Associations: ${row.count}`);
    }
});

// Vérifier les salariés
db.get('SELECT COUNT(*) as count FROM salaries', (err, row) => {
    if (err) {
        console.error('❌ Erreur comptage salariés:', err.message);
    } else {
        console.log(`👥 Salariés: ${row.count}`);
    }
});

// Afficher quelques références si elles existent
db.all('SELECT id_reference, nom_projet, client, annee FROM projets_references LIMIT 5', (err, rows) => {
    if (err) {
        console.error('❌ Erreur lecture références:', err.message);
    } else if (rows.length > 0) {
        console.log('\n📋 Premières références:');
        rows.forEach(ref => {
            console.log(`   ${ref.id_reference}: ${ref.nom_projet} (${ref.client}, ${ref.annee})`);
        });
    } else {
        console.log('\n✅ Aucune référence dans la base');
    }
    
    // Fermer la connexion
    db.close((err) => {
        if (err) {
            console.error('❌ Erreur fermeture:', err.message);
        } else {
            console.log('\n🔒 Vérification terminée');
        }
    });
});
