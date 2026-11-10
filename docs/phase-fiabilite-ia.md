# Fiabilité de l'analyse Gemini

## Architecte
Ne pas exposer les données des e-mails ou les secrets dans les diagnostics. Distinguer les erreurs globales (quota, autorisation, modèle ou service) des erreurs propres à un message. Conserver les résultats partiels et les imports antérieurs.

## Tech Lead
Limiter les interruptions inutiles : sauter les messages vides, bloqués ou dont la réponse est incomplète, et poursuivre les suivants. L'utilisateur peut réessayer les messages non traités. Une erreur globale arrête le traitement pour éviter des appels inutiles. Ne pas modifier les protections d'accès.

## Développeur
Augmenter la limite de sortie à 4096 tokens et utiliser le niveau de raisonnement MINIMAL sur le modèle Gemini 3.1 Flash Lite. Vérifier le motif de fin et le JSON ; afficher une erreur compréhensible et sans données sensibles. Les e-mails échoués restent non analysés et ne sont pas importés.

## QA
Tests simulés pour la sortie normale, une sortie tronquée, le JSON invalide, le quota et l'autorisation. Build et audit. Tests sans e-mails réels. La cause de l'incident signalé est inconnue sans diagnostic de son appel ; l'augmentation de la limite réduit les troncatures mais ne garantit pas le succès de tous les e-mails.
