# Sécurité de l’accès Gemini

## Architecte
L'application appelle Gemini depuis `api/analyze.js` seulement. Le navigateur appelle cette fonction après authentification applicative et connexion Nylas ; la clé serveur n'est pas renvoyée au client. La configuration Firebase Web contient une clé publique distincte qui sert au SDK Firebase. Ses restrictions d'API doivent être configurées dans Google Cloud ; les règles Firestore et Auth restent indispensables.

## Tech Lead
Séparer les clés Web et serveur, ne jamais nommer un secret `VITE_*`. Un contrôle en fin de build refuse toute occurrence des secrets disponibles dans les assets publics et tout accès direct à l'API Gemini. Si la clé serveur n'est pas présente dans le contexte de compilation, sa valeur ne peut pas être comparée ; le contrôle ne remplace ni l'audit des secrets, ni la restriction des API, ni une rotation. Ne jamais afficher la valeur d'un secret dans les diagnostics.

## Développeur
La fonction d'analyse préexistante conserve l'autorisation d'origine, l'authentification, les limites et le filtrage expéditeur. Le contrôle n'entrave ni Firebase ni la synchronisation. Ne pas supprimer la clé de configuration Web Firebase : le navigateur en a besoin.

## QA
Tester le contrôle avec de fausses clés, un faux accès direct, une variable Vite interdite, puis la suite de tests et le build. Comparer les assets produits à la clé serveur dans l'environnement Vercel uniquement si elle est disponible au build. Vérifier les API sans session et sans consulter d'e-mails. L'absence d'une fuite détectée ne permet pas d'affirmer qu'une ancienne clé est restée secrète ; la clé Gemini précédemment partagée doit être renouvelée.
