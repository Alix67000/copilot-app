# Phase 72 heures : architecture, plan, implémentation et QA

## 1. Architecte
- Gmail en lecture seule, recherche des 72 heures glissantes puis vérification de l'expéditeur et de la date côté serveur. Gmail renvoie au plus 50 messages ; l'interface avertit lorsqu'il y en a d'autres.
- L'analyse se déclenche par un clic explicite, chaque e-mail est envoyé à Gemini et les résultats sont regroupés en une synthèse. La clé Gemini reste côté fonction serveur.
- Les tâches et échéances créées sont locales au navigateur, sans modifications de Google Agenda et sans base de données. Les données et jetons sont accessibles aux scripts de la page : une protection renforcée contre XSS et une sauvegarde synchronisée sont nécessaires avant un usage plus sensible.
- L'IA peut se tromper ; les dates sont créées seulement si une date complète (jour, mois, année) est littéralement présente dans le texte et comprise par l'analyseur. Les autres sont marquées à vérifier. L'identité d'un expéditeur peut être usurpée.

## 2. Tech Lead
1. Adapter le filtre des 7 jours aux 72 heures glissantes ; accepter au plus 50 résultats, alerter si incomplet.
2. Extraire les actions et échéances IA depuis chaque message autorisé et présenter un briefing unique.
3. Ajouter automatiquement les actions aux tâches et les dates explicitement reconnues à l'agenda local ; sans heure reconnue, utiliser une journée entière.
4. Empêcher l'import multiple d'un même message, conserver les données existantes et identifier l'origine IA ; conserver les éléments supprimés dans l'historique d'import pour ne pas les recréer involontairement.
5. Tester les dates valides, ambiguës et inexistantes, les contrôles d'accès, la période et l'absence de doublon. Déployer uniquement après build réussi.

## 3. Développement
- `src/main.jsx` : période, synthèse, import automatique, agenda local et conservation des tâches existantes.
- `src/lib/automation.js` : transformation et déduplication.
- `src/lib/deadline.js` : validation des dates/heures issues du texte.
- `api/analyze.js` : contrôle de l'expéditeur et du délai de 72 h, sortie structurée.
- `tests/*.test.js` : tests unitaires et tests API simulés.

## 4. QA et limites
- À exécuter : `node --test tests/*.test.js`, `npm run build`, `npm audit`.
- Les requêtes Gmail et Gemini de test sont simulées dans les tests API ; aucun e-mail réel n'est consulté par ces tests. Le parcours utilisateur complet doit encore être vérifié par le propriétaire avec une autorisation de traitement des données.
- L'analyse IA peut manquer une action, produire des doublons sémantiques entre messages différents ou interpréter un contexte à tort. La déduplication est par message, pas par sens. Les résumés et ajouts doivent être revérifiés.
- Une date sans année ou relative n'est pas ajoutée automatiquement à l'agenda et doit être vérifiée ; les formats reconnus sont numériques (JJ/MM/AAAA, JJ.MM.AAAA, AAAA-MM-JJ) et dates françaises écrites complètes.
- Les tâches/échéances restent uniquement sur l'appareil. Google Agenda n'est pas modifié.
