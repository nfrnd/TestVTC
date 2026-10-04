# Résumé de la chaîne de vérification (2026-10-04T12:00:05Z, commit de base 674ba1f + modifications de cette passe)

Node v22.22.0, npm 10.9.4, Chromium 141.0.7390.37.

| Étape | Résultat | Preuve |
|---|---|---|
| Installation propre (npm ci) | réussi | npm-ci.txt |
| npm audit | exit 0 · {"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0} · 453 dépendances | npm-audit.json |
| Build démo optimisé | réussi | build-demo.txt |
| Tests unitaires | réussi · Tests  43 passed (43) | unit-tests.txt |
| astro check | réussi · - 0 errors, - 0 warnings, - 0 hints | astro-check.txt |
| Navigateur, bout en bout | réussi · 32/32 passed | e2e-output.txt, e2e-results.json |
| Scénarios sans JS répétés (1440 et 390 px) | 10/10 exécutions réussies | e2e-nojs-repetition.txt |
| Preuve de simulation forcée | réussi · PROOF PASSED | demo-simulation-proof.txt, .json |
| Auto-test de la preuve (5 contre-exemples doivent échouer) | réussi · SELF-TEST PASSED (all five negative controls fail as expected) | demo-simulation-selftest.txt |
| Garde-fou démo + production | refus attendu (exit 1, aucun fichier produit) | build-demo-production.txt |
| Garde-fou live + production incomplète | refus attendu (exit 1, aucun fichier produit) | build-live-production.txt |
| Build live d'aperçu (séparation démo/live) | réussi · Pages contenant AZURÉA / Adrien / 06 39 98 12 34 / azurea-prive : 0 | live-build-checks.txt |
| Contraste du hero sur photos FR/EN | exit 0/0 · hero-contrast : 220 mesures, min 4.79:1 ; hero-contrast-en : 227 mesures, min 4.79:1 ;  | hero-contrast*.json |
| Contraste en-tête et panneau | exit 0 · all >= 4.5:1 | overlay-contrast.json |
| axe-core, 14 états | exit 0 · 0 violation(s), 93 élément(s) « incomplete » | axe-states.json |
| Scroll Craft shoot.mjs (4 profils) |       4 no dead scroll detected  | scrollcraft/ |
| Captures | réussi · 39 fichiers | ../captures/ |
| Lighthouse 13.5 (10 mesures) | voir summary.md | lighthouse/summary.md |

Non réalisé dans cet environnement : Safari / WebKit, iPhone physique, envoi réel d'e-mail (hors périmètre démo), Chromium 153 (seul Chromium 141 est disponible ici).
