-- ===================================
-- DONNÉES DE TEST CV ENRICHMENT
-- ===================================

-- Insertion des salariés
INSERT OR REPLACE INTO salaries (id_salarie, nom, prenom, agence, fonction, niveau_expertise, email, telephone, chemin_cv, actif) VALUES
(1, 'Dupont', 'Jean', 'Paris', 'Architecte', 'Senior', 'jean.dupont@dyad.fr', '01.23.45.67.89', '/templates/architecte_senior.pptx', 1),
(2, 'Martin', 'Sophie', 'Lyon', 'Ingénieur Structure', 'Expert', 'sophie.martin@dyad.fr', '04.56.78.90.12', '/templates/ingenieur_expert.pptx', 1),
(3, 'Durand', 'Pierre', 'Paris', 'Chef de Projet', 'Confirme', 'pierre.durand@dyad.fr', '01.34.56.78.90', '/templates/chef_projet.pptx', 1),
(4, 'Leroy', 'Marie', 'Marseille', 'Architecte', 'Junior', 'marie.leroy@dyad.fr', '04.67.89.01.23', '/templates/architecte_junior.pptx', 1),
(5, 'Moreau', 'Antoine', 'Lyon', 'Ingénieur Fluides', 'Confirme', 'antoine.moreau@dyad.fr', '04.78.90.12.34', '/templates/ingenieur_fluides.pptx', 1),
(6, 'Simon', 'Claire', 'Paris', 'Économiste', 'Senior', 'claire.simon@dyad.fr', '01.45.67.89.01', '/templates/economiste.pptx', 1),
(7, 'Bernard', 'Luc', 'Toulouse', 'Ingénieur VRD', 'Expert', 'luc.bernard@dyad.fr', '05.23.45.67.89', '/templates/ingenieur_vrd.pptx', 1),
(8, 'Petit', 'Emma', 'Paris', 'Architecte Paysagiste', 'Confirme', 'emma.petit@dyad.fr', '01.56.78.90.12', '/templates/paysagiste.pptx', 1);

-- Insertion des références/projets
INSERT OR REPLACE INTO references (id_reference, nom_projet, ville, annee, type_mission, montant, description_courte, description_longue, client, duree_mois, surface) VALUES
(1, 'Centre Commercial Confluence', 'Lyon', 2023, 'Maîtrise d''œuvre complète', 15000000.00, 'Centre commercial de 45000 m² avec parking', 'Conception et réalisation d''un centre commercial moderne intégrant commerces, restauration et services. Projet HQE avec certification BREEAM Excellent.', 'Unibail-Rodamco-Westfield', 36, 45000.00),

(2, 'Résidence Les Jardins', 'Paris', 2022, 'Conception architecturale', 8500000.00, 'Résidence de 120 logements sociaux', 'Programme de logements sociaux innovant avec espaces verts partagés, toitures végétalisées et performance énergétique RT2012+20%.', 'Paris Habitat', 24, 12000.00),

(3, 'Hôpital Nord Extension', 'Marseille', 2023, 'Extension hospitalière', 25000000.00, 'Extension de 8000 m² du pôle médical', 'Extension du service de cardiologie et création d''un nouveau bloc opératoire. Contraintes d''exploitation en site occupé.', 'AP-HM', 30, 8000.00),

(4, 'École Primaire Écologique', 'Toulouse', 2021, 'Bâtiment scolaire', 3200000.00, 'École de 12 classes en construction bois', 'École primaire bioclimatique en ossature bois, certification E3C1. Cour végétalisée et récupération d''eau de pluie.', 'Mairie de Toulouse', 18, 2400.00),

(5, 'Bureaux Skyline Tower', 'La Défense', 2024, 'Tour de bureaux', 45000000.00, 'Tour de bureaux de 25 étages', 'Tour de bureaux haute performance énergétique avec façade double-peau et systèmes intelligents. Certification HQE Exceptionnel.', 'Bouygues Immobilier', 42, 32000.00),

