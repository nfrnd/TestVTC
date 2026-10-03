# REVIEW : dossier de transmission pour la revue indépendante

Projet piloté par **Noa**. Développement : **Claude Code**. Revue indépendante prévue :
**ChatGPT**, à partir des éléments transmis par Noa. Les affirmations de ce document sont
celles du développeur. Elles ne valent **pas** validation indépendante, et chaque point
indique sa preuve, que le relecteur peut rejouer.

Branche : `claude/exciting-darwin-nvsxps` · date : 3 octobre 2026 · Astro 7.3.5, Node 22.

## 1. Statut par livrable

Légende : **D** développé · **T** testé localement · **F** vérifié avec le fournisseur externe · **R** restant à valider

| Livrable | D | T | F | R |
|---|---|---|---|---|
| Pages FR/EN : accueil, tarifs, devis, contact, mentions, confidentialité, 404, pages de résultat | ✔ | ✔ | n/a | contenus métier |
| Hero en calques (Scroll Craft `pin` + `parallax`, roues liées au déplacement) | ✔ | ✔ | n/a | iPhone réel, photos réelles |
| Sélecteur de trajets (signature, CSS `:has()`, sans JS) | ✔ | ✔ | n/a | liste des prestations |
| Formulaire devis 2 étapes + contact, validation client et serveur | ✔ | ✔ | n/a | iPhone réel |
| Route `/api/demandes`, protections, transport test/fail | ✔ | ✔ | n/a | |
| Transport Resend (envoi réel) | ✔ | ✔ simulé (fetch mocké) | **✘ non fait** | compte, domaine, clé, boîte test |
| Réception effective d'un email | | | **✘ non fait** | boîte test autorisée |
| SEO (titres, canonical, hreflang, sitemap, robots, JSON-LD) | ✔ | ✔ en aperçu | n/a | vrai domaine, nom commercial |
| Garde-fou production | ✔ | ✔ (refus constaté) | n/a | |
| Déploiement HTTPS | documenté | build Node et Netlify OK | **✘ non fait** | choix de Noa, coûts revérifiés |
| WebKit / Safari / iPhone | | **✘** (Chromium seul disponible) | | procédure `docs/IPHONE.md` |

**Le site n'est pas prêt à publier** : coordonnées, prestations, prix, informations légales et
transport d'email non vérifiés (`docs/preuves/content-report.txt` : 50 éléments manquants,
dont 18 bloquants).

## 2. Scroll Craft : utilisation réelle

- Disponibilité : dépôt `nateherkai/scroll-craft` cloné, puis plugin installé par la voie
  officielle : `claude plugin marketplace add nateherkai/scroll-craft` et
  `claude plugin install nateherk-design@nateherk`. Résultat : version 0.3.1, activé, commit `75d81f7`.
- Chemin installé : `~/.claude/plugins/cache/nateherk/nateherk-design/0.3.1/skills/scroll-craft/`.
- **Limite constatée** : l'outil Skill de la session en cours a répondu
  `Unknown skill: nateherk-design:scroll-craft`, car les plugins se chargent au démarrage d'une
  session. Le `SKILL.md` et les références (`hero-depth`, `verify`, `taste`, `devices`,
  `approved-collection`, `uniqueness`, `feel`, `worlds`, `template.html`) ont donc été lus
  directement depuis le chemin installé et suivis à la main.
- Diagnostic `doctor.mjs` (chemin installé), sortie 0 : node, ffmpeg complet (564 filtres)
  et encodeur libwebp OK. Avertissements optionnels : `playwright-core` non installé
  (installé ensuite dans le projet), Chrome introuvable (Chromium de Playwright fourni via
  `SCROLLCRAFT_CHROME`), `KIE_AI_API_KEY` absent (génération non utilisée, budget nul),
  registre non créé (créé ensuite par `workspace.mjs --ensure`).
