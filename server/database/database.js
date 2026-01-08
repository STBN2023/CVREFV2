const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class DatabaseManager {
    constructor() {
        this.dbPath = path.join(__dirname, 'cv_enrichment.db');
        this.db = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🗄️  Initialisation de la base de données SQLite...');
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Erreur connexion SQLite:', err.message);
                    throw err;
                }
                console.log('✅ Connexion SQLite établie:', this.dbPath);
            });

            await this.run("PRAGMA foreign_keys = ON");
            await this.createTables();
            console.log('✅ Schéma de base de données créé');
            await this.fixSalariesReferencesTable();
            await this.addReferencesUniquenessConstraint();

            const salariesCount = await this.get("SELECT COUNT(*) as count FROM salaries");
            if (salariesCount.count === 0) {
                console.log('📊 Insertion des données de test...');
                await this.insertTestData();
                console.log('✅ Données de test insérées');
            } else {
                console.log(`📊 Base de données existante: ${salariesCount.count} salariés`);
            }

            this.isInitialized = true;
            console.log('🎉 Base de données initialisée avec succès');

        } catch (error) {
            console.error('❌ Erreur initialisation base de données:', error);
            throw error;
        }
    }

    async fixSalariesReferencesTable() {
        console.log('🔧 Vérification/correction table salaries_references...');
        
        try {
            const tableInfo = await this.all("PRAGMA table_info(salaries_references)");
            if (tableInfo.length === 0) {
                console.log('⚠️ Table salaries_references manquante, création...');
                await this.run(`
                    CREATE TABLE salaries_references (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_salarie INTEGER NOT NULL,
                        id_reference INTEGER NOT NULL,
                        role_projet VARCHAR(100),
                        date_debut DATE,
                        date_fin DATE,
                        principal BOOLEAN DEFAULT 0,
                        FOREIGN KEY (id_salarie) REFERENCES salaries(id_salarie) ON DELETE CASCADE,
                        FOREIGN KEY (id_reference) REFERENCES projets_references(id_reference) ON DELETE CASCADE,
                        UNIQUE(id_salarie, id_reference)
                    )
                `);
            }
            console.log('✅ Table salaries_references corrigée');
        } catch (error) {
            console.error('❌ Erreur lors de la correction de salaries_references:', error);
        }
    }

    async addReferencesUniquenessConstraint() {
        console.log('🔧 Vérification contrainte d\'unicité sur projets_references...');
        try {
            const tableInfo = await this.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='projets_references'");
            if (tableInfo.length > 0 && !tableInfo[0].sql.includes('UNIQUE(nom_projet, client, annee)')) {
                console.log('⚠️ Contrainte d\'unicité manquante, migration de la table...');
                await this.run(`
                    CREATE TABLE projets_references_new (
                        id_reference INTEGER PRIMARY KEY AUTOINCREMENT,
                        nom_projet VARCHAR(255) NOT NULL,
                        ville VARCHAR(100) NOT NULL,
                        annee INTEGER NOT NULL,
                        type_mission VARCHAR(100) NOT NULL,
                        montant DECIMAL(12,2),
                        description_courte VARCHAR(500),
                        description_longue TEXT,
                        client VARCHAR(255) NOT NULL,
                        duree_mois INTEGER,
                        surface DECIMAL(10,2),
                        date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
                        date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(nom_projet, client, annee)
                    )
                `);
                await this.run(`
                    INSERT INTO projets_references_new 
                    SELECT * FROM projets_references 
                    WHERE id_reference IN (
                        SELECT MIN(id_reference) 
                        FROM projets_references 
                        GROUP BY nom_projet, client, annee
                    )
                `);
                await this.run(`
                    UPDATE salaries_references 
                    SET id_reference = (
                        SELECT MIN(pr.id_reference) 
                        FROM projets_references pr 
                        JOIN projets_references pr_old ON pr.nom_projet = pr_old.nom_projet 
                            AND pr.client = pr_old.client 
                            AND pr.annee = pr_old.annee
                        WHERE pr_old.id_reference = salaries_references.id_reference
                    )
                    WHERE id_reference NOT IN (SELECT id_reference FROM projets_references_new)
                `);
                await this.run('DROP TABLE projets_references');
                await this.run('ALTER TABLE projets_references_new RENAME TO projets_references');
                console.log('✅ Contrainte d\'unicité ajoutée avec suppression des doublons');
            } else {
                console.log('✅ Contrainte d\'unicité déjà présente');
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de la contrainte d\'unicité:', error);
        }
    }

    async createTables() {
        await this.run(`
            CREATE TABLE IF NOT EXISTS salaries (
                id_salarie INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                agence VARCHAR(50),
                fonction VARCHAR(50),
                niveau_expertise VARCHAR(20),
                email VARCHAR(255) UNIQUE,
                telephone VARCHAR(20),
                chemin_cv VARCHAR(255),
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
                actif BOOLEAN DEFAULT 1
            )
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS projets_references (
                id_reference INTEGER PRIMARY KEY AUTOINCREMENT,
                nom_projet VARCHAR(255) NOT NULL,
                ville VARCHAR(100) NOT NULL,
                annee INTEGER NOT NULL,
                type_mission VARCHAR(100) NOT NULL,
                montant DECIMAL(12,2),
                description_courte VARCHAR(500),
                description_longue TEXT,
                client VARCHAR(255) NOT NULL,
                duree_mois INTEGER,
                surface DECIMAL(10,2),
                date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(nom_projet, client, annee)
            )
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS salaries_references (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_salarie INTEGER NOT NULL,
                id_reference INTEGER NOT NULL,
                role_projet VARCHAR(100),
                date_debut DATE,
                date_fin DATE,
                principal BOOLEAN DEFAULT 0,
                FOREIGN KEY (id_salarie) REFERENCES salaries(id_salarie) ON DELETE CASCADE,
                FOREIGN KEY (id_reference) REFERENCES projets_references(id_reference) ON DELETE CASCADE,
                UNIQUE(id_salarie, id_reference)
            )
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS agences (
                id_agence INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(100) NOT NULL UNIQUE,
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
                actif BOOLEAN DEFAULT 1
            )
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS fonctions (
                id_fonction INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(100) NOT NULL UNIQUE,
                description VARCHAR(255),
                actif BOOLEAN DEFAULT 1,
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS niveaux_expertise (
                id_niveau INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(50) NOT NULL UNIQUE,
                ordre INTEGER NOT NULL,
                description VARCHAR(255),
                actif BOOLEAN DEFAULT 1,
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS competences (
                id_competence INTEGER PRIMARY KEY AUTOINCREMENT,
                nom VARCHAR(100) NOT NULL UNIQUE,
                description VARCHAR(255),
                actif BOOLEAN DEFAULT 1,
                date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await this.run(`
            CREATE TABLE IF NOT EXISTS salarie_competences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_salarie INTEGER NOT NULL,
                id_competence INTEGER NOT NULL,
                FOREIGN KEY (id_salarie) REFERENCES salaries(id_salarie) ON DELETE CASCADE,
                FOREIGN KEY (id_competence) REFERENCES competences(id_competence) ON DELETE CASCADE,
                UNIQUE(id_salarie, id_competence)
            )
        `);

        console.log('✅ Tables créées avec succès');
    }

    async insertTestData() {
        // ... (inchangé)
    }

    executeScript(filename) {
        const scriptPath = path.join(__dirname, filename);
        const sql = fs.readFileSync(scriptPath, 'utf8');
        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ Erreur SQL run:', err.message);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('❌ Erreur SQL get:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ Erreur SQL all:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('❌ Erreur fermeture base:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ Connexion base de données fermée');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // ========= SALARIÉS =========

    async getAllSalaries() {
        const sql = `
            SELECT 
                id_salarie, nom, prenom, agence, fonction, 
                niveau_expertise, email, telephone, chemin_cv,
                date_creation, actif
            FROM salaries 
            ORDER BY nom, prenom
        `;
        return await this.all(sql);
    }

    async getSalarieById(id) {
        const sql = `
            SELECT * FROM salaries 
            WHERE id_salarie = ?
        `;
        return await this.get(sql, [id]);
    }

    async addSalarie(salarie) {
        const sql = `
            INSERT INTO salaries (nom, prenom, agence, fonction, niveau_expertise, email, telephone, actif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const generatedEmail = `${(salarie.prenom || '').toLowerCase()}.${(salarie.nom || '').toLowerCase()}@entreprise.com`;
        const email = (salarie.email && String(salarie.email).trim()) || generatedEmail;
        const actifValue = salarie.actif !== undefined ? (salarie.actif ? 1 : 0) : 1;
        const result = await this.run(sql, [
            salarie.nom, salarie.prenom, salarie.agence, salarie.fonction, 
            salarie.niveau_expertise, email, salarie.telephone || null, 
            actifValue
        ]);
        return { id: result.lastID };
    }

    async updateSalarie(id, salarie) {
        const sql = `
            UPDATE salaries 
            SET nom = ?, prenom = ?, agence = ?, fonction = ?, niveau_expertise = ?, 
                email = ?, telephone = ?, actif = ?, date_modification = CURRENT_TIMESTAMP
            WHERE id_salarie = ?
        `;
        const actifValue = salarie.actif !== undefined ? (salarie.actif ? 1 : 0) : 1;
        return await this.run(sql, [
            salarie.nom, salarie.prenom, salarie.agence, salarie.fonction, 
            salarie.niveau_expertise, salarie.email || null, salarie.telephone || null, 
            actifValue, id
        ]);
    }

    async deleteSalarie(id) {
        const sql = `DELETE FROM salaries WHERE id_salarie = ?`;
        return await this.run(sql, [id]);
    }

    // ========= RÉFÉRENTIELS =========

    async getAgences() {
        const sql = `
            SELECT id_agence, nom, actif, date_creation, date_modification
            FROM agences
            ORDER BY nom
        `;
        return await this.all(sql);
    }

    async getFonctions() {
        const sql = `
            SELECT id_fonction, nom, description, actif, date_creation, date_modification
            FROM fonctions
            ORDER BY nom
        `;
        return await this.all(sql);
    }

    async getNiveauxExpertise() {
        const sql = `
            SELECT id_niveau, nom, ordre, description, actif, date_creation, date_modification
            FROM niveaux_expertise
            ORDER BY ordre, nom
        `;
        return await this.all(sql);
    }

    async getCompetences() {
        const sql = `
            SELECT id_competence, nom, description, actif, date_creation, date_modification
            FROM competences
            ORDER BY nom
        `;
        return await this.all(sql);
    }

    // Création / Mise à jour / Suppression — Agences
    async addAgence({ nom, actif }) {
        const actifVal = actif !== undefined ? (actif ? 1 : 0) : 1;
        return await this.run(
            `INSERT INTO agences (nom, actif) VALUES (?, ?)`,
            [nom, actifVal]
        );
    }

    async updateAgence(id, { nom, actif }) {
        const actifVal = actif !== undefined ? (actif ? 1 : 0) : 1;
        return await this.run(
            `UPDATE agences 
             SET nom = ?, actif = ?, date_modification = CURRENT_TIMESTAMP
             WHERE id_agence = ?`,
            [nom, actifVal, id]
        );
    }

    async deleteAgence(id) {
        return await this.run(`DELETE FROM agences WHERE id_agence = ?`, [id]);
    }

    // Création / Mise à jour / Suppression — Fonctions
    async addFonction({ nom, description, actif }) {
        const actifVal = actif !== undefined ? (actif ? 1 : 0) : 1;
        return await this.run(
            `INSERT INTO fonctions (nom, description, actif) VALUES (?, ?, ?)`,
            [nom, description || null, actifVal]
        );
    }

    async updateFonction(id, { nom, description, actif }) {
        const actifVal = actif !== undefined ? (actif ? 1 : 0) : 1;
        return await this.run(
            `UPDATE fonctions
             SET nom = ?, description = ?, actif = ?, date_modification = CURRENT_TIMESTAMP
             WHERE id_fonction = ?`,
            [nom, description || null, actifVal, id]
        );
    }

    async deleteFonction(id) {
        return await this.run(`DELETE FROM fonctions WHERE id_fonction = ?`, [id]);
    }

    // Création / Mise à jour / Suppression — Niveaux d'expertise
    async addNiveau({ nom, ordre, description, actif }) {
        const actifVal = actif !== undefined ? (actif ? 1 : 0) : 1;
        return await this.run(
            `INSERT INTO niveaux_expertise (nom, ordre, description, actif) VALUES (?, ?, ?, ?)`,
            [nom, Number(ordre), description || null, actifVal]
        );
    }

    async updateNiveau(id, { nom, ordre, description, actif }) {
        const actifVal = actif !== undefined ? (actif ? 1 : 0) : 1;
        return await this.run(
            `UPDATE niveaux_expertise
             SET nom = ?, ordre = ?, description = ?, actif = ?, date_modification = CURRENT_TIMESTAMP
             WHERE id_niveau = ?`,
            [nom, Number(ordre), description || null, actifVal, id]
        );
    }

    async deleteNiveau(id) {
        return await this.run(`DELETE FROM niveaux_expertise WHERE id_niveau = ?`, [id]);
    }

    async addCompetence({ nom, description, actif }) {
        const actifVal = actif !== undefined ? (actif ? 1 : 0) : 1;
        return await this.run(
            `INSERT INTO competences (nom, description, actif) VALUES (?, ?, ?)`,
            [String(nom || '').trim(), description || null, actifVal]
        );
    }

    async updateCompetence(id, { nom, description, actif }) {
        const actifVal = actif !== undefined ? (actif ? 1 : 0) : 1;
        return await this.run(
            `UPDATE competences
             SET nom = ?, description = ?, actif = ?, date_modification = CURRENT_TIMESTAMP
             WHERE id_competence = ?`,
            [String(nom || '').trim(), description || null, actifVal, id]
        );
    }

    async deleteCompetence(id) {
        return await this.run(`DELETE FROM competences WHERE id_competence = ?`, [id]);
    }

    // ========= RÉFÉRENCES =========

    async getAllReferences() {
        const sql = `
            SELECT 
                id_reference, nom_projet, ville, annee, type_mission, montant,
                description_courte, description_longue, client, duree_mois, surface,
                date_ajout, date_modification
            FROM projets_references
            ORDER BY annee DESC, nom_projet
        `;
        return await this.all(sql);
    }

    // Ajout d'une référence
    async addReference(ref) {
        const sql = `
            INSERT INTO projets_references (
                nom_projet, ville, annee, type_mission, montant,
                description_courte, description_longue, client, duree_mois, surface
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = await this.run(sql, [
            ref.nom_projet || '',
            ref.ville || '',
            Number(ref.annee) || new Date().getFullYear(),
            ref.type_mission || '',
            ref.montant !== undefined && ref.montant !== null ? Number(ref.montant) : null,
            ref.description_courte || ref.description_projet || '',
            ref.description_longue || null,
            ref.client || '',
            ref.duree_mois !== undefined && ref.duree_mois !== null ? Number(ref.duree_mois) : null,
            ref.surface !== undefined && ref.surface !== null ? Number(ref.surface) : null,
        ]);
        return { id: result.id };
    }

    // Mise à jour d'une référence
    async updateReference(id, ref) {
        const sql = `
            UPDATE projets_references
            SET nom_projet = ?, ville = ?, annee = ?, type_mission = ?, montant = ?,
                description_courte = ?, description_longue = ?, client = ?, duree_mois = ?, surface = ?,
                date_modification = CURRENT_TIMESTAMP
            WHERE id_reference = ?
        `;
        return await this.run(sql, [
            ref.nom_projet || '',
            ref.ville || '',
            Number(ref.annee) || new Date().getFullYear(),
            ref.type_mission || '',
            ref.montant !== undefined && ref.montant !== null ? Number(ref.montant) : null,
            ref.description_courte || ref.description_projet || '',
            ref.description_longue || null,
            ref.client || '',
            ref.duree_mois !== undefined && ref.duree_mois !== null ? Number(ref.duree_mois) : null,
            ref.surface !== undefined && ref.surface !== null ? Number(ref.surface) : null,
            id
        ]);
    }

    // Suppression d'une référence
    async deleteReference(id) {
        const sql = `DELETE FROM projets_references WHERE id_reference = ?`;
        return await this.run(sql, [id]);
    }

    // Remplace toutes les associations d'une référence par la nouvelle liste de salariés fournie
    async replaceReferenceSalaries(idReference, salarieIds) {
        const uniqueIds = Array.from(new Set((salarieIds || [])
            .map((x) => Number(x))
            .filter((n) => Number.isInteger(n))));
        try {
            await this.run('BEGIN');
            await this.run('DELETE FROM salaries_references WHERE id_reference = ?', [idReference]);
            for (let i = 0; i < uniqueIds.length; i++) {
                const idSal = uniqueIds[i];
                await this.run(
                    'INSERT OR IGNORE INTO salaries_references (id_salarie, id_reference, principal) VALUES (?, ?, ?)',
                    [idSal, Number(idReference), 0]
                );
            }
            await this.run('COMMIT');
        } catch (e) {
            try { await this.run('ROLLBACK'); } catch {}
            throw e;
        }
    }

    async getSalarieReferences(idSalarie) {
        const sql = `
            SELECT pr.*, sr.role_projet, sr.date_debut, sr.date_fin, sr.principal
            FROM projets_references pr
            JOIN salaries_references sr ON pr.id_reference = sr.id_reference
            WHERE sr.id_salarie = ?
            ORDER BY sr.principal DESC, pr.annee DESC, pr.nom_projet
        `;
        return await this.all(sql, [idSalarie]);
    }

    async getLatestReferencesBySalaries(ids = [], limit = 5) {
        const map = {};
        for (const rawId of ids) {
            const id = String(rawId);
            const refs = await this.getSalarieReferences(id);
            map[id] = (refs || []).slice(0, Math.max(0, Number(limit) || 5));
        }
        return map;
    }

    // Remplace toutes les associations d'un salarié par la nouvelle liste fournie
    async replaceSalarieReferences(idSalarie, referenceIds) {
        const uniqueIds = Array.from(new Set((referenceIds || []).map((x) => Number(x)).filter((n) => Number.isInteger(n))));
        try {
            await this.run('BEGIN');
            await this.run('DELETE FROM salaries_references WHERE id_salarie = ?', [idSalarie]);
            for (let i = 0; i < uniqueIds.length; i++) {
                const idRef = uniqueIds[i];
                await this.run(
                    'INSERT OR IGNORE INTO salaries_references (id_salarie, id_reference, principal) VALUES (?, ?, ?)',
                    [idSalarie, idRef, i === 0 ? 1 : 0]
                );
            }
            await this.run('COMMIT');
        } catch (e) {
            try { await this.run('ROLLBACK'); } catch {}
            throw e;
        }
    }

    async replaceSalarieCompetences(idSalarie, competenceIds) {
        const uniqueIds = Array.from(new Set((competenceIds || []).map((x) => Number(x)).filter((n) => Number.isInteger(n))));
        try {
            await this.run('BEGIN');
            await this.run('DELETE FROM salarie_competences WHERE id_salarie = ?', [idSalarie]);
            for (let i = 0; i < uniqueIds.length; i++) {
                const idComp = uniqueIds[i];
                await this.run(
                    `INSERT OR IGNORE INTO salarie_competences (id_salarie, id_competence) VALUES (?, ?)`,
                    [idSalarie, idComp]
                );
            }
            await this.run('COMMIT');
        } catch (e) {
            try { await this.run('ROLLBACK'); } catch {}
            throw e;
        }
    }

    async getSalarieCompetences(idSalarie) {
        const sql = `
            SELECT c.id_competence, c.nom, c.description, c.actif
            FROM salarie_competences sc
            JOIN competences c ON c.id_competence = sc.id_competence
            WHERE sc.id_salarie = ?
            ORDER BY c.nom
        `;
        return await this.all(sql, [idSalarie]);
    }

    async deduplicateReferences() {
        const summary = { groups: 0, removedIds: [], keptToRemoved: {} };

        // Regrouper sur nom/client/annee insensible aux espaces et casse
        const dups = await this.all(`
            SELECT 
              LOWER(TRIM(nom_projet)) AS nom_key,
              LOWER(TRIM(client)) AS client_key,
              annee,
              COUNT(*) AS c
            FROM projets_references
            GROUP BY LOWER(TRIM(nom_projet)), LOWER(TRIM(client)), annee
            HAVING c > 1
        `);

        if (!dups || dups.length === 0) {
            return { ...summary, groups: 0 };
        }

        try {
            await this.run('BEGIN');

            for (const g of dups) {
                const rows = await this.all(
                    `SELECT id_reference 
                     FROM projets_references 
                     WHERE LOWER(TRIM(nom_projet)) = ? 
                       AND LOWER(TRIM(client)) = ? 
                       AND annee = ?
                     ORDER BY id_reference ASC`,
                    [g.nom_key, g.client_key, g.annee]
                );

                if (!rows || rows.length < 2) continue;

                const keepId = rows[0].id_reference;
                const removeIds = rows.slice(1).map(r => r.id_reference);
                summary.groups += 1;
                summary.keptToRemoved[keepId] = removeIds;

                // Repointer toutes les associations vers l'ID conservé
                for (const rid of removeIds) {
                    await this.run(
                        `UPDATE OR IGNORE salaries_references
                         SET id_reference = ?
                         WHERE id_reference = ?`,
                        [keepId, rid]
                    );
                }

                // Supprimer les doublons
                for (const rid of removeIds) {
                    await this.run(
                        `DELETE FROM projets_references WHERE id_reference = ?`,
                        [rid]
                    );
                    summary.removedIds.push(rid);
                }
            }

            await this.run('COMMIT');
        } catch (e) {
            try { await this.run('ROLLBACK'); } catch {}
            throw e;
        }

        return summary;
    }

    // ========= (Autres méthodes spécifiques) =========
    // ... ajoutez ici au besoin d'autres helpers
}

const dbManager = new DatabaseManager();
module.exports = dbManager;