const DatabaseManager = require('./database/database');

async function clearReferences() {
    const dbManager = new DatabaseManager();
    
    try {
        console.log('🗑️ Initialisation de la base de données...');
        await dbManager.initialize();
        
        console.log('🗑️ Suppression de toutes les associations salariés-références...');
        await dbManager.run('DELETE FROM salaries_references');
        
        console.log('🗑️ Suppression de toutes les références...');
        await dbManager.run('DELETE FROM projets_references');
        
        console.log('🗑️ Réinitialisation de l\'auto-increment...');
        await dbManager.run('DELETE FROM sqlite_sequence WHERE name="projets_references"');
        await dbManager.run('DELETE FROM sqlite_sequence WHERE name="salaries_references"');
        
        // Vérification
        const referencesCount = await dbManager.get('SELECT COUNT(*) as count FROM projets_references');
        const associationsCount = await dbManager.get('SELECT COUNT(*) as count FROM salaries_references');
        
        console.log(`✅ Références supprimées: ${referencesCount.count} restantes`);
        console.log(`✅ Associations supprimées: ${associationsCount.count} restantes`);
        
        if (referencesCount.count === 0 && associationsCount.count === 0) {
            console.log('🎉 Base de données des références vidée avec succès !');
        } else {
            console.log('⚠️ Certaines données n\'ont pas été supprimées');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
    } finally {
        await dbManager.close();
        console.log('🔒 Connexion fermée');
    }
}

// Exécuter le script
clearReferences();
