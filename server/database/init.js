const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Créer le dossier database s'il n'existe pas
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'cvreference.db');
console.log('Chemin de la base de données:', dbPath);

// Créer/ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de la base de données:', err.message);
  } else {
    console.log('✅ Connexion à la base de données SQLite réussie');
  }
});

// Lire le schéma SQL
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Exécuter le schéma
db.exec(schema, (err) => {
  if (err) {
    console.error('Erreur lors de la création du schéma:', err.message);
  } else {
    console.log('✅ Schéma de la base de données créé avec succès');
    
    // Insérer des données de test
    insertTestData();
  }
});

// Insérer des données de test
function insertTestData() {
  const salaries = [
    [1, 'Martin', 'Alice', 'Paris', 'Développeur', 'Senior', 'alice.martin@entreprise.com', '+33 1 23 45 67 89', null],
    [2, 'Dubois', 'Benoit', 'Lyon', 'Designer', 'Confirmé', 'benoit.dubois@entreprise.com', '+33 4 56 78 90 12', null],
    [3, 'Leroy', 'Claire', 'Marseille', 'Chef de projet', 'Senior', 'claire.leroy@entreprise.com', '+33 4 98 76 54 32', null],
    [4, 'Morel', 'David', 'Paris', 'Développeur', 'Junior', 'david.morel@entreprise.com', '+33 1 98 76 54 32', null],
    [5, 'Bernard', 'Emma', 'Lyon', 'Développeur', 'Confirmé', 'emma.bernard@entreprise.com', '+33 4 32 10 98 76', null],
    [6, 'Petit', 'Fabrice', 'Marseille', 'Designer', 'Junior', 'fabrice.petit@entreprise.com', '+33 4 55 66 77 88', null]
  ];
  
  const projetsReferences = [
    [1, 'Rénovation Hôtel de Ville', 'Paris', 2023, 'Rénovation énergétique', 2500000.00, 'Rénovation complète de l\'hôtel de ville', 'Projet de rénovation énergétique complète incluant l\'isolation, le chauffage et l\'éclairage LED', 'Ville de Paris', 18, 5000.00],
    [2, 'Construction École Primaire', 'Lyon', 2022, 'Construction neuve', 3200000.00, 'Construction d\'une école primaire de 12 classes', 'Projet de construction d\'une école primaire moderne avec espaces extérieurs', 'Communauté de Lyon', 24, 2400.00],
    [3, 'Extension Centre Commercial', 'Marseille', 2023, 'Extension', 4500000.00, 'Extension de 15 000 m² de surface commerciale', 'Projet d\'extension du centre commercial avec nouvelles boutiques et parking', 'Centres Commerciaux Marseille', 30, 15000.00],
    [4, 'Rénovation Hôpital', 'Paris', 2024, 'Rénovation complète', 8000000.00, 'Rénovation complète de 3 étages', 'Projet de rénovation complète de l\'aile sud de l\'hôpital', 'Assistance Publique Hôpitaux de Paris', 36, 4500.00],
    [5, 'Construction Parking Souterrain', 'Lyon', 2021, 'Construction souterraine', 1800000.00, 'Construction d\'un parking de 200 places', 'Projet de construction d\'un parking souterrain avec ventilation et sécurité', 'Métropole de Lyon', 15, 8000.00]
  ];
  
  const salariesReferences = [
    [1, 1, 1, 'Chef de projet', '2023-01-15', '2023-06-30', true],
    [2, 1, 4, 'Développeur principal', '2024-01-10', '2024-12-31', true],
    [3, 2, 1, 'Designer principal', '2023-01-15', '2023-06-30', true],
    [4, 2, 3, 'Designer secondaire', '2023-03-01', '2023-12-31', false],
    [5, 3, 1, 'Chef de projet', '2023-01-15', '2023-06-30', true],
    [6, 3, 2, 'Chef de projet', '2022-01-10', '2022-12-20', true],
    [7, 3, 3, 'Chef de projet', '2023-01-01', '2023-12-31', true],
    [8, 3, 5, 'Chef de projet', '2021-01-15', '2021-12-31', true],
    [9, 4, 4, 'Développeur secondaire', '2024-01-10', '2024-12-31', false],
    [10, 5, 1, 'Développeur secondaire', '2023-02-01', '2023-06-30', false],
    [11, 5, 4, 'Développeur secondaire', '2024-02-01', '2024-12-31', false],
    [12, 6, 2, 'Designer secondaire', '2022-02-01', '2022-12-20', false],
    [13, 6, 3, 'Designer principal', '2023-03-01', '2023-12-31', true],
    [14, 6, 5, 'Designer secondaire', '2021-02-01', '2021-12-31', false]
  ];
  
  // Insérer les salariés
  const salaryStmt = db.prepare(`INSERT OR REPLACE INTO salaries 
    (id_salarie, nom, prenom, agence, fonction, niveau_expertise, email, telephone, chemin_cv) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  salaries.forEach(salary => {
    salaryStmt.run(salary, function(err) {
      if (err) {
        console.error('Erreur lors de l\'insertion du salarié:', err.message);
      }
    });
  });
  
  salaryStmt.finalize();
  
  // Insérer les références
  const refStmt = db.prepare(`INSERT OR REPLACE INTO projets_references 
    (id_reference, nom_projet, ville, annee, type_mission, montant, description_courte, description_longue, client, duree_mois, surface) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  projetsReferences.forEach(ref => {
    refStmt.run(ref, function(err) {
      if (err) {
        console.error('Erreur lors de l\'insertion de la référence:', err.message);
      }
    });
  });
  
  refStmt.finalize();
  
  // Insérer les associations salariés-références
  const salRefStmt = db.prepare(`INSERT OR REPLACE INTO salaries_references 
    (id, id_salarie, id_reference, role_projet, date_debut, date_fin, principal) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  
  salariesReferences.forEach(salRef => {
    salRefStmt.run(salRef, function(err) {
      if (err) {
        console.error('Erreur lors de l\'insertion de l\'association salarié-référence:', err.message);
      }
    });
  });
  
  salRefStmt.finalize();
  
  console.log('✅ Données de test insérées avec succès');
  
  // Fermer la base de données
  db.close((err) => {
    if (err) {
      console.error('Erreur lors de la fermeture de la base de données:', err.message);
    } else {
      console.log('✅ Base de données fermée avec succès');
      console.log('\n🎉 Base de données initialisée avec succès !');
      console.log('📊 Données insérées:');
      console.log(`   • ${salaries.length} salariés`);
      console.log(`   • ${projetsReferences.length} références`);
      console.log(`   • ${salariesReferences.length} associations salarié-référence`);
    }
  });
}
