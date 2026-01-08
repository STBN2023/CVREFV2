# Backend Node.js pour enrichissement de CV PowerPoint

## Installation

1. Placez-vous dans le dossier `server/` :
   ```
   cd server
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Lancez le serveur :
   ```
   npm start
   ```

Le serveur écoute sur http://localhost:4000

## Utilisation

- Envoyez une requête POST sur `/api/enrich-cv` avec :
  - `pptx` : le fichier PowerPoint du salarié (champ fichier)
  - `references` : un tableau JSON des références à insérer

Le serveur renverra le fichier `.pptx` enrichi.