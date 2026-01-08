# Cahier des Charges - Application d'Enrichissement de CV PowerPoint

## 1. PRÉSENTATION GÉNÉRALE

### 1.1 Contexte du projet
Application web full-stack permettant l'enrichissement automatique de CV PowerPoint avec des références projets personnalisées.

### 1.2 Objectifs
- Automatiser la création de CV personnalisés avec références spécifiques
- Simplifier le processus de constitution d'équipe et sélection de références
- Générer des fichiers PowerPoint enrichis téléchargeables
- Offrir une interface utilisateur moderne et intuitive

### 1.3 Périmètre
- Interface web responsive (React/TypeScript)
- API backend de traitement PowerPoint (Node.js/Express)
- Système de gestion des téléchargements
- Templates PowerPoint configurables

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack technologique
**Frontend :**
- React 18+ avec TypeScript
- Vite (bundler de développement)
- shadcn/ui (composants UI)
- Tailwind CSS (styles)
- React Router (navigation)

**Backend :**
- Node.js avec Express
- JSZip (manipulation fichiers PowerPoint)
- Multer (upload de fichiers)
- CORS (gestion cross-origin)

**Infrastructure :**
- Développement : localhost:8080 (frontend) + localhost:4000 (backend)
- Production : URLs relatives pour le frontend

### 2.2 Architecture des données
```
Référence {
  residence: string,
  moa: string (Maître d'ouvrage),
  montant: number,
  travaux: string,
  realisation: string
}

Équipe {
  membres: string[]
}
```

## 3. FONCTIONNALITÉS

### 3.1 Workflow utilisateur
1. **Page d'accueil** : Présentation et navigation
2. **Constitution d'équipe** (/team) : Sélection des membres
3. **Sélection de références** (/references) : Choix des projets
4. **Association** (/association) : Liaison équipe-références
5. **Récapitulatif** (/recap) : Validation et génération
6. **Téléchargements** (/downloads) : Gestion des fichiers générés

### 3.2 Fonctionnalités détaillées

#### 3.2.1 Génération de CV enrichi
- **Endpoint** : `POST /api/enrich-cv`
- **Input** : Fichier PowerPoint template + références JSON
- **Traitement** : Remplacement du placeholder `{{REFS}}` par le texte formaté des références
- **Output** : Fichier PowerPoint enrichi sauvegardé + métadonnées JSON

#### 3.2.2 Gestion des téléchargements
- **Listage** : `GET /api/downloads` - Liste des fichiers avec métadonnées
- **Téléchargement** : `GET /api/download/:filename` - Stream du fichier
- **Suppression** : `DELETE /api/download/:filename` - Nettoyage

#### 3.2.3 Système de notifications
- Toast de chargement pendant la génération
- Notification personnalisée avec détails du téléchargement
- Messages d'erreur explicites
- Auto-fermeture et animations

## 4. SPÉCIFICATIONS TECHNIQUES

### 4.1 Template PowerPoint
- **Placeholder principal** : `{{REFS}}` (remplacé par toutes les références)
- **Format de sortie** : Fichier .pptx compatible Office
- **Nommage** : `cv_enrichi_YYYY-MM-DDTHH-MM-SS.pptx`

### 4.2 Format des références injectées
```
Résidence: [nom_residence]
Maître d'ouvrage: [moa]
Montant: [montant] €
Travaux: [description_travaux]
Réalisation: [periode_realisation]

[Référence suivante...]
```

### 4.3 API Endpoints

#### POST /api/enrich-cv
```javascript
// Request
Content-Type: multipart/form-data
- pptx: File (template PowerPoint)
- references: JSON string (array de références)

// Response 200
{
  "message": "Fichier PowerPoint enrichi avec succès",
  "downloadUrl": "/api/download/cv_enrichi_2025-07-21T15-14-36.pptx",
  "filename": "cv_enrichi_2025-07-21T15-14-36.pptx",
  "referencesCount": 3
}

// Response 400/500
{
  "error": "Message d'erreur",
  "details": "Détails techniques"
}
```

#### GET /api/downloads
```javascript
// Response
{
  "files": [
    {
      "filename": "cv_enrichi_2025-07-21T15-14-36.pptx",
      "sizeBytes": 1234567,
      "createdAt": 1753110876000
    }
  ]
}
```

### 4.4 Composants UI principaux

#### DownloadNotification.tsx
- Notification personnalisée en overlay
- Affichage des détails du téléchargement
- Bouton "Télécharger à nouveau"
- Auto-fermeture après 10 secondes

#### BurgerMenu.tsx
- Menu de navigation responsive
- Liens vers toutes les pages
- Indicateurs d'état

## 5. SÉCURITÉ

### 5.1 Upload de fichiers
- Validation des extensions (.pptx uniquement)
- Limitation de taille des fichiers
- Nettoyage automatique des fichiers temporaires

### 5.2 Téléchargements
- Validation des noms de fichiers (pas de traversée de répertoire)
- Sanitisation des paramètres
- Gestion des erreurs 404

### 5.3 CORS
- Configuration pour développement et production
- Headers sécurisés pour les téléchargements

## 6. PERFORMANCES

### 6.1 Optimisations frontend
- Code splitting avec React Router
- Composants lazy-loaded
- Optimisation des re-renders avec useMemo/useCallback

### 6.2 Optimisations backend
- Streaming des fichiers volumineux
- Nettoyage automatique des uploads temporaires
- Gestion mémoire optimisée avec JSZip

## 7. TESTS ET VALIDATION

### 7.1 Tests backend disponibles
- `test-enrichment.js` : Test basique d'enrichissement
- `test-full-integration.js` : Test d'intégration complète
- `test-visible-content.js` : Validation du contenu visible
- `test-real-app-data.js` : Test avec données réelles
- `test-download-management.js` : Test de gestion des téléchargements

### 7.2 Validation manuelle
- Test du workflow complet utilisateur
- Vérification des fichiers générés dans PowerPoint
- Test des notifications et messages d'erreur

## 8. DÉPLOIEMENT

### 8.1 Environnement de développement
```bash
# Frontend
npm run dev  # Port 8080

# Backend
cd server
npm start    # Port 4000
```

### 8.2 Configuration production
- URLs relatives pour les appels API frontend
- Variables d'environnement pour les ports
- Gestion des logs et monitoring

## 9. MAINTENANCE

### 9.1 Structure des fichiers
```
/
├── src/                 # Code frontend React
├── server/              # API Node.js
│   ├── index_simple.js  # Serveur principal (JSZip)
│   ├── downloads/       # Fichiers générés
│   ├── uploads/         # Fichiers temporaires
│   └── template.pptx    # Template de base
├── public/              # Assets statiques
└── tests/               # Scripts de test
```

### 9.2 Logs et debugging
- Console logs détaillés côté backend
- Messages d'erreur explicites
- Traces des requêtes API

## 10. ÉVOLUTIONS FUTURES

### 10.1 Améliorations possibles
- Support de multiples templates
- Interface d'administration avancée
- Historique des générations
- Export vers d'autres formats (PDF, Word)

### 10.2 Optimisations techniques
- Cache des templates
- Compression des fichiers générés
- API de prévisualisation
- Système de versions des templates

---

**Version** : 1.0  
**Date** : 21 juillet 2025  
**Statut** : Implémenté et fonctionnel
