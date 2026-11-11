# Affichage en tomans

## Architecte
Remplacer les résultats en rials iraniens par des tomans pour les deux bases EUR et USD, sans changer les autres devises ni le calculateur. Les taux déjà enregistrés sur l'appareil restent compatibles et aucun nouvel appel Navasan n'est nécessaire.

## Tech lead et développeur
Les valeurs `usd` et `eur` enregistrées en cache sont déjà des prix vendeur espèces en tomans. Les afficher directement, sans le facteur 10 utilisé auparavant pour les rials. Le libellé indique « Toman iranien », avec le rappel qu'un toman vaut dix rials. Les ratios croisés USD/EUR et AFN sont inchangés ; les résultats demeurent indicatifs et arrondis à l'unité de toman. Le stockage, l'authentification et l'API ne changent pas.

## QA
Données fictives : vérifier le montant 1 et des montants saisis dans les deux devises, contrôle du facteur 10, tests des autres devises et du cache antérieur sans requête. Tests existants, compilation et audit. Aucune consultation de vrais e-mails ni requête au fournisseur pour cette modification.
