# Poste de pilotage informatique

Application personnelle React/Vite : e-mails Gmail via Nylas, briefing Gemini, tâches et échéances dans l'agenda interne. Outlook professionnel est prévu mais nécessite une configuration Microsoft séparée. Un seul compte à la fois.

## Utilisation

Ouvrir le site Vercel et se connecter avec le compte Google autorisé. Firebase utilise cette même connexion pour les données ; la synchronisation démarre automatiquement sur un navigateur vierge ou déjà associé. Si des données locales préexistent sans association, télécharger d'abord la sauvegarde et confirmer l'activation. Pour les e-mails, cliquer ensuite sur « Connecter Gmail avec Nylas » si nécessaire, puis valider l'autorisation Google séparée. L'application demande uniquement la lecture des e-mails. Si d'autres droits sont proposés, ne pas les accepter et vérifier la configuration. La session sur cet appareil dure au plus 30 jours, sous réserve de la validité de la connexion Google/Nylas. « Déconnecter » ferme la session sur cet appareil ; révoquer l'autorisation auprès de Nylas ou Google pour retirer complètement l'accès.

Dans Paramètres, choisir la période des messages du domaine exact `@emmaus-scherwiller.fr` : 2, 24, 48 ou 72 heures (72 par défaut). Le choix s'applique à la prochaine récupération ; au maximum 50 messages sont affichés, avec avertissement si d'autres existent. Les messages se chargent aussi à l'ouverture, sans analyse automatique. Dans E-mails, le bouton « Actualiser » récupère les messages puis lance automatiquement l'analyse des messages non encore analysés pendant cette session ; aucun traitement n'est planifié. Le bouton d'analyse manuelle reste disponible pour les reprises. Jusqu'à 12 000 caractères de chaque message sont transmis à Gemini, sans les pièces jointes. Les résultats et ajouts IA doivent être vérifiés. Les actions et les échéances avec date complète sont ajoutées aux tâches et à l'agenda de l'application. Une date sans heure reconnue apparaît sur toute la journée ; une date imprécise reste à vérifier. L'adresse d'expéditeur seule ne prouve pas l'authenticité d'un message.

Les tâches et échéances sont locales par défaut. Après activation, elles peuvent être synchronisées avec Firebase. Google Agenda n'est pas modifié. Avant d'utiliser des données professionnelles, vérifier l'autorisation de l'organisation et les conditions applicables à Nylas et Gemini. Le compte Nylas est actuellement un **Sandbox de test** ; ses limites, ses autorisations et l'usage réel restent à valider.

## Installation et configuration

Node 20 ou plus : `npm install`, puis `npm run dev` ou `npm run build`. Vite seul ne lance pas les fonctions de l'API ; utiliser Vercel CLI ou un environnement Vercel pour tester l'intégration complète. Les variables `VITE_` sont exposées dans le navigateur : n'y placer aucun secret.

