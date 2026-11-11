# Liens utiles

## Architecte
Widget personnalisable, initialement vide, permettant de saisir, ouvrir, modifier et supprimer des liens web. Synchronisation par enregistrement dans la nouvelle collection Firestore `links` ; aucun e-mail, jeton ou résumé n'est synchronisé. La visibilité du bloc est réglable avec confirmation dans les paramètres. Les données locales sont incluses dans les sauvegardes existantes.

## Tech lead
Les règles Firestore v3 doivent être publiées **avant** le nouveau code : sinon le refus d'accès à `links` bloque la synchronisation des autres collections. Les règles v3 sont une extension des règles v2. Ne pas écraser d'éventuelles règles personnalisées ; les conserver et fusionner l'ajout. Le modèle public utilise un identifiant de compte fictif ; une copie locale personnalisée est fournie à l'utilisateur. Accès uniquement au même utilisateur Google autorisé, révision et tombstones comme pour les autres données. Maximum 200 liens, titre de 100 caractères, adresse de 2048 caractères, uniquement HTTP/HTTPS sans nom d'utilisateur ni mot de passe. Si le protocole manque, HTTPS est ajouté. Les liens s'ouvrent dans un nouvel onglet isolé ; aucune requête à des services de favicon, pas de récupération automatique de contenu externe. Les URL peuvent toutefois contenir des informations sensibles : ne pas y stocker de jetons ; la sync n'est pas chiffrée de bout en bout.

## Développement
`pilotage.links.v1` stocke les liens ; synchronisation et contrôle de conflits utilisent le mécanisme existant. Contrôle de données corrompues et refus d'écrasement. Un lien modifié ou supprimé pendant l'édition est signalé sans effacer le brouillon ; suppression confirmée. Sauvegarde locale et détection du premier appareil étendues. Aucune donnée exemple.

## QA
Tests de validation d'URL, stockage corrompu, CRUD et brouillon, double appareil et conflits, visibilité et synchronisation. Règles testées sur émulateur avec données fictives (authentification, isolation, format, révisions et suppression). Pas de consultation de vrais e-mails. Publication effective des règles en production à confirmer par l'utilisateur avant de publier l'application.
