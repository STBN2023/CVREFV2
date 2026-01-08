-- ===================================
-- SCHÉMA BASE DE DONNÉES CV ENRICHMENT
-- ===================================

-- Table des salariés
CREATE TABLE IF NOT EXISTS salaries (
    id_salarie INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    agence VARCHAR(50) NOT NULL,
    fonction VARCHAR(50) NOT NULL,
    niveau_expertise VARCHAR(20) NOT NULL CHECK (niveau_expertise IN ('Junior', 'Confirme', 'Senior', 'Expert')),
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    chemin_cv VARCHAR(255),
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
    actif BOOLEAN DEFAULT 1
);

-- Table des références/projets
CREATE TABLE IF NOT EXISTS references (
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
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison many-to-many salariés <-> références
CREATE TABLE IF NOT EXISTS salaries_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_salarie INTEGER NOT NULL,
    id_reference INTEGER NOT NULL,
    role_projet VARCHAR(100) NOT NULL,
    date_debut DATE,
    date_fin DATE,
    principal BOOLEAN DEFAULT 0,
    FOREIGN KEY (id_salarie) REFERENCES salaries(id_salarie) ON DELETE CASCADE,
    FOREIGN KEY (id_reference) REFERENCES references(id_reference) ON DELETE CASCADE,
    UNIQUE(id_salarie, id_reference)
);

-- Table de traçabilité des générations de CV
CREATE TABLE IF NOT EXISTS cv_generes (
    id_generation INTEGER PRIMARY KEY AUTOINCREMENT,
    date_generation DATETIME DEFAULT CURRENT_TIMESTAMP,
    projet_ao VARCHAR(255),
    client_ao VARCHAR(255),
    date_limite_ao DATE,
    utilisateur VARCHAR(100),
    nombre_cv INTEGER DEFAULT 0,
    chemin_archive VARCHAR(500)
);

-- Table des détails par CV généré
CREATE TABLE IF NOT EXISTS cv_generes_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_generation INTEGER NOT NULL,
    id_salarie INTEGER NOT NULL,
    references_ids TEXT, -- JSON array des IDs de références
    ordre_references VARCHAR(50) DEFAULT 'chronologique',
    chemin_fichier VARCHAR(500),
    statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'succes', 'erreur')),
    FOREIGN KEY (id_generation) REFERENCES cv_generes(id_generation) ON DELETE CASCADE,
    FOREIGN KEY (id_salarie) REFERENCES salaries(id_salarie) ON DELETE CASCADE
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_salaries_agence ON salaries(agence);
CREATE INDEX IF NOT EXISTS idx_salaries_fonction ON salaries(fonction);
CREATE INDEX IF NOT EXISTS idx_salaries_actif ON salaries(actif);
CREATE INDEX IF NOT EXISTS idx_references_annee ON references(annee);
CREATE INDEX IF NOT EXISTS idx_references_client ON references(client);
CREATE INDEX IF NOT EXISTS idx_salaries_references_salarie ON salaries_references(id_salarie);
CREATE INDEX IF NOT EXISTS idx_salaries_references_reference ON salaries_references(id_reference);
CREATE INDEX IF NOT EXISTS idx_cv_generes_date ON cv_generes(date_generation);

-- Trigger pour mettre à jour date_modification automatiquement
CREATE TRIGGER IF NOT EXISTS update_salaries_modification 
    AFTER UPDATE ON salaries
BEGIN
    UPDATE salaries SET date_modification = CURRENT_TIMESTAMP WHERE id_salarie = NEW.id_salarie;
END;

CREATE TRIGGER IF NOT EXISTS update_references_modification 
    AFTER UPDATE ON references
BEGIN
    UPDATE references SET date_modification = CURRENT_TIMESTAMP WHERE id_reference = NEW.id_reference;
END;
