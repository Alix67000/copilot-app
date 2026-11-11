# Période des e-mails et analyse après actualisation

## Architecte
Aucune planification ni traitement lorsque l'application est fermée. Dans Paramètres, la période des messages est 2, 24, 48 ou 72 heures (par défaut 72). Le réglage est local et synchronisé avec les autres réglages lorsque Firebase est activé ; il s'applique à la prochaine récupération, sans modification des données existantes. Le chargement à l'ouverture reste disponible, sans analyse automatique. Dans E-mails, « Actualiser » récupère les messages, puis lance automatiquement l'analyse IA des messages non encore analysés durant la session.

## Tech Lead
Le serveur valide la période autorisée pour la liste Nylas et l'analyse, sans étendre la fenêtre maximale existante de 72 heures. Filtre expéditeur exact maintenu et résultat limité à 50 messages, avec avertissement en cas de troncature. Verrou local empêchant les analyses et actualisations simultanées, anti-doublon d'import existant conservé, résultats mis en cache en session seulement. Les erreurs et quotas sont affichés et les messages non analysés peuvent être relancés ; pas de synchronisation des e-mails ou résumés. La transmission à Gemini est expliquée dans l'interface ; vérifier l'autorisation de l'organisation.

## Développeur
Période mémorisée avec les réglages des widgets. L'affichage indique la période effectivement récupérée plutôt qu'un réglage modifié depuis. L'analyse utilise une capture de la période associée aux résultats. En cas de déconnexion pendant l'analyse, les résultats ultérieurs sont ignorés. Pas de modification de Google Agenda.

## QA
Données fictives : sélection et persistance, respect de chaque période en API, périodes invalides et messages trop anciens refusés, analyse lancée par actualisation et non au démarrage, reprise après quota, doublons évités. Tests existants de synchronisation, sécurité, build et audit à relancer ; aucun e-mail réel consulté.
