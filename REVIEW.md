# REVIEW : dossier de transmission, itération 2 (démonstration AZURÉA PRIVÉ)

Projet piloté par **Noa**. Développement : **Claude Code**. Revue indépendante : **ChatGPT**,
via Noa. Une première revue indépendante a porté sur le commit `674ba1f` (4 octobre 2026) ;
ce document décrit en plus la **passe de corrections** qui a suivi (§ 0 bis). Cette passe n'a
pas encore été revue de façon indépendante. Les affirmations de ce document sont celles du
développeur : elles ne valent **pas** validation indépendante. Chaque point cite sa preuve.

Branche : `claude/exciting-darwin-nvsxps` · 4 octobre 2026 · Astro 7.3.5, Node 22,
Chromium 141 headless (Playwright). Itération 1 (site réel, données inconnues) : historique Git.

## 0. Périmètre de cette itération

Demande de Noa : une **démonstration fictive complète** à partir du kit
`azurea-prive-claude-demo-v2` (copié dans `demo-kit/`). Les informations du scénario AZURÉA
PRIVÉ (Adrien Morel, Tesla Model 3 noire, prestations, tarifs, coordonnées) sont
**explicitement autorisées comme fictives**. En complément, en cours d'itération : utiliser la
skill Scroll Craft chargée, et soigner le **mobile au même niveau que le desktop**.

**Statut : aperçu complet de démonstration, pas un site publiable.** Aucune donnée d'entreprise
réelle ; le build de production est refusé en démo (voulu).

## 0 bis. Corrections après la revue indépendante du commit 674ba1f

Revue ChatGPT : démonstration jugée aboutie, parcours principaux et simulation serveur
confirmés indépendamment ; quatre corrections et deux ajustements demandés, sans refonte.
Résumé de toutes les vérifications rejouées : [`docs/preuves/RESUME.md`](docs/preuves/RESUME.md).