Côté serveur, configurer `NYLAS_API_KEY`, `NYLAS_CLIENT_ID`, `NYLAS_API_URI`, `NYLAS_SESSION_SECRET` (secret indépendant et aléatoire d'au moins 32 caractères), `ALLOWED_GOOGLE_EMAIL`, `NAVASAN_API_KEY`, `GEMINI_API_KEY` et éventuellement `GEMINI_MODEL`. Ne jamais envoyer `.env.local` ou ces secrets dans Git. La clé Gemini de production est configurée dans Vercel. La rotation du secret de session déconnecte les appareils.

Le callback Nylas pour le site actuel est `https://copilot-app-phi.vercel.app/api/nylas-callback`. L'authentification utilise PKCE, un état signé et une session signée dans un cookie HttpOnly/Secure ; la clé Nylas reste côté serveur. Le serveur vérifie le compte, les permissions obtenues, l'expéditeur et la période de chaque message. La limite en mémoire des analyses ne remplace pas une limitation distribuée.

## Sécurité des clés

Gemini est appelé uniquement par `api/analyze.js` : `GEMINI_API_KEY` est une variable d’environnement côté serveur, sans préfixe `VITE_`, et n’est jamais renvoyée au navigateur. L’API vérifie l’accès à l’application, la session Nylas, l’origine et l’expéditeur. Le build échoue si un secret serveur disponible est détecté dans les fichiers publics, si une variable sensible `VITE_` est définie ou si l’adresse directe de l’API Gemini apparaît dans le bundle. Si `GEMINI_API_KEY` n’est pas disponible pendant le build, sa valeur ne peut pas être comparée : le message l’indique. Ces vérifications ne remplacent pas la rotation et les restrictions des clés.

La configuration Web Firebase contient une clé API publique, nécessaire au SDK du navigateur : ce n’est pas par elle que l’API Gemini est appelée. Elle doit être restreinte aux seules API Firebase nécessaires dans Google Cloud ; les données sont protégées par Firebase Authentication et les règles Firestore, et non par le secret de cette clé publique. Une clé Gemini ne doit pas être réutilisée comme clé Firebase publique. Faire tourner toute clé sensible déjà partagée ou exposée, la mettre à jour dans les variables serveur de Vercel, redéployer et révoquer l’ancienne après vérification. Ne jamais la publier dans Git ni la partager dans une conversation.

## Tests

`node --test tests/*.test.js`, `node tests/sync-ui.cjs`, `node tests/loading-ui.cjs`, `node tests/email-refresh-ui.cjs`, `node tests/settings-save-ui.cjs`, `node tests/month-calendar-ui.cjs`, `npm run build`, `npm audit`. Les tests utilisent des données fictives. Pour les règles, installer temporairement les outils avec `npm install --no-save --package-lock=false firebase-tools@13.35.1 @firebase/rules-unit-testing@5`, puis `npx firebase emulators:exec --project demo-pilotage-tests --config tests/firebase-emulator.json --only firestore 'node tests/firestore-rules.emulator.cjs && node tests/sync-firestore.emulator.mjs'`. Ces tests utilisent exclusivement le projet fictif et l'émulateur local. Tester la connexion réelle uniquement avec le propriétaire ; ne pas consulter d'e-mails réels pour les essais.

À l’ouverture, les indicateurs de chargement remplacent les anciens e-mails et rendez-vous d’exemple. Si la messagerie n’est pas connectée ou si la vérification échoue, un message distinct apparaît ; les données déjà enregistrées ne sont pas supprimées.

## Widget météo

Depuis la vue d’ensemble, choisir une ville ; les résultats proposent la région et le pays pour distinguer les homonymes. La ville est mémorisée dans le navigateur et synchronisée si la synchronisation est activée. Les requêtes de recherche et les coordonnées sont envoyées à Open-Meteo directement par le navigateur, sans partager les e-mails ni les tâches. Conditions actuelles et prévisions sur trois jours, actualisation à l'ouverture, à une fréquence configurable tant que la vue est ouverte, ainsi qu'à la demande. Données : Open-Meteo, CC BY 4.0, températures arrondies. L'API gratuite est réservée à l'usage non commercial ; vérifier les conditions pour un usage professionnel/commercial.

### Réglages des widgets

Dans Paramètres → Widgets du tableau de bord : afficher ou masquer chaque compteur et les widgets météo, calendrier mensuel, briefing, e-mails, agenda et tâches. Les modifications dans ce panneau restent en brouillon tant que le bouton « Enregistrer les modifications » n’est pas utilisé ; une fenêtre demande confirmation et récapitule les changements, puis une coche confirme l’enregistrement local, distinct de l’état de synchronisation Firebase. Le bouton se trouve en bas de la page Paramètres. Le brouillon reste présent en naviguant dans l’application ; une modification concurrente depuis un autre appareil est signalée et ne peut pas être écrasée silencieusement. En cas d’échec de stockage, le brouillon reste à l’écran. L'affichage des pages détaillées et les données restent inchangés. Dans les paramètres météo, choisir la ville, les degrés Celsius ou Fahrenheit et un intervalle de 15, 30 ou 60 minutes, ou désactiver l'actualisation automatique. Un chargement reste effectué à l'ouverture de la vue, et le bouton d'actualisation manuelle reste disponible. Ces réglages sont locaux par défaut et synchronisés si la synchronisation est activée ; la ville déjà choisie est conservée.

## Calendrier mensuel

Sur la vue d’ensemble, le calendrier présente les échéances internes et les tâches datées non terminées. Sélectionner un jour pour voir son détail, parcourir les mois avec les flèches ou revenir à aujourd’hui. Il ne modifie pas Google Agenda. Si Outlook est configuré, seuls les rendez-vous chargés entre hier et dans 14 jours sont affichés à leur date de début. Le widget peut être masqué et réaffiché dans Paramètres sans supprimer les données ; sa visibilité suit la synchronisation des autres réglages.

## Notes rapides

Le widget Notes rapides permet d'ajouter, modifier et supprimer des notes dans la vue d'ensemble ; il peut être masqué dans Paramètres sans les effacer. Les notes sont stockées sur l'appareil et synchronisées dans Firebase si la synchronisation est activée. Elles ne sont pas chiffrées de bout en bout : ne pas y enregistrer de mots de passe ou de données sensibles. Limite de 200 notes de 2 000 caractères chacune. Effacer les données du navigateur peut les supprimer.


## Synchronisation Firebase

La connexion à l'application utilise le même compte Firebase et ne demande aucun accès Gmail. Sur un navigateur vierge, la synchronisation démarre automatiquement ; si des données locales préexistent sans association, télécharger la sauvegarde locale puis confirmer l'activation dans Paramètres. Les notes, tâches, échéances internes, identifiants d'imports et préférences de widgets/météo sont synchronisés. Les e-mails, sessions et clés ne le sont pas. Les tâches ou échéances générées par IA peuvent contenir des données issues d'e-mails : vérifier l'autorisation de l'organisation.

Les données locales sont conservées en cas de coupure ; les opérations sont confirmées par le serveur. En cas de conflit, télécharger les deux versions et choisir laquelle garder. Une erreur d'application locale ou un journal de récupération bloque la synchronisation ; ne pas effacer le stockage. La copie sur le navigateur reste accessible localement après déconnexion, notamment via les outils du navigateur : éviter les appareils partagés. Il faut une connexion Internet pour ouvrir l'application. Un changement de compte ne transfère pas les données locales. Cette synchronisation ne remplace pas une sauvegarde ; l'export JSON est sensible et non chiffré, à conserver dans un lieu sûr. L'interface de restauration n'est pas encore disponible.

Le projet utilise Spark et ses quotas gratuits. S'ils sont dépassés, les opérations peuvent échouer ou attendre ; aucune souscription payante n'est activée. Les règles `docs/firestore-regles-v2.rules` exigent que le propriétaire remplace l'adresse indiquée puis les publie dans Firebase. Sans elles l'accès Firestore est refusé. Voir `docs/architecture-firebase.md` pour le modèle, les limites et les évolutions.

La session applicative est distincte de la session Nylas. Elle est signée côté serveur, limitée à une heure et renouvelée pendant la session Google ; les API sont contrôlées côté serveur. La déconnexion efface les cookies de cet appareil sans révoquer l’autorisation Nylas. La révocation Firebase n’est pas vérifiée en temps réel : un cookie déjà émis peut rester valable jusqu’à son expiration. Voir `docs/phase-acces-google.md`.

### Taux de change Navasan

Le widget affiche les conversions pour 1 EUR et 1 USD vers USD/EUR, AFN et IRR. Aucun appel Navasan n'est effectué à l'ouverture : « Actualiser » déclenche une seule requête serveur au fournisseur. Le dernier résultat est conservé localement sur l'appareil, pas synchronisé avec Firebase. Une erreur ou un quota épuisé conserve les derniers taux. Le fournisseur annonce 120 requêtes mensuelles en formule gratuite et des cours mis à jour toutes les deux heures (conditions susceptibles de changer, durée de validité de la formule à vérifier auprès du fournisseur). La protection anti-double appel du serveur est en mémoire et limitée à chaque instance, elle ne garantit pas le respect d'un quota global.

La clé `NAVASAN_API_KEY` doit être configurée côté serveur dans Vercel, jamais dans une variable `VITE_` ni dans Git. L'API requiert la session Google de l'application et une origine autorisée, ne retourne que les trois cours nécessaires et ne journalise pas l'URL fournisseur contenant la clé. Les cours espèces Navasan `usd`, `eur`, `afn` sont exprimés en tomans, convertis en IRR au facteur 10 ; les conversions croisées sont indicatives, pas des prix garantis. Les horodatages proviennent du fournisseur : le widget affiche la plus ancienne des trois cotations utilisées, distincte du moment de récupération. Consulter [Navasan](https://www.navasan.tech/en/api) pour les conditions et vérifier les cours avant une opération financière.
