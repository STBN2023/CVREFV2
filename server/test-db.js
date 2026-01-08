const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🧪 Test de la base de données SQLite...');

const dbPath = path.join(__dirname, 'database', 'test.db');
console.log('📁 Chemin de la base:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur connexion:', err.message);
        process.exit(1);
    }
    console.log('✅ Connexion SQLite réussie');
});

// Test simple
db.run("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)", (err) => {
    if (err) {
        console.error('❌ Erreur création table:', err.message);
        process.exit(1);
    }
    console.log('✅ Table de test créée');
    
    // Insertion test
    db.run("INSERT INTO test (name) VALUES (?)", ['Test SQLite'], function(err) {
        if (err) {
            console.error('❌ Erreur insertion:', err.message);
            process.exit(1);
        }
        console.log('✅ Insertion réussie, ID:', this.lastID);
        
        // Lecture test
        db.get("SELECT * FROM test WHERE id = ?", [this.lastID], (err, row) => {
            if (err) {
                console.error('❌ Erreur lecture:', err.message);
                process.exit(1);
            }
            console.log('✅ Lecture réussie:', row);
            
            db.close((err) => {
                if (err) {
                    console.error('❌ Erreur fermeture:', err.message);
                } else {
                    console.log('✅ Base de données fermée');
                    console.log('🎉 Test SQLite terminé avec succès !');
                }
            });
        });
    });
});
