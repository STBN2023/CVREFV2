# Guide de diagnostic pour l'enrichissement PowerPoint

## 🔍 Problèmes courants et solutions

### 1. **Placeholders non trouvés dans le template**
**Symptôme :** Les références ne s'affichent pas dans le PowerPoint généré
**Cause :** Les placeholders `reference_1`, `reference_2`, etc. n'existent pas dans template.pptx
**Solution :**
- Ouvrir template.pptx
- Ajouter des zones de texte avec exactement : `reference_1`, `reference_2`, `reference_3`, `reference_4`, `reference_5`
- Ces placeholders seront remplacés par le contenu des références

### 2. **Format des données de références incorrect**
**Symptôme :** Erreur JSON ou champs manquants
**Format attendu :**
```json
[
  {
    "residence": "Nom de la résidence",
    "moa": "Maître d'ouvrage",
    "montant": 150000,
    "travaux": "Type de travaux",
    "realisation": "2023"
  }
]
```

### 3. **Erreurs Automizer**
**Symptômes courants :**
- "Cannot read property 'slides' of undefined"
- "Template not found"
- "Write permission denied"

**Solutions :**
- Vérifier que template.pptx existe et n'est pas corrompu
- S'assurer que le dossier uploads/ est accessible en écriture
- Redémarrer le serveur après modification du template

### 4. **Logs de debugging**
Le serveur affiche maintenant des logs détaillés :
```
=== DÉBUT ENRICHISSEMENT CV ===
Fichier reçu: mon-cv.pptx - Taille: 1067691 bytes
Template trouvé: C:\path\to\template.pptx
Références reçues: 2 éléments
Traitement référence 1: {...}
✓ Placeholder reference_1 mis à jour
```

## 🧪 Test rapide

1. **Installer les dépendances :**
   ```bash
   cd server
   npm install
   ```

2. **Démarrer le serveur :**
   ```bash
   npm start
   ```

3. **Lancer le test (dans un autre terminal) :**
   ```bash
   npm test
   ```

## 📋 Checklist de vérification

- [ ] Le serveur démarre sans erreur sur le port 4000
- [ ] Le fichier `template.pptx` existe dans le dossier server/
- [ ] Le template contient les placeholders `reference_1` à `reference_5`
- [ ] Le dossier `uploads/` existe et est accessible en écriture
- [ ] Les données de références respectent le format JSON attendu
- [ ] Les logs du serveur s'affichent correctement

## 🔧 Structure du template PowerPoint

Votre template.pptx doit contenir des zones de texte avec exactement ces noms :
- `reference_1`
- `reference_2`  
- `reference_3`
- `reference_4`
- `reference_5`

Chaque placeholder sera remplacé par :
```
[Nom de la résidence]
Maître d'ouvrage: [MOA]
Montant: [Montant] €
Type de travaux effectués: [Travaux]  Réalisation: [Année]
```
