-- Script pour vider toutes les références
-- Supprimer d'abord les associations (clés étrangères)
DELETE FROM salaries_references;

-- Supprimer toutes les références
DELETE FROM projets_references;

-- Réinitialiser les auto-increment
DELETE FROM sqlite_sequence WHERE name='projets_references';
DELETE FROM sqlite_sequence WHERE name='salaries_references';

-- Vérification
SELECT 'Références restantes:' as info, COUNT(*) as count FROM projets_references;
SELECT 'Associations restantes:' as info, COUNT(*) as count FROM salaries_references;
