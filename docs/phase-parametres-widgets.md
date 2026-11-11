# Paramètres des widgets

## Architecte
Tous les blocs existants de la vue d'ensemble sont configurables dans Paramètres. Les réglages d'affichage ne modifient ni les données ni les pages détaillées. Préserver les villes déjà choisies et le paramétrage des comptes.

## Tech Lead
Réglages locaux et indépendants des données, avec valeurs par défaut et validation des anciennes ou mauvaises données ; désactiver un widget n'efface rien. Isoler les composants de paramètres et de recherche de ville pour les futurs widgets. Aucune opération en arrière-plan d'analyse IA supplémentaire.

## Développeur
Cases pour les quatre compteurs, briefing, météo, e-mails, agenda et tâches ; ville météo modifiable même si le widget est masqué, degrés Celsius/Fahrenheit et fréquence de 15/30/60 minutes ou actualisation manuelle. Au retour sur la vue d'ensemble, la météo est chargée même si le mode manuel est choisi. Réglages enregistrés sur l'appareil, avertissement si stockage impossible.

## QA
Tests des valeurs par défaut, réglages corrompus, conservation locale, absence de stockage et conversion ; tests simulés météo, IA et Nylas, build et audit. Les paramètres n'effacent pas les tâches et ne changent pas le fonctionnement des pages détaillées. Les données météo proviennent toujours d'Open-Meteo, dont l'offre gratuite est réservée à l'usage non commercial.

Un test d'interface simulée a également vérifié le masquage, la conservation après rechargement, l'accès à la page E-mails, la ville conservée et l'affichage Fahrenheit.
