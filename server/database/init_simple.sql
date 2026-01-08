-- Schema simple pour test
CREATE TABLE IF NOT EXISTS salaries (
    id_salarie INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    agence VARCHAR(50) NOT NULL,
    fonction VARCHAR(50) NOT NULL,
    niveau_expertise VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    chemin_cv VARCHAR(255),
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
    actif BOOLEAN DEFAULT 1
);

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
