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

Gemini est configuré côté serveur pour analyser les messages sélectionnés. L'analyse des 72 dernières heures est déclenchée par l'utilisateur et transmet les messages à Google ; utiliser uniquement si l'organisation l'autorise. Les résultats sont à vérifier et les quotas gratuits peuvent limiter l'utilisation.

## Base de données

Pas nécessaire pour la première version personnelle. Une base comme Supabase deviendra utile pour synchroniser les tâches entre appareils ou les sauvegarder. Prévoir une authentification et des politiques RLS avant toute mise en production multi-utilisateur.

## Limites

- Gmail : jusqu’à 50 résultats correspondant aux 72 dernières heures ; un avertissement indique si d’autres pages existent. La recherche de l’interface porte uniquement sur les messages chargés. Outlook : filtre sur les 15 derniers messages récupérés.
- Agenda : événements entre hier et les 14 prochains jours, 30 maximum. Les événements passés ne sont pas affichés.
- Tâches locales au navigateur, sans notifications externes.
- La connexion dépend de la configuration Microsoft, du consentement et de l'accès réel au compte ; elle ne peut être vérifiée sans ces éléments.

## Connecter Gmail

1. Créer ou choisir un projet dans [Google Cloud Console](https://console.cloud.google.com/), puis activer **Gmail API**.
2. Configurer l'écran de consentement OAuth (Google Auth Platform). Si l'application est en mode test et destinée à des comptes externes, ajouter l'adresse Gmail du propriétaire comme utilisateur test. Le scope `https://www.googleapis.com/auth/gmail.readonly` est restreint : le déploiement public peut exiger une vérification Google et d'autres exigences de sécurité. En mode test, Google peut afficher un avertissement sur l'application non vérifiée.
3. Créer un **client OAuth 2.0 de type Application Web** et ajouter les origines JavaScript autorisées : par exemple `http://localhost:5173`, l'origine exacte Vercel en HTTPS, ainsi que l'origine exacte de tout aperçu utilisé. Une origine ne contient aucun chemin. Ajouter explicitement les domaines d'aperçu que l'on souhaite utiliser.
4. Copier l'**identifiant client** (se terminant généralement par `.apps.googleusercontent.com`, ce n'est pas un secret) dans `VITE_GOOGLE_CLIENT_ID` dans `.env.local` pour le local, ou dans les variables d'environnement Vercel, puis redémarrer/redéployer. Ne pas exposer le secret du client OAuth.
5. Dans Paramètres, cliquer sur « Connecter Gmail », choisir le compte puis autoriser la lecture. Le navigateur doit autoriser la fenêtre de connexion ; si l'aperçu intégré la bloque, ouvrir directement l'URL du site déployé ou le site local.

Gmail utilise le flux de jeton Google Identity Services côté navigateur. L'accès est **en lecture seule**. Le jeton et les résumés sont gardés en sessionStorage dans l'onglet pour survivre aux rechargements, pas dans localStorage. Ce stockage est accessible aux scripts de la page ; des mesures contre les scripts malveillants sont importantes. La connexion doit être renouvelée à l'expiration du jeton ou après fermeture de la session de l'onglet. Déconnecter efface les données de l'interface ; pour retirer le consentement Google, utiliser les paramètres de sécurité de son compte Google. Le module Google Agenda n'est pas encore connecté. Un seul fournisseur (Gmail ou Outlook) peut être actif à la fois.

## Filtre Emmaüs

Les e-mails réels affichés sont filtrés sur le domaine exact de l'adresse d'expéditeur `@emmaus-scherwiller.fr` (sans sous-domaines). Pour Gmail, la recherche couvre les 72 dernières heures et les 50 premiers résultats au maximum après vérification du domaine. Les messages hors boîte de réception sont inclus, sauf spam et corbeille par défaut. Un avertissement signale les résultats supplémentaires non chargés. Pour Outlook, le filtre s'applique aux 15 derniers messages récupérés : il est donc possible qu'aucun e-mail ne s'affiche si les messages Emmaüs sont plus anciens. L'adresse affichée de l'expéditeur n'est pas à elle seule une garantie que l'e-mail est authentique. Les résumés IA sont demandés manuellement et transmettent le contenu des messages à Gemini.