| # | Constat de la revue | Correction | Preuve | Statut |
|---|---|---|---|---|
| 1 | La preuve de simulation versionnée était **invalide** : `--import scripts/...` sans `./` → `ERR_MODULE_NOT_FOUND`, serveur jamais démarré, HTTP 000, puis « 0 appel » affiché et exit 0. Je n'avais relu que la dernière ligne de sa sortie. | Script réécrit (`scripts/verify/demo-simulation-proof.mjs`, appelé par le `.sh`) : chemin `./` explicite ; port libre vérifié ; attente de disponibilité avec détection d'un arrêt prématuré ; témoin positif (l'espion détecte bien un `fetch` et un `http.get`) ; marqueur prouvant que l'espion est chargé dans le serveur ; HTTP 200 + `simulated` exigés pour devis JSON, contact HTML et devis HTML sans JS ; 0 appel sortant (`fetch`, `http`, `https`) ; aucun contenu soumis dans le journal ; nettoyage du processus ; **exit 1 à la première étape en échec**. | `docs/preuves/demo-simulation-proof.txt` (PROOF PASSED) ; auto-test `demo-simulation-selftest.txt` : la preuve **échoue** bien sur 5 contre-exemples (fichier serveur absent, serveur qui meurt au démarrage, serveur qui répond `sent`, serveur qui répond `simulated` mais appelle l'extérieur, port déjà occupé) | corrigé |
| 2 | Dépendances : alertes `npm audit` portées par l'adaptateur Netlify optionnel et par `http-cache-semantics` 4.2.0. | `@astrojs/netlify` retiré (manifeste, verrou, import conditionnel, `DEPLOY_TARGET`, `build:netlify`, `public/_headers`, docs). `npm update http-cache-semantics` → 4.3.0. Astro 7.3.5 et `@astrojs/node` 11.1.6 inchangés. Pas de `audit fix --force`. | `npm audit` : **0 alerte** (453 dépendances) ; `lock-diff.txt` : 552 entrées retirées, **une seule version changée** (`http-cache-semantics` 4.2.0 → 4.3.0), aucun ajout ; installation propre, build et tests réussis après coup | corrigé |
| 3 | Le choix `pin`/`flow` du hero était figé au chargement : 1440×900 → 390×844 restait `pin` (1182 px au lieu de 939) ; l'inverse restait `flow`. | `src/views/HomeView.astro` suit les requêtes média (composition et mouvement réduit) ; à chaque changement : `destroy()` de l'instance Scroll Craft, nettoyage de ce que le moteur avait posé (hauteur, `--sc-p`, classes), bascule `pin`/`flow`, remontage ; position de lecture conservée si l'on a dépassé le hero. Moteur non modifié. | Scénario e2e « hero recomposes on resize… » : téléphone direct 939 px, desktop direct 1260 px ; desktop → téléphone à mi-défilement **939 px**, `flow` ; téléphone → desktop **1260 px**, `pin` 1,4, la voiture bouge à nouveau ; une seule instance du moteur ; mouvement réduit activé puis désactivé en direct. Captures `hero-redimensionne-*.jpg` | corrigé |
| 4 | Scénario sans JS bloqué sur Chromium 153 (« element is not stable » sur le radio e-mail). | Cause : `scroll-behavior: smooth` anime chaque défilement que Playwright fait avant une action, la cible bouge encore au moment du clic. Le test amène désormais chaque contrôle au centre par un défilement **instantané** et attend que sa position soit stable, puis fait la vraie action (clic, saisie, case cochée par clic). Aucun état n'est modifié par le DOM. Le scénario tourne aussi à 390 px ; `waitForNavigation` (déprécié) remplacé par `waitForURL`. Le POST réel, la page simulée, le prix et l'absence de débordement restent vérifiés. | `e2e-output.txt` (32/32) ; `e2e-nojs-repetition.txt` : **10/10** exécutions des deux scénarios sans JS. **Limite** : seul Chromium 141 est disponible ici ; le comportement sur Chromium 153 n'a pas été rejoué. | corrigé, à confirmer sur Chromium 153 |
| 5a | `robots.txt` démo autorisait l'exploration et annonçait un sitemap, avec un commentaire inexact. | Une règle : seul le **live en production** est indexable. Démo et aperçu live : `robots.txt` explique le statut, laisse l'exploration ouverte (sinon la balise `noindex` ne peut pas être lue ; une URL bloquée peut tout de même être listée sans contenu) et **n'annonce pas de sitemap** ; balises `noindex, nofollow` inchangées sur chaque page. Production : sitemap annoncé. Le test e2e, qui passait par erreur (« Disallow: /api/ » contient « Disallow: / »), vérifie maintenant ces points précisément. | `docs/preuves/robots-demo.txt`, `live-build-checks.txt` ; la variante production ne peut pas être construite tant que le garde-fou bloque (vérifiée par lecture du code seulement) | corrigé |
| 5b | « Rien n'est transmis » était ambigu (le serveur local reçoit bien le POST). | Remplacé par « Aucun message n'est envoyé au chauffeur » / « No message is sent to the chauffeur » : bandeau du formulaire, descriptions de page, introduction du résultat, pied de page (où « Aucun message, paiement ou réservation n'est transmis » devient « Aucun message n'est envoyé au chauffeur ; aucun paiement ni aucune réservation n'est effectué »). Ces textes venaient du kit ; changement demandé explicitement par Noa. | `src/i18n/demo.ts`, `src/content/demo.ts` | corrigé |
| — | Compléments anglais `EN: Claude` à relire. | Relus ; deux corrigés : « A conversation in person » → « Talk it through by phone. » (il s'agit d'un appel), et la phrase sur le minimum de 3 heures. | `src/i18n/demo.ts` | fait |

Non repris : le jeu fictif encore présent comme code mort dans le bundle serveur **live** (la
revue confirme qu'il n'a pas d'incidence sur la démo ; à traiter quand le site réel devient
le périmètre).

## 1. Statut par livrable

Légende : **D** développé · **T** testé localement · **F** vérifié auprès d'un fournisseur externe · **R** restant à valider

| Livrable | D | T | F | R |
|---|---|---|---|---|
| Mode `BUSINESS_MODE` demo/live (contenus séparés, choix au build) | ✔ | ✔ | n/a | revue |
| Build démo optimisé sans justificatifs (`npm run build`, `NODE_ENV=production`) | ✔ | ✔ | n/a | |
| Garde-fou live conservé ; jeu fictif refusé par le contrôle live | ✔ | ✔ (tests + build refusé) | n/a | |
| Démo `noindex`, sans LocalBusiness ; `SITE_ENV=production` refusé en démo | ✔ | ✔ | n/a | |
| Pages FR/EN remplies avec le kit (accueil, tarifs, devis, contact, à propos, confidentialité) | ✔ | ✔ | n/a | relecture des textes EN marqués `EN: Claude` |
| Photos IA intégrées (hero en calques desktop, hero mobile, Tesla, chauffeur) | ✔ | ✔ | n/a | iPhone réel |
| Contacts (appel, WhatsApp, e-mail) en simulation, aucun lien sortant | ✔ | ✔ (8 pages, 0 lien) | n/a | |
| Devis 2 étapes + exemple fictif + résultat simulé (JS et sans JS) | ✔ | ✔ | n/a | iPhone réel |
| Hero recomposé au redimensionnement (sans rechargement) | ✔ | ✔ | n/a | rotation sur appareil réel |
| Serveur : simulation forcée même avec une clé, aucun stockage ni journal de contenu | ✔ | ✔ (preuve auto-vérifiée : 0 appel ; confirmé aussi par la revue) | n/a | |
| Contrastes remesurés sur les photos | ✔ | ✔ (≥ 4,79:1 partout) | n/a | écrans réels |
| Performances remesurées (Lighthouse) | ✔ | ✔ | n/a | données terrain |
| Dépendances : Netlify retiré, `http-cache-semantics` 4.3.0, `npm audit` 0 alerte | ✔ | ✔ (install propre + build + tests) | n/a | |
| WebKit / Safari / iPhone | | **✘** (Chromium seul) | | procédure `docs/IPHONE.md` |
| Envoi réel d'e-mail (mode live) | ✔ (itération 1) | simulé | **✘ non fait** | hors périmètre démo |

## 2. Ouvrir le site

Une adresse `127.0.0.1` du conteneur de développement n'est **pas** accessible à Noa. Procédure
exacte (README, section « Ouvrir la démonstration ») :

```bash
git clone --branch claude/exciting-darwin-nvsxps https://github.com/nfrnd/TestVTC.git
cd TestVTC
npm ci
npm run build
npm start          # puis http://localhost:4321
```

Prérequis : Node.js ≥ 22.12. Aucune publication publique, aucun abonnement n'a été fait.
Une archive zip du code (sans `node_modules`, `.env`, secrets ni fichiers personnels) est
fournie séparément ; mêmes commandes après décompression.

## 3. Séparation démo / live

- `BUSINESS_MODE` (défaut `demo`) est figé au build par `astro.config.ts` (`vite.define`).
  `src/content/index.ts` choisit `demoContent` (`src/content/demo.ts`, `fictional: true`) ou
  `liveContent` (`src/content/business.ts`) ; les textes d'interface propres à la démo sont
  des surcharges (`src/i18n/demo.ts`) fusionnées aux dictionnaires communs.
- **Seul** `src/components/ContactAction.astro` crée des liens de contact. En démo, il produit
  une ancre `#sim-*` qui ouvre une fenêtre native `<dialog>` (`SimDialogs.astro`) ; sans JS,
  la même fenêtre s'affiche par `:target`. En live, il produit `tel:`, `mailto:`, `wa.me`
  uniquement pour une information confirmée.
- Garde-fous de build (`src/content/readiness-integration.ts`) :
  - démo + `SITE_ENV=production` → **refus** (`docs/preuves/build-demo-production.txt`, exit 1) ;
  - live + production → **refus** tant que 18 éléments critiques manquent, ou si le contenu
    est fictif, ou si l'URL est locale ou en `.example` (`docs/preuves/build-live-production.txt`, exit 1).
- Build live d'aperçu (`docs/preuves/live-build-checks.txt`) : 0 page contenant AZURÉA,
  Adrien, le numéro ou le domaine fictifs ; 0 bandeau démo ; 0 lien `tel:`/`mailto:`/`wa.me`
  (numéro non confirmé) ; 0 fenêtre de simulation ; `noindex` ; étiquettes « À confirmer ».
- **Limite connue** : le bundle **serveur** du build live contient encore les objets fictifs
  comme code mort (jamais rendus ni servis). Les éliminer à la compilation demande de revoir
  l'API `t(lang, mode)` utilisée par les tests ; non fait dans cette itération.

## 4. Contacts, devis et serveur en démo

- Devis : deux étapes conservées, groupes conditionnels (retour, vol/train, mise à disposition
  avec durée ≥ 3 h, canal de réponse WhatsApp → champ téléphone), bouton « Remplir un exemple
  fictif » (date = aujourd'hui à Paris + 7 jours, 10:30), bouton « Simuler ma demande de devis ».
- Résultat : récapitulatif construit **par le serveur** (`src/lib/summary.ts`), référence
  `DEMO-XXXXXXXX`, repère tarifaire si le trajet figure au tableau (sinon « devis
  personnalisé »), ligne de majoration de nuit si l'heure le justifie, et le message exact
  « Simulation réussie. Aucun message n'a été envoyé et aucun trajet n'est réservé. »
- Le serveur **force la simulation** en démo : configuré comme un vrai expéditeur
  (`EMAIL_TRANSPORT=resend`, clé factice, `MAIL_TO`, `MAIL_FROM`) avec `fetch` instrumenté,
  il répond `simulated` et **0 appel sortant** (`docs/preuves/demo-simulation-proof.txt` ; la
  première version de cette preuve était invalide, voir § 0 bis).
- Journal : métadonnées seulement, par exemple
  `{"evt":"demande","mode":"demo","kind":"devis","outcome":"simulated","http":200,"ms":14}`.
  Ni trajet, ni nom, ni coordonnées (test unitaire). Aucun stockage durable.
- Sans JS : le formulaire poste vers `/api/demandes` et reçoit une page HTML de récapitulatif.
  Limite : pour corriger, il faut revenir en arrière dans le navigateur.
- **Écart assumé avec le doc 02 du kit** (« aucune requête réseau ») : le doc 01 demande une
  simulation imposée par le serveur et un parcours sans JS, qui exigent un aller-retour POST.
  J'ai suivi le doc 01. Le contenu n'est ni envoyé plus loin, ni stocké, ni journalisé.
- Aperçu local : `127.0.0.1` et `localhost` sont acceptés comme la même origine tant que
  l'URL du site est locale ; jamais avec un domaine public (test unitaire). Sans ce correctif,
  un visiteur qui ouvrait `127.0.0.1:4321` voyait le devis échouer (403), défaut trouvé en
  faisant les captures.

## 5. Visuel et Scroll Craft

- Skill `nateherk-design:scroll-craft` 0.3.1 **chargée dans la session** à la demande de Noa ;
  références lues : `hero-depth.md`, `approved-collection.md`, `verify.md`. Moteur non modifié
  (SHA-256 `scrollcraft.js` = `4a419b3e…2f39`, `scrollcraft.css` = `e19eb3aa…758a`, identiques
  à l'installation). Brief mis à jour : `scrollcraft/builds/vtc-cannes/BRIEF.md` (courbe de
  ressenti, pic, contrôle du ressenti à froid, écarts) ; ligne de révision au registre.
- **Hero desktop** (écrans ≥ 1100 px et ratio ≥ 3/2) : plaque sans voiture + voiture détourée
  du kit, même cadre. Mouvement sobre : la voiture grandit trois fois plus que le fond (×1,09
  contre ×1,03) autour du **point de contact du pneu avant**, donc elle ne flotte pas et ses
  roues ne « tournent » pas. Épinglage court (1,4 écran), texte immobile.
  - Correction issue de la planche Scroll Craft : avec ×1,055 contre ×1,03, les six positions
    étaient indiscernables (pas de profondeur perçue).
  - Écrans ultra-larges (≥ 2:1) : la voiture passait sous le texte ; le cadre est désormais
    calé sur la hauteur, ancré à droite, avec un fondu vers le fond sombre.
  - 1100 à 1299 px : titre sur deux lignes pour rester dans la zone sombre du voile.
- **Hero téléphone** (≤ 760 px) : option 2 du kit. Photo portrait **entière** (4:5, jamais
  recadrée sur les côtés) sous l'en-tête ; le ciel se fond dans le fond sombre en haut, et le
  titre est posé dans ce dégradé, au-dessus du toit, derrière un voile local. Le bouton
  « Demander un devis » vient juste sous la photo et reste dans le premier écran jusqu'à
  360×640 (testé). Une seule image téléchargée.
  - **Écart assumé** avec `hero-depth.md` : pas de calques en mouvement sur téléphone, faute
    de paire fond/voiture cadrée en portrait dans le kit.
- Tablettes (761 à 1099 px, ou ratio < 3/2) : texte puis photo paysage complète, sans mouvement.
- En-tête : une fois la page défilée, un léger flou derrière les deux pastilles empêche de
  lire le contenu entre elles (mobile et desktop) ; flou calculé seulement après défilement.
- Mentions IA près de chaque image et dans le pied de page ; bandeau discret fixe
  « Démonstration — entreprise et tarifs fictifs ».
- Règle de la skill « pas de tiret cadratin visible » : **non appliquée** aux textes imposés mot
  pour mot par le kit (bandeau, titres d'onglet, objet du mail exemple, titre du résultat).

## 6. Commandes et résultats (build final)

| Vérification | Commande | Résultat | Preuve |
|---|---|---|---|
| Build démo | `npm run build:demo` | OK, exit 0 | `docs/preuves/build-demo.txt` |
| Tests unitaires | `npm test` | **43/43** | `docs/preuves/unit-tests.txt` |
| TypeScript / Astro | `npm run check` | **0 erreur, 0 avertissement** | `docs/preuves/astro-check.txt` |
| Installation propre | `npm ci` | réussie | `docs/preuves/npm-ci.txt` |
| Audit des dépendances | `npm audit` | **0 alerte**, 453 dépendances | `docs/preuves/npm-audit.json`, `npm-ls.txt`, `lock-diff.txt` |
| Navigateur, bout en bout | `npm run test:e2e` | **32/32** ; scénarios sans JS répétés **10/10** | `docs/preuves/e2e-output.txt`, `e2e-results.json`, `e2e-nojs-repetition.txt` |
| Contraste du hero sur les photos, FR et EN | `npm run verify:contrast` | **min 4,79:1** sur 447 mesures (8 tailles, 3 positions) ; téléphones ≥ 5,39:1 | `docs/preuves/hero-contrast*.json` |
| Contraste en-tête et panneau des services | idem | **min 6,31:1** (56 mesures) | `docs/preuves/overlay-contrast.json` |
| axe-core (WCAG 2.2 A/AA) sur 14 états interactifs | `npm run verify:axe` | **0 violation** ; 93 éléments « incomplete » (texte sur photo ou dégradé, qu'axe ne sait pas trancher : couverts par les mesures au pixel ci-dessus). Pas une certification d'accessibilité. | `docs/preuves/axe-states.json` |
| Scroll Craft `shoot.mjs` | voir README | aucun défilement mort : desktop (9,4 écrans), 390 (11,7), 360 (15,8), mouvement réduit (9,0) | `docs/preuves/scrollcraft/` |
| Lighthouse 13.5 | voir § 7 | tableau ci-dessous | `docs/preuves/lighthouse/` |
| Simulation forcée | `npm run verify:simulation` | PROOF PASSED (8 étapes) | `docs/preuves/demo-simulation-proof.txt`, `.json` |
| Auto-test de la preuve | `npm run verify:simulation:selftest` | la preuve échoue sur les 5 contre-exemples | `docs/preuves/demo-simulation-selftest.txt` |
| Garde-fous production | voir § 3 | 2 refus (exit 1) | `docs/preuves/build-*-production.txt` |
| Images du kit | SHA-256 recalculés | 13 identiques, 1 régénérée (défaut du kit) | `docs/preuves/assets-sha256.txt` |

Méthode de contraste : le texte est rendu transparent (fonds, voiles et boutons conservés),
la page est capturée, et chaque ligne de texte réelle (rectangles `Range`, texte pour lecteurs
d'écran exclu) est comparée au **pixel le plus défavorable** situé dessous. Mesure prudente :
les ombres portées du texte ne sont pas comptées. Le harnais Scroll Craft ne note que les
éléments `data-sc-cue`, absents ici, d'où ces scripts.

Les 32 scénarios e2e couvrent notamment :
- **Hero** : à 1100, 1440, 1920 et 2560 px, une seule composition chargée et la voiture entière
  au début et à la fin ; à 390 et 360 px, photo 4:5 non recadrée, titre au-dessus du toit et
  bouton dans le premier écran ; à 768 px, photo paysage.
- **Prix** identiques sur `/`, `/tarifs/`, `/en/`, `/en/rates/` et dans la FAQ.
- **Devis** : présélection `?prestation`, erreurs exactes près des champs, avec focus et
  contraste ≥ 4,5:1 vérifiés ; exemple fictif (date Paris + 7 jours), résultat simulé avec
  95 €, double clic → une seule requête ; erreurs serveur rattachées aux champs ; échec utile
  (saisie conservée, même identifiant) ; coupure réseau.
- **Contact** : fenêtres de simulation, 0 lien sortant sur 8 pages, contact simulé.
- **Sans JS** (à 1440 et 390 px) : sélecteur, FAQ, fenêtre d'appel, devis réellement posté puis
  page de récapitulatif avec 95 €, sans débordement à 360 px.
- **Redimensionnement** : desktop ↔ téléphone sans rechargement, à mi-défilement, et bascule du
  mouvement réduit en direct.
- **Autres** : mouvement réduit, photos bloquées, menu mobile et Échap, barre d'action mobile,
  aucun débordement et cibles ≥ 44 px à 360, 390, 768 et 1440 px, focus clavier, SEO
  (noindex, pas de JSON-LD en démo, `robots.txt` sans sitemap et sans blocage d'exploration),
  aucun tiers, cookie ou stockage, page 404.

## 7. Performances (Lighthouse 13.5, serveur local sans compression)

| Profil | Page | Perf. | Access. | Bonnes pr. | SEO | LCP | CLS | TBT | Poids total |
|---|---|---|---|---|---|---|---|---|---|
| mobile | / | 96 | 100 | 100 | 69 | 2,7 s | 0 | 0 ms | 293 Kio |
| mobile | /devis/ | 100 | 100 | 100 | 66 | 1,7 s | 0,029 | 0 ms | 139 Kio |
| mobile | /tarifs/ | 100 | 100 | 100 | 66 | 1,7 s | 0 | 0 ms | 112 Kio |
| mobile | /contact/ | 99 | 100 | 100 | 69 | 1,9 s | 0 | 0 ms | 172 Kio |
| mobile | /en/ | 96 | 100 | 100 | 69 | 2,7 s | 0 | 0 ms | 291 Kio |
| desktop | / | 100 | 100 | 100 | 69 | 0,6 s | 0 | 0 ms | 310 Kio |
| desktop | /devis/ | 100 | 100 | 100 | 66 | 0,4 s | 0,006 | 0 ms | 139 Kio |
| desktop | /tarifs/ | 100 | 100 | 100 | 66 | 0,4 s | 0 | 0 ms | 112 Kio |
| desktop | /contact/ | 100 | 100 | 100 | 69 | 0,4 s | 0 | 0 ms | 172 Kio |
| desktop | /en/ | 100 | 100 | 100 | 69 | 0,6 s | 0 | 0 ms | 309 Kio |

- SEO : seul `is-crawlable` échoue, à cause du `noindex` **exigé** pour la démo.
- Accueil mobile après photos : 293 Kio (contre 226 Kio avec les SVG de l'itération 1),
  LCP simulé 2,7 s (2,3 s auparavant). L'image LCP est la photo du hero, préchargée en
  priorité haute ; une seule composition est téléchargée par écran.
- L'INP n'est pas mesurable en laboratoire ; à suivre avec des données réelles plus tard.

## 8. Captures (`docs/captures/`, toutes regardées)

| Demandé | Fichier |
|---|---|
| Accueil desktop | `01-accueil-desktop-1440.jpg` |
| Accueil mobile | `02-accueil-mobile-390.jpg` |
| Section chauffeur | `03-section-chauffeur-1440.jpg` |
| Tarifs | `04-tarifs-1440.jpg`, `page-en-rates-390.jpg` |
| Devis rempli (exemple) | `05a-devis-exemple-rempli-etape1-1440.jpg`, `05b-…-etape2-1440.jpg` |
| Résultat simulé | `06-devis-resultat-simule-1440.jpg`, `sans-js-devis-resultat-390.jpg` |
| Échec utile | `07-devis-echec-utile-1440.jpg`, `08-devis-erreurs-champs-390.jpg` |
| Simulation de contact | `09-contact-simulation-appel-390.jpg`, `10-…-whatsapp-1440.jpg`, `11-…-email-1440.jpg` |
| Hero début / milieu / fin | `hero-1100x720-*`, `hero-1440x900-*`, `hero-2560x1080-*` |
| Hero recomposé sans rechargement (correction § 0 bis) | `hero-redimensionne-1440-vers-390.jpg`, `hero-redimensionne-390-vers-1440.jpg` |
| Quatre largeurs | `largeur-360.jpg`, `largeur-390.jpg`, `largeur-768.jpg`, `largeur-1440.jpg` |
| Sans JS | `sans-js-accueil-390.jpg`, `sans-js-simulation-appel-390.jpg`, `sans-js-devis-resultat-390.jpg` |
| Mouvement réduit | `mouvement-reduit-accueil-1440.jpg`, `page-accueil-1440-mouvement-reduit.jpg` |
| Pages complètes et divers | `page-accueil-390.jpg`, `page-contact-390.jpg`, `page-en-home-1440.jpg`, `page-a-propos-demo-1440.jpg`, `menu-mobile-ouvert-390.jpg`, `barre-action-mobile-390.jpg` |

Note : les captures pleine page montrent les éléments fixes (bandeau, en-tête, barre
d'action) à leur position au moment de la capture, et des sections animées à l'entrée
peuvent y apparaître vides. La revue visuelle a donc aussi été faite écran par écran
(`scripts/verify/walk.mjs`).

**Défauts trouvés et corrigés pendant cette itération** (captures et mesures) :
- erreurs de champ rose pâle sur fond clair (≈ 1,3:1) : jeton de couleur par fond ;
- devis refusé (403) depuis `127.0.0.1` ;
- récapitulatif sans JS qui débordait de 28 px à 390 px ;
- profondeur du hero imperceptible ;
- voiture sous le texte sur écran ultra-large ;
- contrastes limites du hero (bouton secondaire, introduction, signature mobile, repères EN) ;
- titres d'onglet qui répétaient la marque ;
- « : » rejeté en début de ligne (espaces insécables en français) ;
- nom répété sur la carte du chauffeur (page Contact) ;
- pied de page mobile trop long (liens sur deux colonnes) ;
- contenu lisible entre les pastilles de l'en-tête.

## 9. Dépendances et audit npm (rien n'a été forcé)

Avant cette passe (commit `674ba1f`) : 17 alertes « high » dans mon environnement, 15 dans celui
de la revue (la base d'avis évolue ; ces comptes incluent les paquets touchés par propagation),
portées par l'adaptateur `@astrojs/netlify` optionnel et par `http-cache-semantics` 4.2.0
(avis GHSA-ch52-4w7c-c8xp, plage ≤ 4.2.0).

Après cette passe :
- `@astrojs/netlify` retiré : non utilisé par la démo Node, il apportait plus de 500 paquets ;
- `http-cache-semantics` passé en 4.3.0 par la résolution compatible du verrou (`npm update`) ;
- **Astro 7.3.5 et `@astrojs/node` 11.1.6 inchangés** ; aucune rétrogradation, pas de `--force`.

Résultat dans cet environnement (Node 22.22.0, npm 10.9.4) : **`npm audit` → 0 alerte**,
453 dépendances recensées (`docs/preuves/npm-audit.json`, brut). Différence de verrou vérifiée
entrée par entrée (`docs/preuves/lock-diff.txt`) : 552 entrées retirées, une seule version
modifiée (`http-cache-semantics` 4.2.0 → 4.3.0), aucune entrée ajoutée. Chaînes :
`docs/preuves/npm-ls.txt` (`@astrojs/netlify` absent). Validé ensuite par installation propre
(`npm ci`), build, tests unitaires, `astro check` et e2e.

## 10. Problèmes ouverts et limites

1. **Pas de test WebKit ni sur iPhone réel** (Chromium 141 seul) : `docs/IPHONE.md`, à jour pour la démo.
2. La passe de corrections (§ 0 bis) n'a pas encore été revue indépendamment ; le scénario sans
   JS n'a pas été rejoué sur Chromium 153 (indisponible ici).
3. Défaut du kit : `assets/web/vehicle-profile-960.webp` vide (0 octet) dans le zip. Régénéré
   depuis `vehicle-profile.webp` (960×640, 51 882 octets) ; voir `docs/ASSETS.md`.
4. Textes anglais sans source dans le kit, écrits par Claude : marqués `// EN: Claude` dans
   `src/i18n/demo.ts`.
5. Bundle serveur live contenant le jeu fictif comme code mort (§ 3).
6. Écart doc 02 / doc 01 sur les requêtes réseau (§ 4) et pas de calques mobiles (§ 5).
7. Champs date et heure : leur format dépend de la langue du navigateur (en-US dans les captures
   headless ; jj/mm/aaaa sur un appareil en français).
8. Limitation de débit et anti-doublon en mémoire (un seul processus Node) ; 5 demandes par
   10 minutes par IP par défaut, y compris en démo.
9. Pas de Content-Security-Policy (scripts en ligne existants) ; le serveur Node ne compresse pas ;
   les en-têtes de sécurité sont à poser dans le proxy (exemple Caddy dans `docs/DEPLOIEMENT.md`).
11. `robots.txt` de production : non constructible tant que le garde-fou live bloque ; vérifié par
    lecture du code seulement.
10. Le site réel (mode live) reste bloqué par 53 informations à fournir, dont 18 critiques
    (`docs/preuves/content-report.txt`, `docs/QUESTIONS.md`) : sans effet sur la démo.

## 11. Pistes pour le relecteur

- Rejouer : `npm ci && npm test && npm run check && npm run build && npm run test:e2e && npm run verify:simulation && npm run verify:simulation:selftest`.
- Regarder en priorité :
  - la séparation démo/live : `src/content/index.ts`, `ContactAction.astro`,
    `readiness-integration.ts`, `src/lib/server/handle.ts` ;
  - l'absence de toute sortie réelle en démo ;
  - la fidélité des textes au kit ;
  - le rendu mobile du hero (`src/components/home/Hero.astro`, section « PHONES ») ;
  - la lisibilité sur écrans réels.
- Noa arbitre tout changement de périmètre, de dépense ou de publication.