(6, 'Médiathèque Intercommunale', 'Annecy', 2022, 'Équipement culturel', 6800000.00, 'Médiathèque de 3500 m² avec auditorium', 'Médiathèque moderne intégrant espaces de lecture, auditorium 200 places, ateliers numériques et café littéraire.', 'Communauté d''Agglomération', 20, 3500.00),

(7, 'Usine Agroalimentaire', 'Rennes', 2023, 'Bâtiment industriel', 12000000.00, 'Usine de transformation 15000 m²', 'Usine de transformation agroalimentaire avec zones de production, stockage frigorifique et bureaux administratifs.', 'Groupe Lactalis', 28, 15000.00),

(8, 'Complexe Sportif Municipal', 'Nice', 2021, 'Équipement sportif', 9500000.00, 'Complexe avec piscine et gymnases', 'Complexe sportif comprenant piscine olympique, 2 gymnases, salle de musculation et espaces de bien-être.', 'Ville de Nice', 22, 5200.00);

-- Associations salariés-références (relations many-to-many)
INSERT OR REPLACE INTO salaries_references (id_salarie, id_reference, role_projet, date_debut, date_fin, principal) VALUES
-- Jean Dupont (Architecte Senior)
(1, 1, 'Architecte mandataire', '2022-01-15', '2023-12-30', 1),
(1, 2, 'Architecte conseil', '2021-06-01', '2022-11-30', 0),
(1, 5, 'Architecte associé', '2023-03-01', '2024-08-31', 1),

-- Sophie Martin (Ingénieur Structure Expert)
(2, 1, 'Ingénieur structure principal', '2022-02-01', '2023-12-30', 1),
(2, 3, 'Ingénieur structure', '2022-08-15', '2023-10-31', 1),
(2, 5, 'Ingénieur structure', '2023-04-01', '2024-08-31', 0),
(2, 7, 'Consultant structure', '2022-11-01', '2023-07-31', 0),

-- Pierre Durand (Chef de Projet)
(3, 2, 'Chef de projet', '2021-06-01', '2022-11-30', 1),
(3, 4, 'Chef de projet', '2020-09-01', '2021-12-31', 1),
(3, 6, 'Chef de projet adjoint', '2021-10-01', '2022-06-30', 0),

-- Marie Leroy (Architecte Junior)
(4, 4, 'Architecte junior', '2020-10-01', '2021-12-31', 0),
(4, 6, 'Architecte', '2021-11-01', '2022-06-30', 0),
(4, 8, 'Architecte', '2020-08-01', '2021-10-31', 0),

-- Antoine Moreau (Ingénieur Fluides)
(5, 1, 'Ingénieur CVC', '2022-03-01', '2023-11-30', 0),
(5, 3, 'Ingénieur fluides médicaux', '2022-09-01', '2023-10-31', 1),
(5, 5, 'Ingénieur CVC', '2023-05-01', '2024-07-31', 0),
(5, 7, 'Ingénieur process', '2023-01-01', '2023-07-31', 1),

-- Claire Simon (Économiste Senior)
(6, 1, 'Économiste principal', '2022-01-15', '2023-12-30', 0),
(6, 2, 'Économiste', '2021-06-01', '2022-11-30', 0),
(6, 5, 'Économiste', '2023-03-01', '2024-08-31', 0),

-- Luc Bernard (Ingénieur VRD Expert)
(7, 2, 'Ingénieur VRD', '2021-07-01', '2022-10-31', 0),
(7, 4, 'Ingénieur VRD', '2020-10-01', '2021-11-30', 0),
(7, 8, 'Ingénieur VRD principal', '2020-09-01', '2021-09-30', 1),

-- Emma Petit (Architecte Paysagiste)
(8, 2, 'Paysagiste', '2021-08-01', '2022-09-30', 0),
(8, 4, 'Paysagiste principal', '2020-11-01', '2021-12-31', 1),
(8, 6, 'Paysagiste', '2022-01-01', '2022-05-31', 0),
(8, 8, 'Paysagiste', '2020-10-01', '2021-08-31', 0);
