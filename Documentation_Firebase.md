# Documentation de l'intégration Firebase - French Mastery

Cette documentation détaille les étapes réalisées pour intégrer Firebase dans l'application French Mastery.

## 1. Configuration Initiale
- Installation du SDK Firebase (`npm install firebase`).
- Configuration du projet Firebase avec les identifiants fournis.
- Initialisation de Firebase Authentication et Firestore Database.

## 2. Authentification
- **Méthodes activées :**
  - Email / Mot de passe.
  - Connexion Google (Gmail).
- **Flux d'inscription :** Les nouveaux utilisateurs sont enregistrés dans Firestore avec un rôle par défaut de `member`.

## 3. Gestion des Rôles (RBAC)
- **Superadmin :** `jacqueslaurine@live.be` possède les droits d'accès complets.
- **Membres :** Peuvent consulter tous les cours et contenus.
- **Admin Dashboard :** Accessible uniquement au superadmin.

## 4. Base de données (Firestore)
- **Collection `courses` :** Stocke les leçons, le contenu Markdown et les liens vidéo.
- **Collection `users` :** Stocke les profils utilisateurs et leurs rôles.

## 5. Tableau de bord Administrateur
- Interface permettant d'ajouter/modifier des leçons.
- Support du Markdown pour le contenu des cours (via `react-markdown`).
- Gestion des liens vidéo (YouTube ou .mp4).
- Fonction d'initialisation pour charger les cours par défaut dans Firestore.
- **Nouveau :** Fonction pour charger TOUTES les leçons depuis les fichiers Markdown (54 leçons dans 8 cours).

## 6. Chargement de toutes les leçons
### Méthode 1 : Via le Dashboard Admin (Recommandé)
1. Connectez-vous avec `jacqueslaurine@live.be`
2. Allez dans l'onglet **Admin**
3. Cliquez sur le bouton **"Charger toutes les leçons (54)"**
4. Confirmez l'action
5. Toutes les leçons seront chargées dans Firebase avec leur contenu Markdown complet

### Méthode 2 : Via le script Node.js
1. Générez le fichier JSON : `npm run generate-courses-json`
2. Le fichier `data/allCourses.json` sera créé avec toutes les leçons
3. Utilisez ensuite le bouton dans le dashboard pour charger ce JSON

**Cours chargés :**
- A1.1 : 12 leçons (Premiers Pas en Belgique)
- A1.2 : 12 leçons (Vie Quotidienne à Bruxelles)
- A2.1 : 12 leçons (S'installer en Belgique)
- A2.2 : 12 leçons (Vie Sociale et Culturelle)
- B1.1 : 2 leçons (Le Monde Professionnel)
- B1.2 : 1 leçon (Maîtrise Avancée)
- B2.1 : 2 leçons (Expertise Culturelle)
- B2.2 : 1 leçon (Maîtrise Complète)

**Total : 54 leçons avec contenu Markdown complet**

## 7. Corrections Techniques
- Résolution des erreurs d'exportation multiple dans `App.tsx` et `InstructorDashboard.tsx`.
- Nettoyage du fichier `index.html` pour utiliser les modules locaux via Vite/npm.
- Mise à jour des dépendances vers les dernières versions de Firebase et React-Markdown.
- Création d'un système de chargement automatique des leçons depuis les fichiers Markdown.
