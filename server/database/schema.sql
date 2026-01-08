-- Base de données CVREFERENCE
-- Schéma SQL compatible SQLite et PostgreSQL

-- Table des salariés
CREATE TABLE salaries (
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
    actif BOOLEAN DEFAULT TRUE
);

-- Table des références
CREATE TABLE projets_references (
    id_reference INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_projet VARCHAR(255) NOT NULL,
    ville VARCHAR(100),
    annee INTEGER,
    type_mission VARCHAR(100),
    montant DECIMAL(12,2),
    description_courte VARCHAR(500),
    description_longue TEXT,
    client VARCHAR(255),
    duree_mois INTEGER,
    surface DECIMAL(10,2),
    date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison salariés-références (many-to-many)
CREATE TABLE salaries_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_salarie INTEGER NOT NULL,
    id_reference INTEGER NOT NULL,
    role_projet VARCHAR(100),
    date_debut DATE,
    date_fin DATE,
    principal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_salarie) REFERENCES salaries(id_salarie) ON DELETE CASCADE,
    FOREIGN KEY (id_reference) REFERENCES projets_references(id_reference) ON DELETE CASCADE,
    UNIQUE(id_salarie, id_reference)
);

-- Table de traçabilité des CV générés
CREATE TABLE cv_generes (
    id_generation INTEGER PRIMARY KEY AUTOINCREMENT,
    date_generation DATETIME DEFAULT CURRENT_TIMESTAMP,
    projet_ao VARCHAR(255),
    client_ao VARCHAR(255),
    date_limite_ao DATE,
    utilisateur VARCHAR(100),
    nombre_cv INTEGER,
    chemin_archive VARCHAR(500)
);

-- Table des détails par CV généré
CREATE TABLE cv_generes_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_generation INTEGER NOT NULL,
    id_salarie INTEGER NOT NULL,
    references_ids TEXT, -- JSON array of reference IDs
    ordre_references VARCHAR(50),
    chemin_fichier VARCHAR(500),
    statut VARCHAR(20) DEFAULT 'succes',
    FOREIGN KEY (id_generation) REFERENCES cv_generes(id_generation) ON DELETE CASCADE,
    FOREIGN KEY (id_salarie) REFERENCES salaries(id_salarie) ON DELETE CASCADE
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_salaries_agence ON salaries(agence);
CREATE INDEX idx_salaries_fonction ON salaries(fonction);
CREATE INDEX idx_references_annee ON projets_references(annee);
CREATE INDEX idx_references_client ON projets_references(client);
CREATE INDEX idx_sal_ref_salarie ON salaries_references(id_salarie);
CREATE INDEX idx_sal_ref_reference ON salaries_references(id_reference);
CREATE INDEX idx_cv_generes_date ON cv_generes(date_generation);
