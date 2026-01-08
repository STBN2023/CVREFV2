# Import Excel des Fonctions

## 🎯 Fonctionnalité

Cette fonctionnalité permet d'importer des fonctions en masse depuis un fichier Excel avec contrôle automatique d'unicité.

## 📋 Format du fichier Excel

### Structure requise :
- **Colonne obligatoire** : `Fonction` (nom de la fonction)
- **Colonne optionnelle** : `Description` (description de la fonction)

### Exemple de contenu :

| Fonction | Description |
|----------|-------------|
| Développeur Full Stack | Développement d'applications web complètes |
| Chef de Projet | Gestion et coordination de projets |
| Designer UX/UI | Conception d'interfaces utilisateur |
| Data Scientist | Analyse et traitement de données |
| DevOps Engineer | Automatisation et déploiement |

## 🔧 Utilisation

1. **Préparer le fichier Excel** :
   - Format : `.xlsx` ou `.xls`
   - Première ligne = en-têtes de colonnes
   - Colonne `Fonction` obligatoire

2. **Importer** :
   - Aller sur la page **Referentials** (`/referentials`)
   - Section **Fonctions**
   - Cliquer sur **"Importer Excel"**
   - Sélectionner votre fichier

3. **Résultat** :
   - ✅ Nouvelles fonctions ajoutées
   - ⚠️ Fonctions existantes ignorées (contrôle d'unicité)
   - ❌ Erreurs signalées

## 🛡️ Contrôle d'unicité

- **Comparaison insensible à la casse** : "Développeur" = "développeur"
- **Fonctions existantes** : Ignorées automatiquement
- **Nouvelles fonctions** : Ajoutées avec `actif = 1`

## 📊 Exemple de fichier test

Créez un fichier Excel avec ce contenu pour tester :

```
Fonction                | Description
------------------------|------------------------------------------
Architecte Solution     | Conception d'architectures techniques
Product Owner          | Gestion du backlog produit
Scrum Master           | Animation des cérémonies agiles
Business Analyst       | Analyse des besoins métier
Testeur QA             | Tests et validation qualité
```

## 🚀 Après l'import

Les nouvelles fonctions apparaîtront immédiatement dans :
- Page **Referentials** → Section Fonctions
- Formulaires de création/édition des salariés
- Filtres et sélections dans l'application

## 🔍 Logs et débogage

Les logs détaillés sont disponibles dans la console du serveur :
- Fichier reçu et validé
- Nombre de lignes traitées
- Fonctions ajoutées vs existantes
- Erreurs éventuelles
