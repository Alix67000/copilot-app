# Architecture cible : synchronisation Firebase

Statut : implémentation et essais locaux réalisés ; publication des règles et test de connexion réelle par le propriétaire restent nécessaires. Les règles `docs/firestore-regles-v2.rules` remplacent le jeu précédent après remplacement de l’adresse autorisée.

## Architecte : frontières et données

Firebase Auth avec Google protège un espace par utilisateur, indépendant de la session Gmail/Nylas. Firestore héberge les données utilisateur, pas les messages e-mail, tokens, identifiants de session ni clés de service. Les tâches et échéances provenant d'une analyse peuvent contenir des informations extraites des messages : obtenir les autorisations organisationnelles appropriées. Les données ne sont pas chiffrées de bout en bout. Spark ne prévoit pas de frais, mais ses quotas sont limités : lorsqu'ils sont atteints, la synchronisation peut être interrompue.

Espace de noms dédié, pour ne pas interférer avec d'autres applications utilisant le même projet :

```
/pilotage_users/{uid}                           réservé pour un futur profil ; non utilisé actuellement
/pilotage_users/{uid}/notes/{noteId}            une note par document
/pilotage_users/{uid}/tasks/{taskId}            une tâche par document
/pilotage_users/{uid}/deadlines/{deadlineId}    une échéance interne par document
/pilotage_users/{uid}/imports/{importId}        suivi des imports, sans contenu d'e-mail
/pilotage_users/{uid}/settings/{settingId}      préférences par domaine : widgets, weather
```

Les collections futures sont indépendantes, avec leurs propres limites, schéma et règles ; une mise à jour de widget ne remplace pas les données d'un autre widget. Un nouvel emplacement exige règles et tests, jamais un joker public. Les documents ne doivent pas utiliser des chemins transmis arbitrairement par un client. Le document de profil n'est pas requis pour accéder aux sous-collections.

## Tech Lead : contrats et évolution

- Chaque document métier a une version de schéma et une révision par document ; son identifiant est stable, non réutilisé et sûr pour un chemin Firestore. Données et métadonnées minimales, taille bornée bien en deçà de la limite Firestore. Date serveur pour diagnostic uniquement ; ne jamais arbitrer les conflits selon l'horloge des appareils.
- Authentification par UID, compte Google vérifié et adresse autorisée. Règles explicites par collection, champs et tailles contrôlés ; refus par défaut. Tester les accès anonymes, autres comptes, autres UID, chemins et entrées mal formées avant publication. Les règles existantes de l'utilisateur doivent être respectées et mises à jour de manière ciblée.
- Toute opération d'édition utilise une transaction serveur comparant la révision attendue. Si le serveur a changé, ne pas écraser : récupérer, comparer la base, la version locale et la version distante ; fusionner seulement sans ambiguïté, sinon proposer une résolution explicite conservant les deux versions. Création par identifiant stable ; suppression par tombstone versionné pour empêcher une réapparition depuis un appareil hors ligne. La purge des tombstones nécessite un protocole ultérieur sûr et n'est pas automatique.
- Un schéma inconnu ou plus récent n'est pas modifié par un ancien client ; migrations explicites, idempotentes et testées, avec conservation d'une sauvegarde et lecture rétrocompatible pendant la transition. La base ne doit pas dépendre du numéro de version global de l'interface.
- Synchronisation en attente ou échec réseau/quota visible ; ne jamais annoncer « synchronisé » avant confirmation serveur. Éviter le polling constant : écoute Firestore avec gestion des écritures locales et des erreurs. Coûts et quotas évalués sur le nombre de documents/opérations ; gros contenus ou fichiers ne seront pas stockés dans les documents Firestore.
- Changement de compte sur un même appareil : ne pas transférer automatiquement les données locales ; isoler les états par UID, expliquer que la copie locale reste visible sur l'appareil après déconnexion et proposer les actions explicitement. Une synchronisation n'est pas une sauvegarde : prévoir l'export/restauration séparément.

## Développeur : migration du navigateur

Sources existantes : `pilotage.notes.v1`, `pilotage.tasks.v1`, `pilotage.deadlines.v1`, `pilotage.imported.v1`, `pilotage.widgets.v1`, `pilotage.weather.city.v1`. Avant migration, valider sans écraser les sources et proposer une sauvegarde exportable locale ; les données illisibles bloquent uniquement la catégorie concernée. Ne pas recopier les données de session.

Si données locales et distantes existent toutes deux, demander un choix clair : importer par identifiant avec détection de conflit, charger la version distante après sauvegarde, ou annuler. Pas de remplacement silencieux. Écritures document par document et idempotentes, avec reprise après échec : la copie locale est préservée. Un journal local détecte une interruption lors de l'application ; il bloque une reprise automatique dangereuse. L'export de sauvegarde n'a pas encore d'interface de restauration.

## QA : exigences de livraison

- Tests du modèle, des versions, des migrations, des limites et des suppressions, ainsi que des droits Firestore avec deux identités fictives et utilisateur non connecté.
- Interface simulée : données existantes sur un ou deux appareils, modifications parallèles, édition/suppression concurrentes, hors ligne puis retour, doublons/imports interrompus, plusieurs onglets et changement de compte, quotas et erreurs ; aucune donnée ni aucun e-mail réel pour les tests.
- Conserver les fonctionnalités existantes ; tests de non-régression, build, audit ; publication sélective après installation des règles définitives et vérification production.
