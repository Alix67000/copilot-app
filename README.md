# Poste de pilotage informatique

Application personnelle React/Vite : e-mails Gmail via Nylas, briefing Gemini, tâches et échéances dans l'agenda interne. Outlook professionnel est prévu mais nécessite une configuration Microsoft séparée. Un seul compte à la fois.

## Utilisation

Ouvrir le site Vercel, cliquer sur « Connecter Gmail avec Nylas », puis valider la connexion Google avec le compte autorisé. L'application demande uniquement la lecture des e-mails. Si d'autres droits sont proposés, ne pas les accepter et vérifier la configuration. La session sur cet appareil dure au plus 30 jours, sous réserve de la validité de la connexion Google/Nylas. « Déconnecter » ferme la session sur cet appareil ; révoquer l'autorisation auprès de Nylas ou Google pour retirer complètement l'accès.

Les messages du domaine exact `@emmaus-scherwiller.fr` des dernières 72 heures sont affichés (jusqu'à 50 messages, avec avertissement si d'autres existent). L'analyse démarre manuellement et transmet jusqu'à 12 000 caractères de chaque message à Gemini, sans les pièces jointes. Les résultats et ajouts IA doivent être vérifiés. Les actions et les échéances avec date complète sont ajoutées aux tâches et à l'agenda de l'application. Une date sans heure reconnue apparaît sur toute la journée ; une date imprécise reste à vérifier. L'adresse d'expéditeur seule ne prouve pas l'authenticité d'un message.

Les tâches et échéances restent sur cet appareil et ne sont pas synchronisées. Google Agenda n'est pas modifié. Avant d'utiliser des données professionnelles, vérifier l'autorisation de l'organisation et les conditions applicables à Nylas et Gemini. Le compte Nylas est actuellement un **Sandbox de test** ; ses limites, ses autorisations et l'usage réel restent à valider.

## Installation et configuration

Node 20 ou plus : `npm install`, puis `npm run dev` ou `npm run build`. Vite seul ne lance pas les fonctions de l'API ; utiliser Vercel CLI ou un environnement Vercel pour tester l'intégration complète. Les variables `VITE_` sont exposées dans le navigateur : n'y placer aucun secret.

Côté serveur, configurer `NYLAS_API_KEY`, `NYLAS_CLIENT_ID`, `NYLAS_API_URI`, `NYLAS_SESSION_SECRET` (secret indépendant et aléatoire d'au moins 32 caractères), `ALLOWED_GOOGLE_EMAIL`, `GEMINI_API_KEY` et éventuellement `GEMINI_MODEL`. Ne jamais envoyer `.env.local` ou ces secrets dans Git. La clé Gemini de production est configurée dans Vercel. La rotation du secret de session déconnecte les appareils.

Le callback Nylas pour le site actuel est `https://copilot-app-phi.vercel.app/api/nylas-callback`. L'authentification utilise PKCE, un état signé et une session signée dans un cookie HttpOnly/Secure ; la clé Nylas reste côté serveur. Le serveur vérifie le compte, les permissions obtenues, l'expéditeur et la période de chaque message. La limite en mémoire des analyses ne remplace pas une limitation distribuée.

## Tests

`node --test tests/*.test.js`, `npm run build`, `npm audit`. Ces tests simulent Nylas et Gemini, sans boîte réelle. Un test réel de la connexion et de l'analyse est à réaliser par le propriétaire. Aucune base n'est nécessaire dans cette version ; une sauvegarde/synchronisation future demandera une conception et une authentification adaptées.

## Widget météo

Depuis la vue d’ensemble, choisir une ville ; les résultats proposent la région et le pays pour distinguer les homonymes. La ville est mémorisée uniquement dans le navigateur. Les requêtes de recherche et les coordonnées sont envoyées à Open-Meteo directement par le navigateur, sans partager les e-mails ni les tâches. Conditions actuelles et prévisions sur trois jours, actualisation à l'ouverture, à une fréquence configurable tant que la vue est ouverte, ainsi qu'à la demande. Données : Open-Meteo, CC BY 4.0, températures arrondies. L'API gratuite est réservée à l'usage non commercial ; vérifier les conditions pour un usage professionnel/commercial.

### Réglages des widgets

Dans Paramètres → Widgets du tableau de bord : afficher ou masquer chaque compteur et les widgets météo, briefing, e-mails, agenda et tâches. L'affichage des pages détaillées et les données restent inchangés. Dans les paramètres météo, choisir la ville, les degrés Celsius ou Fahrenheit et un intervalle de 15, 30 ou 60 minutes, ou désactiver l'actualisation automatique. Un chargement reste effectué à l'ouverture de la vue, et le bouton d'actualisation manuelle reste disponible. Tous ces réglages restent propres au navigateur ; la ville déjà choisie est conservée.

## Notes rapides

Le widget Notes rapides permet d'ajouter, modifier et supprimer des notes dans la vue d'ensemble ; il peut être masqué dans Paramètres sans les effacer. Les notes sont stockées sur l'appareil, dans le navigateur, sans synchronisation ni sauvegarde cloud. Elles ne sont pas chiffrées : ne pas y enregistrer de mots de passe ou de données sensibles. Limite de 200 notes de 2 000 caractères chacune. Effacer les données du navigateur peut les supprimer.
