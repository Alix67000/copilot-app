# Connexion Gmail via Nylas uniquement

## Architecte
Supprimer l'ancien parcours direct Gmail côté interface et côté API ; préserver l'authentification Nylas, le compte autorisé, les contrôles de permissions, les 72 heures, les tâches et l'agenda interne. Conserver Outlook en attente de configuration distincte.

## Tech Lead
Séparer les clés serveur du navigateur et exclure `.env.local` du dépôt et des archives. La déconnexion efface la session locale, sans révoquer le grant distant. Documentation et tests alignés sur le nouveau parcours ; l'état réel du Sandbox ne peut être confirmé sans connexion Google par le propriétaire.

## Développement
Retrait de Google Identity Services et du chemin d'accès Gmail direct, y compris pour la fonction Gemini. Variables serveur Nylas dans `.env.example` sans valeurs ; les secrets disponibles de l'utilisateur sont conservés localement dans `.env.local` hors Git et configurés côté Vercel selon leur disponibilité.

## QA
Tests simulés : absence de session, session altérée ou autre compte, permissions trop larges, PKCE, filtrage expéditeur/période, analyse et erreurs Gemini. Build et audit. Vérifier ensuite en conditions réelles si Nylas Sandbox accorde effectivement la seule lecture et si le parcours fonctionne ; ne pas promettre une connexion permanente ou une validation de conformité.
