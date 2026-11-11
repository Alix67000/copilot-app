# Correctif du défi de connexion Nylas

## Architecte
La vérification PKCE a été refusée par Nylas après le consentement. Conserver l'état anti-CSRF signé, le vérificateur aléatoire, la durée limitée et la vérification des autorisations ; ne pas enlever la vérification.

## Tech Lead
Le SDK Node officiel de Nylas utilise une variante spécifique : SHA-256 encodé en hexadécimal minuscule, puis cet hexadécimal encodé en Base64 sans padding ; `code_challenge_method=s256`. Ce n'est pas l'encodage S256 standard RFC 7636 initialement utilisé. Référence : https://github.com/nylas/nylas-nodejs/blob/main/src/resources/auth.ts et exemple Nylas https://developer.nylas.com/docs/v3/auth/hosted-oauth-accesstoken/. L'alignement constitue une hypothèse de correction à vérifier sur l'API réelle, pas une garantie.

## Développeur
Utiliser la même transformation que le SDK Nylas et transmettre au callback le même vérificateur aléatoire conservé dans le cookie d'état signé, sans l'enregistrer dans les journaux.

## QA
Tester le vecteur publié `nylas`, l'égalité entre le défi envoyé et la transformation du vérificateur conservé, et l'envoi du même vérificateur lors de l'échange simulé. Tests, build et audit ; le consentement réel et les permissions nécessitent un essai du propriétaire sans lecture de ses messages.
