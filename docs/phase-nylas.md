# Intégration Nylas : étapes et limites

## Architecte
OAuth hébergé Nylas avec vérification d'état et PKCE, clé Nylas gardée côté serveur et cookie de session HttpOnly, Secure, SameSite, signé avec un secret distinct. Connexion réservée à l'adresse autorisée, validée en lecture seule après l'autorisation par Google. Le champ From et la date sont vérifiés côté serveur avant l'analyse Gemini ; aucune pièce jointe n'est analysée.

## Tech Lead
Maintenir Gmail direct comme solution de repli, ne pas changer Google Agenda, conserver tâches et échéances locales. Récupérer au plus 50 messages et reprendre les imports par ID. Autorisation Nylas distincte de la session locale ; la déconnexion de l'appareil n'est pas une révocation du grant Nylas. Une vraie révocation passe par Nylas/Google.

## Développement
Fonctions `api/nylas.js`, `api/nylas-callback.js`, logique commune `server/nylas.js`, adaptation API Gemini et interface. L'URL de retour est enregistrée dans le Sandbox Nylas EU. Variables serveur : NYLAS_API_KEY, NYLAS_CLIENT_ID, NYLAS_API_URI, NYLAS_SESSION_SECRET, ALLOWED_GOOGLE_EMAIL et GEMINI_API_KEY. Aucun secret dans le code source. Session de 30 jours maximum, sous réserve que le grant reste valide. Rotation du secret de session invalide les sessions.

## QA et limites
`node --test tests/*.test.js`, `npm run build`, `npm audit`. Tests simulés : états OAuth, PKCE, signature des cookies, autorisations minimales, filtrage des expéditeurs et date, analyse IA, protection de déconnexion. Le flux réel nécessite l'accord Google du propriétaire ; il n'a pas encore été testé avec sa boîte Gmail. Vérifier en particulier si le Sandbox permet bien gmail.readonly sans permissions supplémentaires. Le Sandbox est destiné aux essais, non à garantir un usage stable en production ; vérifier les limitations et conditions Nylas. Le jeton d'accès Nylas doit être remplacé après exposition dans le chat avant utilisation de données réelles ; l'autorisation organisationnelle pour Nylas et Gemini n'a pas été vérifiée. Une clé API compromise donne accès aux comptes connectés, indépendamment du cookie de l'application.
