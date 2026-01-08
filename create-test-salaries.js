import ExcelJS from 'exceljs';

async function createTestSalariesExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Salaries');

  // En-têtes
  worksheet.columns = [
    { header: 'Nom', key: 'nom', width: 20 },
    { header: 'Prenom', key: 'prenom', width: 20 },
    { header: 'Agence', key: 'agence', width: 15 },
    { header: 'Fonction', key: 'fonction', width: 25 },
    { header: 'Niveau_Expertise', key: 'niveau_expertise', width: 20 },
    { header: 'Telephone', key: 'telephone', width: 15 }
  ];

  // Données de test
  const salaries = [
    { nom: 'Dupont', prenom: 'Jean', agence: 'Paris', fonction: 'Architecte', niveau_expertise: 'Senior', telephone: '01.23.45.67.89' },
    { nom: 'Martin', prenom: 'Sophie', agence: 'Lyon', fonction: 'Ingénieur Structure', niveau_expertise: 'Expert', telephone: '04.56.78.90.12' },
    { nom: 'Durand', prenom: 'Pierre', agence: 'Marseille', fonction: 'Chef de Projet', niveau_expertise: 'Confirmé', telephone: '04.91.23.45.67' },
    { nom: 'Leroy', prenom: 'Marie', agence: 'Toulouse', fonction: 'Ingénieur Fluides', niveau_expertise: 'Senior', telephone: '05.61.23.45.67' },
    { nom: 'Moreau', prenom: 'Paul', agence: 'Nantes', fonction: 'Économiste', niveau_expertise: 'Junior', telephone: '02.40.12.34.56' },
    { nom: 'Simon', prenom: 'Claire', agence: 'Bordeaux', fonction: 'Architecte', niveau_expertise: 'Expert', telephone: '05.56.78.90.12' },
    { nom: 'Michel', prenom: 'Luc', agence: 'Lille', fonction: 'BIM Manager', niveau_expertise: 'Confirmé', telephone: '03.20.45.67.89' },
    { nom: 'Petit', prenom: 'Anne', agence: 'Nice', fonction: 'Urbaniste', niveau_expertise: 'Senior', telephone: '04.93.12.34.56' }
  ];

  worksheet.addRows(salaries);

  await workbook.xlsx.writeFile('test-salaries.xlsx');
  console.log('✅ Fichier test-salaries.xlsx créé avec succès !');
  console.log('📋 Colonnes : Nom, Prenom, Agence, Fonction, Niveau_Expertise, Telephone');
  console.log('📊 Nombre de lignes :', salaries.length);
}

createTestSalariesExcel().catch(console.error);
