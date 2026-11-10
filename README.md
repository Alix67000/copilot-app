# Poste de pilotage informatique

Application personnelle React + Vite pour consulter des e-mails et rendez-vous Microsoft 365 et suivre des tâches avec échéances. Déployable sur Vercel. Les e-mails et rendez-vous visibles avant connexion sont des **exemples**. Les tâches sont enregistrées uniquement dans le navigateur (`localStorage`) : aucune synchronisation ni sauvegarde cloud.

## Démarrer

Node.js 20 recommandé.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir l'URL affichée par Vite. Pour la production : `npm run build`.

## Connexion Outlook professionnel

1. Dans Microsoft Entra ID, enregistrer une application adaptée aux comptes professionnels de votre organisation. Copier son **Application (client) ID** et, si possible, son **Directory (tenant) ID**.
2. Dans « Authentication », ajouter une plateforme **Single-page application** avec les URI de redirection exactes : pour le développement, l'origine locale utilisée (par ex. `http://localhost:5173`), et pour la production, l'origine Vercel (par ex. `https://votre-domaine.vercel.app`). Ajouter séparément les domaines de preview nécessaires. Microsoft peut limiter les URI de redirection HTTP ; employer HTTPS pour les domaines déployés.
3. Ajouter les permissions Microsoft Graph déléguées `User.Read`, `Mail.Read` et `Calendars.Read`. Selon les règles de l'organisation, le consentement administrateur peut être nécessaire. Demander uniquement les permissions approuvées.
4. Dans `.env.local`, renseigner `VITE_MICROSOFT_CLIENT_ID` et `VITE_MICROSOFT_TENANT_ID`. La valeur `organizations` peut être utilisée en lieu et place d'un tenant précis. Redémarrer Vite après modification.
5. Dans Vercel, importer le dépôt, choisir le framework Vite, puis définir ces deux variables dans les paramètres du projet avant de redéployer. Commande : `npm run build` ; dossier de sortie : `dist`. Chaque URL utilisée doit correspondre à une URI de redirection autorisée dans Entra.

Les variables `VITE_` sont publiques dans le code distribué au navigateur : **ne jamais y placer un secret, un mot de passe ou une clé d'API**. La connexion utilise MSAL avec un flux SPA et les jetons sont conservés pour la session dans le navigateur. Les appels Microsoft Graph partent directement du navigateur. Les données Outlook chargées sont conservées en mémoire, pas dans la base de tâches locale. Le mode aperçu intégré à certains outils peut bloquer les fenêtres de connexion ; tester sur l'URL Vercel ou en local.

## Résumé par IA

Non implémenté à ce stade. Aucun e-mail n'est transmis à une IA. Un service devra être choisi en fonction des règles de l'entreprise (confidentialité, traitement et hébergement des données, coût). Pour une API avec clé, utiliser une fonction serveur Vercel et une variable d'environnement **non préfixée `VITE_`**, avec authentification, limitation d'accès et protection contre les abus ; ne jamais exposer la clé dans le navigateur. Une offre gratuite dépend du fournisseur et peut comporter des limites.

## Base de données

Pas nécessaire pour la première version personnelle. Une base comme Supabase deviendra utile pour synchroniser les tâches entre appareils ou les sauvegarder. Prévoir une authentification et des politiques RLS avant toute mise en production multi-utilisateur.

## Limites

- 15 e-mails récents maximum ; recherche sur ces e-mails déjà chargés, pas sur toute la boîte.
- Agenda : événements entre hier et les 14 prochains jours, 30 maximum. Les événements passés ne sont pas affichés.
- Tâches locales au navigateur, sans notifications externes.
- La connexion dépend de la configuration Microsoft, du consentement et de l'accès réel au compte ; elle ne peut être vérifiée sans ces éléments.

## Connecter Gmail

1. Créer ou choisir un projet dans [Google Cloud Console](https://console.cloud.google.com/), puis activer **Gmail API**.
2. Configurer l'écran de consentement OAuth (Google Auth Platform). Si l'application est en mode test et destinée à des comptes externes, ajouter l'adresse Gmail du propriétaire comme utilisateur test. Le scope `https://www.googleapis.com/auth/gmail.readonly` est restreint : le déploiement public peut exiger une vérification Google et d'autres exigences de sécurité. En mode test, Google peut afficher un avertissement sur l'application non vérifiée.
3. Créer un **client OAuth 2.0 de type Application Web** et ajouter les origines JavaScript autorisées : par exemple `http://localhost:5173`, l'origine exacte Vercel en HTTPS, ainsi que l'origine exacte de tout aperçu utilisé. Une origine ne contient aucun chemin. Ajouter explicitement les domaines d'aperçu que l'on souhaite utiliser.
4. Copier l'**identifiant client** (se terminant généralement par `.apps.googleusercontent.com`, ce n'est pas un secret) dans `VITE_GOOGLE_CLIENT_ID` dans `.env.local` pour le local, ou dans les variables d'environnement Vercel, puis redémarrer/redéployer. Ne pas exposer le secret du client OAuth.
5. Dans Paramètres, cliquer sur « Connecter Gmail », choisir le compte puis autoriser la lecture. Le navigateur doit autoriser la fenêtre de connexion ; si l'aperçu intégré la bloque, ouvrir directement l'URL du site déployé ou le site local.

Gmail utilise le flux de jeton Google Identity Services côté navigateur. L'accès est **en lecture seule**, limité aux 15 messages récents de la boîte de réception chargés dans l'interface. Le jeton reste en mémoire et disparaît au rechargement ; une reconnexion peut être nécessaire. Déconnecter efface les données de l'interface ; pour retirer le consentement Google, utiliser les paramètres de sécurité de son compte Google. Le module Google Agenda n'est pas encore connecté. Un seul fournisseur (Gmail ou Outlook) peut être actif à la fois.
