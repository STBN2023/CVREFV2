const ExcelJS = require('exceljs');
const path = require('path');

async function createTestSalariesExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Salaries');

  // En-têtes
  worksheet.columns = [
    { header: 'Prenom', key: 'prenom', width: 20 },
    { header: 'Nom', key: 'nom', width: 20 },
    { header: 'Agence', key: 'agence', width: 15 },
    { header: 'Fonction', key: 'fonction', width: 25 },
    { header: 'Niveau_Expertise', key: 'niveau_expertise', width: 20 },
    { header: 'Telephone', key: 'telephone', width: 15 }
  ];

  // Données de test
  const salaries = [
    { prenom: 'Jean', nom: 'Dupont', agence: 'Paris', fonction: 'Architecte', niveau_expertise: 'Senior', telephone: '01.23.45.67.89' },
    { prenom: 'Sophie', nom: 'Martin', agence: 'Lyon', fonction: 'Ingénieur Structure', niveau_expertise: 'Expert', telephone: '04.56.78.90.12' },
    { prenom: 'Pierre', nom: 'Durand', agence: 'Marseille', fonction: 'Chef de Projet', niveau_expertise: 'Confirmé', telephone: '04.91.23.45.67' },
    { prenom: 'Marie', nom: 'Leroy', agence: 'Toulouse', fonction: 'Ingénieur Fluides', niveau_expertise: 'Senior', telephone: '05.61.23.45.67' },
    { prenom: 'Paul', nom: 'Moreau', agence: 'Nantes', fonction: 'Économiste', niveau_expertise: 'Junior', telephone: '02.40.12.34.56' },
    { prenom: 'Claire', nom: 'Simon', agence: 'Bordeaux', fonction: 'Architecte', niveau_expertise: 'Expert', telephone: '05.56.78.90.12' },
    { prenom: 'Luc', nom: 'Michel', agence: 'Lille', fonction: 'BIM Manager', niveau_expertise: 'Confirmé', telephone: '03.20.45.67.89' },
    { prenom: 'Anne', nom: 'Petit', agence: 'Nice', fonction: 'Urbaniste', niveau_expertise: 'Senior', telephone: '04.93.12.34.56' }
  ];

  worksheet.addRows(salaries);

  const outPath = path.resolve(__dirname, '..', 'test-salaries.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log('✅ Fichier test-salaries.xlsx créé à:', outPath);
  console.log('📋 Colonnes : Nom, Prenom, Agence, Fonction, Niveau_Expertise, Telephone');
  console.log('📊 Nombre de lignes :', salaries.length);
}

createTestSalariesExcel().catch(console.error);
