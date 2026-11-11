# Accès Google à l'application

## Architecte
L'accès à l'interface exige l'identité Firebase Authentication avec le fournisseur Google. Le compte Google confirmé par le propriétaire est aussi celui qui est autorisé pour Nylas et par les règles Firestore. L'authentification applicative est distincte de l'autorisation de lecture Gmail via Nylas : le compte Nylas doit toujours être connecté et son autorisation peut expirer.

## Tech Lead
- Le navigateur envoie un jeton d'identité Firebase au serveur HTTPS. Le serveur valide la signature RS256 par les clés publiques Secure Token de Google, le projet, l'émetteur, la durée et les dates, l'UID, l'adresse autorisée, la vérification de l'adresse et le fournisseur Google. La clé Firebase Web n'est pas secrète. Aucun identifiant Firebase Admin ni clé de service n'est nécessaire.
- Une session serveur signée, HttpOnly, Secure, SameSite=Lax, est limitée à l'expiration du jeton et au plus une heure. Elle est renouvelée pendant l'utilisation et contrôlée sur les fonctions Nylas, callback et analyse. L'origine des requêtes POST sensibles est vérifiée. La déconnexion efface les cookies applicatif et Nylas sur l'appareil, mais ne révoque pas le grant Nylas.
- La vérification de révocation Firebase côté serveur n'est pas activée : un cookie déjà émis reste valable au plus jusqu'à son expiration. Pour invalider immédiatement tous les cookies, il faut remplacer le secret de signature ; cela déconnecte également Nylas. Les fichiers JS publics ne sont pas secrets, et cette protection ne chiffre pas les copies locales de l'appareil.
- Première synchronisation d'un navigateur vierge : automatique après connexion. Si des données locales préexistent et ne sont pas déjà associées à un compte, une sauvegarde et une activation explicite restent requises pour éviter un transfert involontaire. Les comptes distincts ne sont pas fusionnés.
- L'accès au démarrage exige Internet pour vérifier l'identité auprès du serveur. Spark ne crée aucun abonnement payant ; le service s'arrête ou limite les opérations en cas de dépassement de quota.

## Développeur et QA
Tests automatisés avec identités, certificats et courriels fictifs : signatures et claims invalides, accès sans session, requêtes d'origine refusée, déconnexion, connexion Nylas simulée, synchronisation et interface ; aucun e-mail réel consulté. Tester la connexion réelle uniquement avec le propriétaire. Les règles Firestore existantes restent nécessaires et inchangées.
