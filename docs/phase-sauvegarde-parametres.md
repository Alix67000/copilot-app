# Sauvegarde explicite des paramètres

## Architecte
Les paramètres d'affichage, la période des e-mails et les paramètres météo disposent d'un bouton « Enregistrer les modifications ». Les réglages en cours sont conservés comme brouillon lors de la navigation dans l'application. Les autres opérations comme la connexion, la synchronisation ou les notes gardent leurs commandes indépendantes.

## Tech Lead
Un message confirme l'enregistrement local, distinct de la synchronisation Firebase. Les changements distants ou d'un autre onglet sont détectés pendant l'édition pour empêcher les écrasements ; le brouillon reste visible et peut être abandonné explicitement. Un avertissement de navigation du navigateur est demandé en cas de brouillon non enregistré. Si le stockage échoue, aucune réussite n'est annoncée. Deux clés de stockage sont mises à jour si nécessaire ; en cas d'échec de la deuxième écriture, un retour arrière est tenté et une éventuelle sauvegarde partielle est signalée.

## Développeur
Les réglages prennent effet lors de la sauvegarde, pas pendant la modification. Le choix d'une ville depuis le widget météo de la vue principale conserve son fonctionnement existant. La synchronisation utilise les mêmes clés et règles qu'avant ; aucune suppression de données existantes.

## QA
Interface simulée avec données fictives : sauvegarde et confirmation, application différée, brouillon préservé lors de la navigation, panne de stockage et nouvelle tentative, ville météo, conflit avec un autre onglet. Tests existants de synchronisation, messagerie, build et audit.

## Amélioration UX/UI
Le bouton se trouve en bas de la page complète des paramètres. Une fenêtre de confirmation récapitule les modifications, permet d’annuler ou de confirmer et prend en charge le clavier. Pendant l’opération, un indicateur est affiché ; une confirmation avec coche ne concerne que la sauvegarde sur l’appareil, pas la synchronisation distante. En cas de conflit ou d’erreur, aucune confirmation de réussite n’est affichée.
