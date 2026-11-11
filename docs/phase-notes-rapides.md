# Widget Notes rapides

## Architecte
Ajouter un widget autonome de notes à la vue d'ensemble, avec réglage d'affichage dans Paramètres. Conserver les autres blocs et ne pas transmettre les notes à des services externes.

## Tech Lead
Notes stockées dans le navigateur local, non synchronisées, non chiffrées ; éviter les mots de passe ou informations sensibles. Ajouter, modifier et supprimer après confirmation ; masquer le widget ne supprime pas les notes. Limites : 200 notes et 2 000 caractères par note. En cas de données illisibles ou de stockage indisponible, éviter d'écraser les notes et afficher un avertissement.

## Développeur
Composant `src/widgets/QuickNotes.jsx`, stockage et validation séparés ; réglage d'affichage `notes` ajouté aux préférences avec visibilité activée par défaut pour conserver les anciennes configurations. Texte affiché par React sans insertion HTML.

## QA
Tests des opérations, de la validation, des préférences existantes et des erreurs de stockage ; interface simulée pour les opérations, le masquage et la persistance ; build et audit. Aucun accès aux e-mails réels pendant les vérifications.
