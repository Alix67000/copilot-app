# Widget météo

## Architecte
Premier widget indépendant sur la vue d'ensemble. Ville choisie manuellement, sans géolocalisation ; la ville et ses coordonnées sont enregistrées uniquement dans le navigateur. L'e-mail, les tâches et l'agenda ne sont pas transmis au service météo.

## Tech Lead
Open-Meteo pour la recherche et les prévisions, sans clé ni abonnement activé. La recherche et les coordonnées sont transmises directement à Open-Meteo depuis le navigateur ; attribution et licence figurent dans le widget. L'offre gratuite est réservée à l'usage non commercial : vérifier les conditions si utilisation professionnelle/commerciale. Météo actuelle, ressenti, vent et prévisions de trois jours, mises à jour au chargement, manuellement ou toutes les 30 minutes lorsque le widget est ouvert. La température est arrondie et l'heure est celle de la ville.

## Développeur
Composant isolé `src/widgets/Weather.jsx` et fonctions `weather.js` ; recherche de ville avec choix parmi les homonymes, mémorisation locale et gestion des erreurs. Pas de coordonnées ou ville par défaut imposées.

## QA
Tests unitaires simulés du géocodage, de la météo, des erreurs et des conditions. Tests des API réelles avec coordonnées publiques et sans accès à la messagerie, vérification CORS ; build et audit ; vérifier aussi affichage et interactions du widget sur écran étroit.