- Moteur non modifié : copie identique dans `src/vendor/scrollcraft/`.
  SHA-256 `scrollcraft.js` = `4a419b3ede51f64790af7b56c0195ea01c98a84df8e0e768ebf343956b922f39`,
  `scrollcraft.css` = `e19eb3aa73b0944626ca56e6e427c76f44753481e04d60f4bac20e8cf1d7758a`,
  identiques aux fichiers installés. Il est chargé uniquement sur l'accueil (`src/views/HomeView.astro`).
  Les comportements propres au projet utilisent `--sc-p` en CSS et du JS local à la page.
- Brief Scroll Craft : [`scrollcraft/builds/vtc-cannes/BRIEF.md`](scrollcraft/builds/vtc-cannes/BRIEF.md)
  (auto-rédigé sous délégation explicite, faits et hypothèses séparés, courbe de ressenti,
  pic, partition des devices).
- Protocole de vérification `shoot.mjs` exécuté en 1440×900, 390×844, 360×640 et en
  animations réduites (§ 5).
- **Écart assumé** : `worlds.md` recommande un monde photographique. Sans photo autorisée
  accessible (banques d'images bloquées, budget nul), le visuel est une illustration originale
  étiquetée, construite selon le contrat de calques de `hero-depth.md`, pour que des photos
  détourées la remplacent (`docs/ASSETS.md`).

## 3. Architecture retenue

- **Astro 7 + TypeScript, `output: 'static'`** : 23 routes prérendues et une seule route à la
  demande, `src/pages/api/demandes.ts` (`prerender = false`), conforme à la doc Astro
  « On-demand rendering ». Docs.astro.build étant bloqué, la page a été lue dans
  `withastro/docs` sur GitHub.
- **Adaptateur `@astrojs/node` (standalone)** par défaut. Un seul processus rend fiables la
  limitation de débit et l'anti-doublon en mémoire. `DEPLOY_TARGET=netlify` est vérifié au
  build ; ses limites sont décrites dans `docs/DEPLOIEMENT.md`.
- **Séparation** : composants visuels (`src/components`, `src/views`), données métier
  (`src/content/business.ts`), traductions (`src/i18n`), schéma de validation partagé
  (`src/lib/validation.ts`), transport d'email (`src/lib/mail`), logique serveur testable sans
  Astro (`src/lib/server/handle.ts`).
- **Données inconnues explicites** : type `Field<T>` = `confirmed(v) | unknown(note)`.
  Rendu : rien en production, étiquette « À confirmer » en aperçu. Le garde-fou
  `src/content/readiness-integration.ts` fait échouer `SITE_ENV=production` sur 18 éléments.
- **Amélioration progressive** : sans JS, tout le contenu, le sélecteur (radios + `:has()`), la
  FAQ (`<details>`), le menu (`<details>`) et les formulaires (POST vers l'endpoint, 303 vers
  une page de résultat) fonctionnent.
- **Une seule bibliothèque d'animation** (Scroll Craft) ; tout le reste est en CSS.
- Aucun CMS, aucune base de données, aucun service tiers dans le navigateur.

### Fichiers importants

| Fichier | Rôle |
|---|---|
| `src/content/business.ts` | toutes les données métier (inconnues explicites) |
| `src/components/home/Hero.astro` | scène du hero, calques, chorégraphie `--sc-p`, version mobile |
| `src/components/home/Services.astro` | interaction signature |
| `src/components/forms/QuoteForm.astro`, `src/scripts/forms.ts` | formulaire devis et amélioration JS |
| `src/lib/validation.ts` | schéma partagé client et serveur |
| `src/lib/server/handle.ts`, `guards.ts` | endpoint : origine, débit, schéma strict, champ piège, doublons, transport |
| `src/lib/mail/compose.ts`, `transport.ts` | email exploitable et échappé ; Resend / test / fail |
| `astro.config.ts` | adaptateur, schéma d'environnement typé, garde-fou |
| `scripts/art/*.mjs` | générateur reproductible des illustrations |
| `scripts/e2e.mjs`, `scripts/verify/*.mjs` | vérifications navigateur, contraste, captures |

## 4. Direction visuelle et parcours

- Hero sombre ardoise : une Tesla Model 3 noire de profil, posée sur la Croisette au
  crépuscule, devant l'Esterel et la colline du Suquet avec sa tour. Quatre plans à des
  vitesses différentes (fond −0,5, intermédiaire −1, chaussée et voiture fixes, palmes
  −2,2). La voiture avance de 14 % de sa largeur (9 % sur mobile) ; les roues tournent de
  −115° (−74°), soit le rapport distance / rayon de pneu, donc elles roulent sans glisser.
  Le texte et les boutons ne bougent jamais et sont utilisables avant tout script.
  L'épinglage est court (1,6 écran ; 1,45 sur mobile).
- Accent vert d'eau `#A8D5CC` réservé aux actions sur fond sombre, et sa variante profonde
  `#1D5148` sur fond clair (même teinte). Contrastes calculés : texte courant ≥ 6,9:1,
  boutons ≥ 8,3:1.
- Typographie : Bricolage Grotesque (titres), Geist (texte), soit deux familles OFL.
- Libellé unique « Demander un devis » partout ; « Appeler » seulement si le numéro est confirmé.
- Le devis est présenté comme une **demande** : message de réussite exact, plus « Votre
  trajet n'est pas encore réservé… ». Le mode test est annoncé comme tel.

## 5. Commandes et résultats

Toutes les commandes ont été exécutées sur le build de production local
(`http://127.0.0.1:4321`, serveur Node), Chromium 141 headless (Playwright 1194).

| Vérification | Commande | Résultat | Preuve |
|---|---|---|---|
| Tests unitaires | `npm test` | **29/29** | `docs/preuves/unit-tests.txt` |
| TypeScript / Astro | `npm run check` | **0 erreur, 0 avertissement** | `docs/preuves/astro-check.txt` |
| Navigateur, bout en bout | `npm run test:e2e` | **24/24** | `docs/preuves/e2e-results.json`, `e2e-output.txt` |
| Scroll Craft `shoot.mjs` | voir README | aucun défilement mort (desktop, 390, 360, réduit) ; cues ≥ 4,5:1 sur leur pire image | `docs/preuves/scrollcraft/` (planches + rapports) |
| Contraste du hero sur l'image composée | `npm run verify:contrast` | minimum **6,73:1** (texte d'introduction, 1024×768, fin de transition) | `docs/preuves/hero-contrast.json` |
| Lighthouse mobile (simulation) | Lighthouse 13.5 | voir tableau ci-dessous | `docs/preuves/lighthouse/` |
| Garde-fou production | `npm run build:production` | **refus**, 18 éléments listés (voulu) | `docs/preuves/production-guard.txt` |
| Build Netlify | `npm run build:netlify` | OK (fonction SSR générée) | sortie de console, non archivée |
| Endpoint en conditions réelles (curl) | voir § 6 | conforme | ce document |

