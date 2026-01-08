const ExcelJS = require('exceljs');
const path = require('path');

async function createTestReferencesExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('References');

  // En-têtes
  worksheet.columns = [
    { header: 'Nom_Projet', key: 'nom_projet', width: 30 },
    { header: 'Client', key: 'client', width: 25 },
    { header: 'Ville', key: 'ville', width: 15 },
    { header: 'Annee', key: 'annee', width: 10 },
    { header: 'Type_Mission', key: 'type_mission', width: 20 },
    { header: 'Montant', key: 'montant', width: 15 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Duree_Mois', key: 'duree_mois', width: 12 },
    { header: 'Surface', key: 'surface', width: 12 },
    { header: 'Salaries', key: 'salaries', width: 40 }
  ];

  // Données de test
  const references = [
    { 
      nom_projet: 'Tour Horizon', 
      client: 'Société Générale', 
      ville: 'Paris', 
      annee: 2023, 
      type_mission: 'Construction', 
      montant: 15000000, 
      description: 'Construction d\'une tour de bureaux de 50 étages avec espaces commerciaux',
      duree_mois: 36,
      surface: 45000,
      salaries: 'Jean Dupont, Sophie Martin, Luc Bernard'
    },
    { 
      nom_projet: 'Hôpital Métropole', 
      client: 'CHU Lyon', 
      ville: 'Lyon', 
      annee: 2022, 
      type_mission: 'Rénovation', 
      montant: 12000000, 
      description: 'Rénovation complète du service de cardiologie avec équipements modernes',
      duree_mois: 24,
      surface: 8500,
      salaries: 'Marie Leroy, Pierre Durand'
    },
    { 
      nom_projet: 'Campus Innovation Tech', 
      client: 'Université Toulouse III', 
      ville: 'Toulouse', 
      annee: 2023, 
      type_mission: 'Extension', 
      montant: 8500000, 
      description: 'Extension du campus avec laboratoires de recherche et amphithéâtres',
      duree_mois: 30,
      surface: 12000,
      salaries: 'Antoine Moreau, Claire Simon, Emma Petit'
    },
    { 
      nom_projet: 'Résidence Les Jardins', 
      client: 'Bouygues Immobilier', 
      ville: 'Marseille', 
      annee: 2022, 
      type_mission: 'Construction', 
      montant: 6200000, 
      description: 'Résidence de 120 logements avec espaces verts et commerces de proximité',
      duree_mois: 28,
      surface: 9800,
      salaries: 'Sophie Martin, Marie Leroy'
    },
    { 
      nom_projet: 'Centre Commercial Atlantique', 
      client: 'Unibail-Rodamco', 
      ville: 'Nantes', 
      annee: 2023, 
      type_mission: 'Rénovation', 
      montant: 4800000, 
      description: 'Modernisation complète du centre commercial avec nouvelles enseignes',
      duree_mois: 18,
      surface: 15000,
      salaries: 'Jean Dupont, Luc Bernard'
    },
    { 
      nom_projet: 'Siège Social EcoTech', 
      client: 'EcoTech Solutions', 
      ville: 'Bordeaux', 
      annee: 2024, 
      type_mission: 'Construction', 
      montant: 3500000, 
      description: 'Bâtiment tertiaire HQE avec panneaux solaires et récupération d\'eau',
      duree_mois: 20,
      surface: 4200,
      salaries: 'Antoine Moreau, Claire Simon'
    }
  ];

  worksheet.addRows(references);

  const outPath = path.resolve(__dirname, '..', 'test-references.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log('✅ Fichier test-references.xlsx créé à:', outPath);
  console.log('📋 Colonnes : Nom_Projet, Client, Ville, Annee, Type_Mission, Montant, Description, Duree_Mois, Surface');
  console.log('📊 Nombre de lignes :', references.length);
}

createTestReferencesExcel().catch(console.error);
