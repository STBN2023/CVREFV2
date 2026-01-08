const ExcelJS = require('exceljs');

async function createTestExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Fonctions');

  // Ajouter les en-têtes
  worksheet.columns = [
    { header: 'Fonction', key: 'fonction', width: 30 },
    { header: 'Description', key: 'description', width: 50 }
  ];

  // Ajouter les données de test
  const fonctions = [
    { fonction: 'Architecte Solution', description: 'Conception d\'architectures techniques complexes' },
    { fonction: 'Product Owner', description: 'Gestion du backlog produit et des priorités' },
    { fonction: 'Scrum Master', description: 'Animation des cérémonies agiles et coaching équipe' },
    { fonction: 'Business Analyst', description: 'Analyse des besoins métier et spécifications' },
    { fonction: 'Testeur QA', description: 'Tests et validation qualité des applications' },
    { fonction: 'Data Engineer', description: 'Construction de pipelines de données' },
    { fonction: 'UX Designer', description: 'Conception d\'expériences utilisateur' },
    { fonction: 'DevSecOps', description: 'Sécurisation des pipelines de déploiement' }
  ];

  worksheet.addRows(fonctions);

  // Sauvegarder le fichier
  await workbook.xlsx.writeFile('test-fonctions.xlsx');
  console.log('✅ Fichier test-fonctions.xlsx créé avec succès !');
}

createTestExcel().catch(console.error);