Couverture des 24 tests de bout en bout : premier écran (activité, ville, véhicule,
bouton), roues liées au défilement, sélecteur à la souris et au clavier, présélection
`?prestation` limitée au type de trajet, erreurs près des champs avec focus sur la
première, récapitulatif conservé au retour, double clic qui n'envoie qu'une requête,
message exact de transmission (fournisseur simulé), erreurs serveur rattachées aux champs,
échec du transport (champs conservés, même identifiant au nouvel essai), coupure réseau,
formulaire Contact en anglais, mode **sans JS** (contenu, sélecteur, FAQ, POST sans
données dans l'URL), animations réduites (pas d'épinglage, rien ne bouge), SVG bloqués,
menu mobile et touche Échap, sélecteur de langue, barre d'action mobile (masquée sur le
hero, espace réservé, absente sur le devis), aucun débordement horizontal et zones
tactiles ≥ 44 px à **360, 390, 768 et 1440 px** sur 10 pages, lien d'évitement et focus
visible, SEO (un H1, titres uniques, canonical, hreflang, noindex d'aperçu, sitemap),
aucun tiers ni cookie ni stockage, 404.

Lighthouse mobile (Moto G Power émulé, débit lent simulé, CPU ×4, serveur local sans
compression) :

| Page | Perf. | Access. | Bonnes pr. | SEO | LCP | CLS | TBT | Poids total |
|---|---|---|---|---|---|---|---|---|
| / | 98 | 100 | 100 | 66 | 2,3 s | 0,008 | 0 ms | 226 Kio |
| /devis/ | 99 | 100 | 100 | 66 | 1,7 s | 0,044 | 0 ms | 115 Kio |
| /tarifs/ | 100 | 100 | 100 | 66 | 1,5 s | 0 | 0 ms | 99 Kio |
| /contact/ | 99 | 100 | 100 | 66 | 1,8 s | 0 | 0 ms | 107 Kio |
| /en/ | 98 | 100 | 100 | 66 | 2,3 s | 0,008 | 0 ms | 225 Kio |

- SEO 66 : seul l'audit `is-crawlable` échoue, à cause du `noindex` **volontaire** de
  l'aperçu. Un build de production ne peut pas encore être produit (garde-fou).
- Premier écran mobile : 226 Kio transférés, très en dessous du budget de 1 Mo.
- L'**INP n'est pas mesurable** avec Lighthouse ; il faudra le suivre avec des données réelles
  (CrUX ou RUM) après le lancement. Le TBT de 0 ms n'en est qu'un indicateur de laboratoire.

## 6. Endpoint : essais réels (curl sur le build)

| Cas | Réponse |
|---|---|
| Demande valide (transport test) | 200 `{"status":"simulated"}`, message « Mode test… » |
| Même `requestId` renvoyé | 200, aucun second envoi (journal : `duplicate-simulated`) |
| `Origin` étranger | 403 |
| Données invalides | 422 + erreurs par champ |
| Clé inattendue (`to`) | 400 : le destinataire ne peut pas être choisi |
| Champ piège rempli | 400, rien n'est envoyé |
| POST HTML sans JS valide | 303 vers `/en/contact/simulated/` |
| POST HTML sans JS invalide | page HTML avec libellés et erreurs, contact direct si configuré |
| `EMAIL_TRANSPORT=fail` | 502, message d'échec |
| `EMAIL_TRANSPORT=resend` sans clé | 503 « non configuré » ; journal : raison technique sans données personnelles |
| GET | 405 |

Journal type : `{"evt":"demande","kind":"devis","outcome":"simulated","provider":"test","http":200,"ms":7}`.

## 7. Captures (dans `docs/captures/`)

- Hero ordinateur : `hero-desktop-1-debut.jpg`, `-2-milieu.jpg`, `-3-fin.jpg`
- Hero mobile : `hero-mobile-1-debut.jpg`, `-2-milieu.jpg`, `-3-fin.jpg`
- Premier écran : `accueil-360.jpg`, `accueil-390.jpg`, `accueil-768.jpg`, `accueil-1440.jpg`
- Pages complètes : `page-accueil-1440.jpg`, `page-accueil-390.jpg`, `page-tarifs-1440.jpg`,
  `page-contact-390.jpg`, `page-en-quote-1440.jpg`, `mentions-legales-1440.jpg`
- États : `services-selection-affaires-1440.jpg`, `devis-erreurs-1440.jpg`,
  `devis-etape2-recap-390.jpg`, `devis-echec-transport-1440.jpg`,
  `devis-envoye-simulation-1440.jpg`, `menu-mobile-ouvert-390.jpg`,
  `barre-action-mobile-390.jpg`, `reduced-motion-accueil-1440.jpg`, `sans-js-accueil-390.jpg`
- Planches Scroll Craft : `docs/preuves/scrollcraft/sheet-*.jpg`

Chaque capture a été regardée. Défauts trouvés puis corrigés pendant le développement :
- titre invisible dans la carte sombre du sélecteur (jetons de couleur hérités du fond clair) ;
- bouton de mauvaise teinte dans un fond imbriqué ;
- encadré d'erreur vide visible (`[hidden]` écrasé par `display: grid`) ;
- champs date et heure désalignés ;
- champ email étiré en hauteur ;
- étiquette « Aperçu » fixe qui masquait du contenu ;
- palmes décalées au chargement par le parallaxe ;
- nez de la voiture coupé sur mobile en fin de transition ;
- marque sur deux lignes à 390 px ;
- lien « Voir les tarifs » de 26 px (zone tactile insuffisante).

## 8. Problèmes ouverts et limites connues

1. **Envoi réel non vérifié** : aucun compte Resend, aucune clé, aucun domaine vérifié.
   L'acceptation par le fournisseur et la réception en boîte restent à prouver.
   L'en-tête `Idempotency-Key` transmis à Resend correspond à la fonction documentée de
   Resend telle que connue, mais il n'a pas été vérifié contre leur API pendant la session.
2. **Pas de test WebKit ni sur iPhone réel** : seul Chromium était disponible. Procédure : `docs/IPHONE.md`.
3. **Offres d'hébergement et d'email non revérifiées** (sites bloqués) : `docs/DEPLOIEMENT.md`.
4. **Visuels provisoires** : illustrations originales, à remplacer par de vraies photos.
5. `npm audit` : 3 alertes « high » sur `http-cache-semantics` (dépendance transitive
   d'Astro 7.3.5 et de l'adaptateur Node). La seule correction proposée par npm
   (`--force`, rétrogradation vers Astro 2) est inacceptable. À surveiller : une mise à jour
   d'Astro qui corrige la dépendance.
6. Limitation de débit et anti-doublon **en mémoire** : fiables avec un seul processus Node,
   seulement indicatifs en serverless (documenté dans le code et dans `docs/DEPLOIEMENT.md`).
7. Derrière un proxy TLS, la vérification d'origine d'Astro peut exiger `security.allowedDomains` (documenté).
8. Pas de Content-Security-Policy : de petits scripts et styles en ligne existent
   (classe `js`, JSON-LD, règles du sélecteur). Une CSP avec empreintes reste à faire si
   souhaitée. Les autres en-têtes sont prêts (`public/_headers`, exemple Caddy).
9. Le serveur Node ne compresse pas les réponses : la compression doit venir du proxy ou de
   la plateforme.
10. Sans JS, une erreur de validation renvoie une page d'erreur séparée. La conservation des
    saisies dépend alors du bouton Retour du navigateur ; la validation native HTML en
    évite la plupart.
11. La rotation des roues suppose une illustration : elle devra être retirée avec une photo
    réelle (expliqué dans `docs/ASSETS.md`).
12. Le harnais Scroll Craft ne note que les éléments `data-sc-cue`. Le texte stable du hero
    a donc été mesuré par `scripts/verify/hero-contrast.mjs`.

## 9. Informations manquantes

Liste complète et regroupée : [`docs/QUESTIONS.md`](docs/QUESTIONS.md). Liste générée :
`docs/preuves/content-report.txt` (`npm run content:report`).

## 10. Pistes pour le relecteur

- Rejouer : `npm ci && npm test && npm run check && npm run build && npm run test:e2e`.
- Regarder en priorité : la justesse des textes (aucune promesse non confirmée), le
  traitement des données inconnues (`src/content/business.ts`), les réponses de
  l'endpoint (`src/lib/server/handle.ts`) et la lisibilité du hero sur des écrans réels.
- Si une recommandation semble contredire un choix documenté ici, comparer avec la
  preuve citée. Noa arbitre tout changement de périmètre, de dépense ou de publication.
