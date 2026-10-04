# Site vitrine VTC · Cannes (Tesla Model 3)

Site Astro + TypeScript : pages prérendues (FR à la racine, EN sous `/en/`), une seule
route serveur `/api/demandes` pour les formulaires Devis et Contact, hero en calques animé
avec le moteur [Scroll Craft](https://github.com/nateherkai/scroll-craft) (MIT, non modifié).

Le même code produit deux sites, selon le **mode métier** choisi au build :

| | `BUSINESS_MODE=demo` (défaut) | `BUSINESS_MODE=live` |
|---|---|---|
| Contenu | AZURÉA PRIVÉ, Adrien Morel, tarifs et coordonnées **fictifs** (`src/content/demo.ts`) | Données réelles du chauffeur (`src/content/business.ts`), aujourd'hui presque toutes « à confirmer » |
| Images | Photographies générées par IA (kit de démonstration) | Aucune photo réelle fournie pour l'instant |
| Appeler / WhatsApp / e-mail | Ouvrent une **fenêtre de simulation** : aucun lien `tel:`, `mailto:` ni `wa.me` | Vrais liens, seulement si l'information est confirmée |
| Devis et contact | **Simulés par le serveur**, même si une clé d'envoi existe ; récapitulatif affiché, rien n'est envoyé ni stocké | Envoi par e-mail via le fournisseur configuré |
| Indexation | Toujours `noindex`, pas de données structurées LocalBusiness | `noindex` en aperçu, indexable en production |
| Build de production | **Refusé** (`SITE_ENV=production` interdit en démo) | Refusé tant qu'une donnée critique manque |

> **Statut : démonstration fictive, pas un site publiable.** Aucune information d'entreprise
> réelle n'est présente. Revue indépendante (ChatGPT, via Noa) : à venir. Voir [REVIEW.md](REVIEW.md).

## Ouvrir la démonstration sur votre ordinateur

Le site tourne dans un conteneur de développement que vous ne pouvez pas joindre :
aucune adresse `127.0.0.1` ou `localhost` donnée par Claude ne s'ouvrira chez vous.
Il faut le lancer sur votre machine (5 minutes, rien n'est publié, aucun compte requis).

**Prérequis** : [Node.js](https://nodejs.org) version **22.12 ou plus** (`node -v` pour vérifier)
et Git (ou l'archive zip fournie à la place du clonage).

```bash
# 1. Récupérer le code (ou décompresser l'archive zip, puis aller dans le dossier)
git clone --branch claude/exciting-darwin-nvsxps https://github.com/nfrnd/TestVTC.git
cd TestVTC

# 2. Installer les dépendances exactes du verrou (une seule fois)
npm ci

# 3. Construire la démonstration optimisée (mode demo par défaut)
npm run build

# 4. Lancer le serveur
npm start
```

Puis ouvrir **http://localhost:4321** dans le navigateur. `Ctrl+C` dans le terminal arrête le serveur.

- Pages : `/` (accueil), `/tarifs/`, `/devis/`, `/contact/`, `/mentions-legales/` (« À propos de
  cette démonstration »), `/confidentialite/`, et les mêmes en anglais sous `/en/`.
- Sur `/devis/`, le bouton « Remplir un exemple fictif » préremplit le formulaire (date :
  aujourd'hui + 7 jours, 10:30, heure de Paris).
- Port déjà pris : `PORT=4400 npm start` (macOS/Linux) ou `$env:PORT=4400; npm start` (PowerShell),
  puis http://localhost:4400.
- Tester sur un téléphone du même Wi-Fi : `HOST=0.0.0.0 npm start`, puis
  `http://<adresse-IP-de-l-ordinateur>:4321` sur le téléphone. Dans ce cas, ajouter l'origine :
  `HOST=0.0.0.0 ALLOWED_ORIGINS=http://<adresse-IP>:4321 npm start`, sinon les simulations de
  formulaire sont refusées (contrôle d'origine).
- Mode développement (rechargement à chaud, pas optimisé) : `npm run dev`.

Aucune publication publique, aucun abonnement n'a été fait : ce sera la décision de Noa.

## Commandes

| Commande | Effet |
|---|---|
| `npm run build` / `npm run build:demo` | Build optimisé de la démonstration (`NODE_ENV=production`, sans aucun justificatif d'entreprise) |
| `npm start` | Sert le dernier build sur http://localhost:4321 |
| `npm run dev` / `npm run dev:demo` | Serveur de développement, mode démo |
| `npm run build:live` | Build du site réel en aperçu (`noindex`, étiquettes « À confirmer ») |
| `npm run build:live:production` | Build du site réel publiable : **échoue** tant que des données critiques manquent (voulu) |
| `npm run build:netlify` | Variante pour Netlify |
| `npm test` | Tests unitaires (validation, endpoint démo et live, garde-fous) |
| `npm run check` | TypeScript / Astro |
| `npm run test:e2e` | Navigateur réel sur le build (30 scénarios) |
| `npm run verify:contrast` | Contraste du texte mesuré sur les photos (hero, en-tête, panneaux) |
| `npm run verify:captures` | Régénère les captures de `docs/captures/` |
| `npm run content:report` | Données du mode live encore manquantes |

Sous Windows (cmd/PowerShell), les commandes `*:demo`, `*:live` utilisent une affectation de
variable à la manière Unix ; utiliser Git Bash ou WSL, ou définir la variable avant
(`$env:BUSINESS_MODE="live"; npx astro build`). `npm run build` et `npm start` fonctionnent partout.

## Où modifier quoi

| Je veux changer… | Fichier |
|---|---|
| Contenus de la **démonstration** (entreprise, services, tarifs, FAQ, coordonnées fictives) | `src/content/demo.ts` |
| Textes d'interface propres à la démonstration (titres, mentions, simulations) | `src/i18n/demo.ts` |
| Données du **site réel** (nom, téléphone, prestations, prix, légal) | `src/content/business.ts` |
| Textes d'interface communs | `src/i18n/fr.ts` et `src/i18n/en.ts` (mêmes clés) |
| Adresses des pages et correspondance FR/EN | `src/i18n/routes.ts` |
| Photos | `src/assets/azurea/` (démo) ; voir [docs/ASSETS.md](docs/ASSETS.md) |
| Couleurs, typographie, boutons, formulaires | `src/styles/global.css` |

Règle des données du site réel : chaque information est soit `confirmed(valeur)`, soit
`unknown('note')`. Une information inconnue n'apparaît jamais en production ; en aperçu, elle
porte une étiquette « À confirmer ». Les valeurs `critical` bloquent le build de production.
Le jeu fictif ne peut jamais passer ce contrôle : il est marqué `fictional: true` et refusé
par `liveReadinessProblems` (testé).

Le mode est choisi **au build** (`BUSINESS_MODE`), pas à l'exécution. Les pages d'un build live
ne contiennent aucune donnée fictive (vérifié : `docs/preuves/live-build-checks.txt`). Limite
connue : le bundle serveur live embarque encore les objets fictifs comme code mort (jamais
rendus ni servis) ; voir REVIEW.md.

## Envoi des e-mails (mode live uniquement)

Fournisseur prévu : [Resend](https://resend.com) (API HTTP, clé côté serveur uniquement).

```bash
EMAIL_TRANSPORT=resend
RESEND_API_KEY=…              # jamais dans le dépôt
MAIL_TO=adresse-validee@…     # destinataire fixé côté serveur, non modifiable par un visiteur
MAIL_FROM="Site VTC <demandes@votre-domaine.fr>"   # domaine vérifié chez le fournisseur
```

En mode démo, ces variables sont **ignorées** : le serveur répond toujours « simulé » et
n'appelle jamais le fournisseur (prouvé avec une clé factice et `fetch` instrumenté :
`docs/preuves/demo-force-simulation.txt`). En live production sans fournisseur, l'endpoint
répond 503 : il n'annonce jamais une transmission qui n'a pas eu lieu.

## Variables

| Variable | Moment | Valeurs |
|---|---|---|
| `BUSINESS_MODE` | build | `demo` (défaut) · `live` |
| `SITE_ENV` | build | `preview` (défaut) · `production` (refusé en démo) |
| `SITE_URL` | build | domaine canonique ; obligatoire et non local en live production |
| `DEPLOY_TARGET` | build | `node` (défaut, serveur autonome) · `netlify` |
| `EMAIL_TRANSPORT`, `RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM` | exécution | live seulement, voir ci-dessus |
| `ALLOWED_ORIGINS` | exécution | origines supplémentaires autorisées à poster |
| `PORT`, `HOST` | exécution | 4321 et localhost par défaut |
| `TRUST_PROXY` | exécution | `true` derrière un proxy qui fournit `X-Forwarded-For` |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_S` | exécution | 5 demandes / 600 s par IP par défaut |

Modèle sans secret : [.env.example](.env.example).

## Déployer et revenir en arrière (site réel, plus tard)

Détails dans [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md). L'endpoint `/api/demandes` doit
s'exécuter sur un serveur (Node managé recommandé, Netlify en alternative). Revenir à une
version : `git revert <commit>` puis redéployer, ou redéployer une version précédente depuis
l'historique de la plateforme.

## Vérifier

```bash
npm test && npm run check
npm run build && npm run test:e2e
npm start &                    # dans un autre terminal, puis :
npm run verify:contrast        # lab/hero-contrast.json, lab/overlay-contrast.json
npm run verify:hero            # lab/hero-states/ : hero début, milieu, fin
npm run verify:captures        # docs/captures/*.png
AXE_PATH=/chemin/axe.min.js npm run verify:axe     # axe-core sur 14 états interactifs
bash scripts/verify/demo-simulation-proof.sh       # simulation forcée, aucun appel sortant
```

Protocole Scroll Craft (plugin `nateherk-design`) :

```bash
SC=~/.claude/plugins/cache/nateherk/nateherk-design/0.3.1/skills/scroll-craft
node $SC/scripts/doctor.mjs
SCROLLCRAFT_CHROME=/chemin/vers/chrome node $SC/scripts/shoot.mjs --url http://localhost:4321 --out lab/scrollcraft/desktop
SCROLLCRAFT_CHROME=/chemin/vers/chrome node $SC/scripts/shoot.mjs --url http://localhost:4321 --width 390 --height 844 --out lab/scrollcraft/mobile
SCROLLCRAFT_CHROME=/chemin/vers/chrome node $SC/scripts/shoot.mjs --url http://localhost:4321 --reduced-motion --out lab/scrollcraft/reduced
```

## Structure

```
src/
  content/        demo.ts (fictif), business.ts (réel), index.ts (choix du mode), types.ts, readiness*.ts
  i18n/           fr.ts, en.ts, demo.ts (surcharges de la démo), routes.ts
  lib/            validation.ts (client + serveur), summary.ts (récapitulatif), mail/, server/ (endpoint, protections)
  components/     home/ (sections de l'accueil), forms/, ContactAction (seul créateur de liens de contact), SimDialogs
  views/          une vue par page, partagée par FR et EN
  pages/          routes FR, en/ routes EN, api/demandes.ts (seule route serveur)
  vendor/scrollcraft/   moteur Scroll Craft copié tel quel (MIT)
  assets/         azurea/ (photos IA du kit), fonts/ (OFL)
demo-kit/         kit de démonstration fourni (textes, données, empreintes SHA-256)
scripts/          e2e.mjs, verify/ (contrastes, captures, axe, preuve de simulation), content-report.ts
scrollcraft/      brief Scroll Craft (BRIEF.md) et registre des empreintes
docs/             déploiement, assets, données, iPhone, questions, captures, preuves
```
