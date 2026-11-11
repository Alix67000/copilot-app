# Diagnostic du retour Nylas

- Architecte : distinguer les étapes du retour OAuth sans divulguer le code d'autorisation, le cookie, le grant, les adresses ou les messages.
- Tech Lead : conserver les vérifications d'état, PKCE, compte et permissions ; codes de diagnostic génériques prédéfinis. Les journaux indiquent uniquement l'étape et le statut HTTP pour l'échange et la vérification du grant.
- Développeur : messages distincts selon session, refus, erreur fournisseur, code absent, échange Nylas, grant invalide ou vérification indisponible. Aucune donnée OAuth brute n'est renvoyée dans l'URL.
- QA : tests simulés de chaque étape, tests de sécurité existants, build et audit. Le diagnostic n'est pas une correction de la cause inconnue ; le parcours réel exige un nouvel essai du propriétaire.
