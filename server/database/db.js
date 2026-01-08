const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'cvreference.db');

// Créer/ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur lors de l\'ouverture de la base de données:', err.message);
  } else {
    console.log('✅ Connexion à la base de données SQLite réussie');
  }
});

// Fonction pour obtenir tous les salariés actifs
function getAllSalaries(callback) {
  const sql = `SELECT * FROM salaries WHERE actif = 1 ORDER BY nom, prenom`;
  db.all(sql, [], (err, rows) => {
    callback(err, rows);
  });
}

// Fonction pour obtenir un salarié par ID
function getSalaryById(id, callback) {
  const sql = `SELECT * FROM salaries WHERE id_salarie = ? AND actif = 1`;
  db.get(sql, [id], (err, row) => {
    callback(err, row);
  });
}

// Fonction pour obtenir toutes les références
function getAllReferences(callback) {
  const sql = `SELECT * FROM projets_references ORDER BY annee DESC, nom_projet`;
  db.all(sql, [], (err, rows) => {
    callback(err, rows);
  });
}

// Fonction pour obtenir les références d'un salarié
function getReferencesBySalaryId(salaryId, callback) {
  const sql = `
    SELECT r.*, sr.role_projet, sr.date_debut, sr.date_fin, sr.principal
    FROM projets_references r
    JOIN salaries_references sr ON r.id_reference = sr.id_reference
    WHERE sr.id_salarie = ?
    ORDER BY sr.principal DESC, r.annee DESC
  `;
  db.all(sql, [salaryId], (err, rows) => {
    callback(err, rows);
  });
}

// Fonction pour obtenir les salariés associés à une référence
function getSalariesByReferenceId(referenceId, callback) {
  const sql = `
    SELECT s.*, sr.role_projet, sr.date_debut, sr.date_fin, sr.principal
    FROM salaries s
    JOIN salaries_references sr ON s.id_salarie = sr.id_salarie
    WHERE sr.id_reference = ? AND s.actif = 1
    ORDER BY sr.principal DESC, s.nom, s.prenom
  `;
  db.all(sql, [referenceId], (err, rows) => {
    callback(err, rows);
  });
}

// Fonction pour insérer un nouveau salarié
function insertSalary(salary, callback) {
  const sql = `
    INSERT INTO salaries (nom, prenom, agence, fonction, niveau_expertise, email, telephone, chemin_cv)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    salary.nom,
    salary.prenom,
    salary.agence,
    salary.fonction,
    salary.niveau_expertise,
    salary.email,
    salary.telephone,
    salary.chemin_cv
  ];
  
  db.run(sql, params, function(err) {
    callback(err, this.lastID);
  });
}

// Fonction pour mettre à jour un salarié
function updateSalary(id, salary, callback) {
  const sql = `
    UPDATE salaries 
    SET nom = ?, prenom = ?, agence = ?, fonction = ?, niveau_expertise = ?, 
        email = ?, telephone = ?, chemin_cv = ?, date_modification = CURRENT_TIMESTAMP
    WHERE id_salarie = ?
  `;
  const params = [
    salary.nom,
    salary.prenom,
    salary.agence,
    salary.fonction,
    salary.niveau_expertise,
    salary.email,
    salary.telephone,
    salary.chemin_cv,
    id
  ];
  
  db.run(sql, params, function(err) {
    callback(err, this.changes);
  });
}

// Fonction pour désactiver un salarié (soft delete)
function deactivateSalary(id, callback) {
  const sql = `UPDATE salaries SET actif = 0, date_modification = CURRENT_TIMESTAMP WHERE id_salarie = ?`;
  db.run(sql, [id], function(err) {
    callback(err, this.changes);
  });
}

// Fonction pour insérer une nouvelle référence
function insertReference(reference, callback) {
  const sql = `
    INSERT INTO projets_references (nom_projet, ville, annee, type_mission, montant, 
                           description_courte, description_longue, client, duree_mois, surface)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    reference.nom_projet,
    reference.ville,
    reference.annee,
    reference.type_mission,
    reference.montant,
    reference.description_courte,
    reference.description_longue,
    reference.client,
    reference.duree_mois,
    reference.surface
  ];
  
  db.run(sql, params, function(err) {
    callback(err, this.lastID);
  });
}

// Fonction pour associer un salarié à une référence
function associateSalaryReference(association, callback) {
  const sql = `
    INSERT OR REPLACE INTO salaries_references 
    (id_salarie, id_reference, role_projet, date_debut, date_fin, principal)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    association.id_salarie,
    association.id_reference,
    association.role_projet,
    association.date_debut,
    association.date_fin,
    association.principal ? 1 : 0
  ];
  
  db.run(sql, params, function(err) {
    callback(err, this.lastID);
  });
}

// Fonction pour dissocier un salarié d'une référence
function dissociateSalaryReference(salaryId, referenceId, callback) {
  const sql = `DELETE FROM salaries_references WHERE id_salarie = ? AND id_reference = ?`;
  db.run(sql, [salaryId, referenceId], function(err) {
    callback(err, this.changes);
  });
}

// Fonction pour insérer un enregistrement de génération de CV
function insertCvGeneration(generation, callback) {
  const sql = `
    INSERT INTO cv_generes (projet_ao, client_ao, date_limite_ao, utilisateur, nombre_cv, chemin_archive)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    generation.projet_ao,
    generation.client_ao,
    generation.date_limite_ao,
    generation.utilisateur,
    generation.nombre_cv,
    generation.chemin_archive
  ];
  
  db.run(sql, params, function(err) {
    callback(err, this.lastID);
  });
}

// Fonction pour insérer les détails d'une génération de CV
function insertCvGenerationDetail(detail, callback) {
  const sql = `
    INSERT INTO cv_generes_details (id_generation, id_salarie, references_ids, ordre_references, chemin_fichier, statut)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    detail.id_generation,
    detail.id_salarie,
    detail.references_ids,
    detail.ordre_references,
    detail.chemin_fichier,
    detail.statut
  ];
  
  db.run(sql, params, function(err) {
    callback(err, this.lastID);
  });
}

// Exporter les fonctions
module.exports = {
  db,
  getAllSalaries,
  getSalaryById,
  getAllReferences,
  getReferencesBySalaryId,
  getSalariesByReferenceId,
  insertSalary,
  updateSalary,
  deactivateSalary,
  insertReference,
  associateSalaryReference,
  dissociateSalaryReference,
  insertCvGeneration,
  insertCvGenerationDetail
};
