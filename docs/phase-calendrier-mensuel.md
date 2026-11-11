# Widget calendrier mensuel

## Architecte
Ajouter une vue mensuelle sur le tableau de bord sans remplacer le bloc « Mon agenda ». Les échéances internes et les tâches non terminées qui possèdent une date sont les sources de vérité ; aucun nouveau stockage métier et aucune modification de Google Agenda. Les rendez-vous Outlook déjà chargés, le cas échéant, apparaissent à leur date de début avec une mention explicite de leur fenêtre de chargement limitée (hier à 14 jours).

## Tech Lead
Grille du lundi au dimanche, navigation mois précédent/suivant et retour à aujourd’hui, sélection d’un jour pour voir les détails, distinction visuelle et textuelle des types. Dates internes interprétées comme dates locales, pas converties via UTC. Les rendez-vous Outlook avec fuseau sont convertis en heure locale, et les événements toute la journée restent des dates calendaires. Le paramètre de visibilité rejoint les réglages existants, ce qui assure rétrocompatibilité et synchronisation sans changer les règles Firebase.

## Développeur
Widget responsive avec boutons accessibles, état sélectionné et texte du jour ; données issues des états existants et mises à jour automatiquement par la synchronisation. Les notes et échéances ne sont ni modifiées ni effacées lorsqu’on masque le widget. État de synchronisation affiché si la liste est vide durant le chargement.

## QA
Tests unitaires de la grille, mois bissextiles, changement d’année, dates invalides et conversions ; interface simulée avec échéance et tâches fictives, sélection, navigation, masquage, réactivation et protection des données. Suite de tests de synchronisation, chargement, paramètres, build et audit ; aucun e-mail réel consulté.
