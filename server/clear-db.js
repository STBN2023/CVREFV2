const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'cv_enrichment.db');

console.log('🗑️ Connexion à la base de données...');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur connexion:', err.message);
        return;
    }
    console.log('✅ Connecté à:', dbPath);
});

// Fonction pour exécuter une requête
function runQuery(sql, description) {
    return new Promise((resolve, reject) => {
        db.run(sql, function(err) {
            if (err) {
                console.error(`❌ ${description}:`, err.message);
                reject(err);
            } else {
                console.log(`✅ ${description} - ${this.changes} lignes affectées`);
                resolve(this.changes);
            }
        });
    });
}

// Fonction pour compter les lignes
function countRows(table) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.count);
            }
        });
    });
}

async function clearReferences() {
    try {
        console.log('\n🗑️ SUPPRESSION DES RÉFÉRENCES...\n');
        
        // Supprimer les associations d'abord
        await runQuery('DELETE FROM salaries_references', 'Suppression associations salariés-références');
        
        // Supprimer les références
        await runQuery('DELETE FROM projets_references', 'Suppression toutes les références');
        
        // Réinitialiser auto-increment
        await runQuery('DELETE FROM sqlite_sequence WHERE name="projets_references"', 'Reset auto-increment références');
        await runQuery('DELETE FROM sqlite_sequence WHERE name="salaries_references"', 'Reset auto-increment associations');
        
        // Vérification
        const referencesCount = await countRows('projets_references');
        const associationsCount = await countRows('salaries_references');
        
        console.log('\n📊 RÉSULTAT:');
        console.log(`   Références restantes: ${referencesCount}`);
        console.log(`   Associations restantes: ${associationsCount}`);
        
        if (referencesCount === 0 && associationsCount === 0) {
            console.log('\n🎉 BASE DE DONNÉES VIDÉE AVEC SUCCÈS !');
        } else {
            console.log('\n⚠️ Certaines données n\'ont pas été supprimées');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('❌ Erreur fermeture:', err.message);
            } else {
                console.log('🔒 Connexion fermée');
            }
        });
    }
}

clearReferences();
