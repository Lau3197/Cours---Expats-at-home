# Guide de déploiement sur Netlify

## Prérequis
- Un compte Netlify (gratuit)
- Le projet doit être sur GitHub, GitLab ou Bitbucket (ou vous pouvez utiliser Netlify CLI)

## Méthode 1 : Déploiement via l'interface Netlify (Recommandé)

### Étape 1 : Préparer le projet
1. Assurez-vous que tous vos fichiers sont commités et poussés sur votre dépôt Git
2. Le fichier `netlify.toml` est déjà configuré dans le projet

### Étape 2 : Connecter votre dépôt à Netlify
1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Cliquez sur "Add new site" → "Import an existing project"
3. Connectez votre compte GitHub/GitLab/Bitbucket
4. Sélectionnez le dépôt contenant ce projet
5. Sélectionnez le dossier `extracted_french_mastery` comme répertoire racine

### Étape 3 : Configurer les paramètres de build
Netlify détectera automatiquement la configuration depuis `netlify.toml` :
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Étape 4 : Configurer les variables d'environnement
1. Dans les paramètres du site sur Netlify, allez dans "Site settings" → "Environment variables"
2. Ajoutez les variables suivantes :
   - `GEMINI_API_KEY` : Votre clé API Gemini

### Étape 5 : Déployer
1. Cliquez sur "Deploy site"
2. Netlify va automatiquement installer les dépendances, construire et déployer votre application

## Méthode 2 : Déploiement via Netlify CLI

### Installation de Netlify CLI
```bash
npm install -g netlify-cli
```

### Connexion à Netlify
```bash
netlify login
```

### Initialiser et déployer
```bash
cd extracted_french_mastery
netlify init
netlify deploy --prod
```

Lors de l'initialisation, Netlify vous demandera :
- Si vous voulez créer un nouveau site ou connecter un site existant
- Le répertoire de build : `dist`
- La commande de build : `npm run build`

### Configurer les variables d'environnement via CLI
```bash
netlify env:set GEMINI_API_KEY "votre-clé-api"
```

## Configuration Firebase

L'application utilise Firebase pour l'authentification et la base de données. Assurez-vous que :
1. Votre projet Firebase est configuré
2. Les domaines autorisés incluent votre domaine Netlify (ex: `votre-site.netlify.app`)
3. Dans Firebase Console → Authentication → Settings → Authorized domains, ajoutez votre domaine Netlify

## Vérification après déploiement

1. Vérifiez que l'application se charge correctement
2. Testez l'authentification Firebase
3. Vérifiez que les fonctionnalités utilisant l'API Gemini fonctionnent

## Mises à jour automatiques

Une fois connecté à Git, Netlify déploiera automatiquement votre site à chaque push sur la branche principale.

## Support

Pour plus d'informations, consultez la [documentation Netlify](https://docs.netlify.com/)







