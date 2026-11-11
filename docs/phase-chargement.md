# Chargement sans données d'exemple

## Architecte
Supprimer les e-mails et rendez-vous fictifs de l'interface : les données personnelles ne sont pas modifiées. Un indicateur accompagne l'initialisation, la vérification de la session et le chargement de la messagerie. Les données locales déjà disponibles restent accessibles pendant le chargement ; l'état non connecté, vide et l'erreur réseau restent distincts.

## Tech Lead
La session Nylas est asynchrone : tant qu'elle n'est pas vérifiée, ne pas afficher un état « non connecté » ou un compteur trompeur. Si la vérification échoue, signaler l'erreur au lieu d'inventer des données ou d'affirmer que la messagerie est déconnectée. Les e-mails affichés viennent exclusivement des réponses réelles de la messagerie et les échéances déjà stockées restent intactes.

## Développeur
Indicateurs animés accessibles avec `role=status`, prise en compte de `prefers-reduced-motion`, éléments masqués pour les lecteurs d'écran. Aucun changement de stockage ni des règles Firebase.

## QA
Vérifier en interface simulée : attente de la session, aucun contenu d'exemple, session absente, session valide avec données fictives, erreur réseau, pas de suppression des données locales ; tests de non-régression, build et audit. Aucun e-mail réel consulté.
