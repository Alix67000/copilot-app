# Calculatrice de devises

## Architecte
La saisie des montants EUR et USD est indépendante, initialisée à 1 et calculée localement à partir des taux existants. La saisie n'effectue aucune requête réseau et ne change pas les taux mémorisés. Le bouton Actualiser est inchangé. Les montants sont temporaires : à la fermeture du widget, ils reviennent à 1.

## Tech lead et développement
Deux champs étiquetés, utilisables au clavier mobile, acceptent virgule et point décimal, zéro et espaces dans les nombres. Montant vide ou invalide : aucun faux résultat ; erreur explicite pour les valeurs non vides invalides. Maximum 1 milliard pour limiter les imprécisions numériques et les nombres déraisonnablement grands. Montants et résultats sont indicatifs et arrondis selon la devise ; vérifier avant opération financière. Aucun changement d'API, de secrets, de synchronisation ou des autres widgets.

## QA
Unités : entrées valides, décimales, 0, espaces, caractères invalides et limite. UI simulée : calculs pour 150 EUR et 2,5 USD, montants indépendants, valeur vide ou invalide, zéro, aucune requête supplémentaire, conservation des résultats après erreur. Tests existants, compilation et audit. Aucun accès à de vrais e-mails ni appel Navasan pour les tests.