## Analyse Gemini (préparée, à configurer et valider)

Le bouton « Analyser les 72 heures » envoie chaque e-mail trouvé à Google Gemini via la fonction `api/analyze.js` ; les résumés, actions et échéances sont rassemblés en un seul briefing. Chaque message entraîne une requête distincte auprès de Gemini. L'accès est limité au compte `ALLOWED_GOOGLE_EMAIL`, après validation de l'audience et de la portée du jeton Google ainsi que de l'adresse du profil Gmail. La fonction vérifie aussi le domaine expéditeur, récupère le message auprès de Gmail et ne transmet qu'un maximum de 12 000 caractères de texte, sans pièces jointes. L'adresse From est falsifiable et ne prouve pas l'authenticité d'un message. Les résultats de l'IA peuvent contenir des erreurs et sont à vérifier.

Dans Vercel ajouter `GEMINI_API_KEY` (variable serveur sensible, JAMAIS préfixée VITE_), `ALLOWED_GOOGLE_EMAIL` (votre adresse Gmail) et éventuellement `GEMINI_MODEL` (par défaut `gemini-3.1-flash-lite` ; disponibilité et quota à vérifier dans Google AI Studio). `VITE_GOOGLE_CLIENT_ID` doit aussi être défini. Redéployer. La clé Gemini doit être saisie directement dans Vercel et ne doit jamais être publiée dans Git ni collée dans une conversation.

Avant d'utiliser des courriels professionnels réels, vérifier l'autorisation de l'organisation et les conditions de traitement du fournisseur ; l'offre gratuite Gemini peut utiliser les données pour améliorer les produits de Google. Les limites de requêtes en mémoire de la fonction sont seulement indicatives, car les fonctions serverless ont plusieurs instances. Pour un usage réel fiable, ajouter une limitation distribuée et des plafonds de quota, surveiller les dépenses et examiner les exigences de sécurité et conformité. Le mode `npm run dev` de Vite ne lance pas les fonctions Vercel : utiliser Vercel CLI pour l'intégration locale ou une deployment de test.

Les actions extraites sont ajoutées automatiquement aux tâches locales. Les échéances avec date complète identifiable dans le texte sont ajoutées à l’agenda local, avec l’heure seulement si elle est explicitement reconnue ; les dates imprécises restent à vérifier. Les imports sont dédupliqués par message ; les tâches et échéances restent sur cet appareil.

### Connexion Gmail avec Nylas (Sandbox)

Le bouton Nylas utilise une connexion hébergée par Nylas, puis la confirmation Google. Il demande la lecture des messages uniquement et vérifie le compte et les autorisations côté serveur avant d'ouvrir la session. Le bouton Gmail classique reste disponible dans Paramètres. L'application ne modifie pas Google Agenda. Les tâches et échéances restent sur l'appareil.

Configurer dans l'environnement serveur les variables `NYLAS_API_KEY`, `NYLAS_CLIENT_ID`, `NYLAS_API_URI` (`https://api.eu.nylas.com` ou `https://api.us.nylas.com`), `NYLAS_SESSION_SECRET` (secret indépendant aléatoire d'au moins 32 caractères) et `ALLOWED_GOOGLE_EMAIL`. Ajouter `https://copilot-app-phi.vercel.app/api/nylas-callback` parmi les URL de retour Nylas. La session de l'appareil dure au maximum 30 jours ; Google ou Nylas peuvent demander de se reconnecter. Le bouton Déconnecter ferme uniquement la session locale : retirer l'accès depuis Nylas ou Google pour révoquer l'autorisation. Les permissions et l'utilisation avec des e-mails professionnels doivent être approuvées ; le Sandbox est une solution de test. Si une clé est exposée, la remplacer dans Nylas et dans Vercel avant de connecter des données réelles. La rotation du secret de session invalide les sessions existantes.
