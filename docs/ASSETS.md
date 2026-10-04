# Assets : provenance, droits, remplacement

Aucune image externe n'est chargée : tout est servi par le site lui-même.

## Photographies de la démonstration (mode `demo`)

**Toutes générées par IA**, fournies par Noa dans le kit `azurea-prive-claude-demo-v2`
(`demo-kit/assets-manifest.json` : `"allImagesAreAIGenerated": true`). Elles représentent un
scénario fictif : AZURÉA PRIVÉ et Adrien Morel n'existent pas. Le site l'indique près de chaque
image (« Image générée par IA », « Portrait généré par IA, personnage fictif », « Images générées
par IA pour la démonstration ») et dans le pied de page. Elles ne servent qu'en mode démo et ne
doivent pas être présentées comme le véhicule ou le chauffeur réels d'une entreprise.

| Fichier (`src/assets/azurea/`) | Rôle | Provenance (manifeste du kit) | Taille | Contrôle SHA-256 |
|---|---|---|---|---|
| `hero-background.webp`, `-960` | Hero, plaque de fond **sans voiture** (calque arrière) | `new_ai_edit` | 1672×941, 960×540 | identique au kit |
| `hero-car-alpha.webp`, `-960` | Hero, voiture **détourée** (calque avant, alpha réel) | `new_ai_edit` | 1672×941, 960×540 | identique au kit |
| `hero-desktop.webp`, `-960` | Hero composé, tablettes et fenêtres étroites | `new_ai_generation` | 1672×941, 960×540 | identique au kit |
| `hero-mobile.webp`, `-720` | Hero portrait, téléphones (photo entière 4:5, titre dans son ciel) | `new_ai_generation` | 1122×1402, 720×900 | identique au kit |
| `vehicle-profile.webp` | Section Tesla, profil | `reused_ai_azurea_v1` | 1536×1024 | identique au kit |
| `vehicle-profile-960.webp` | Même image, petite largeur | **régénérée** (voir ci-dessous) | 960×640 | différente (attendu) |
| `interior.webp`, `-960` | Section Tesla, habitacle | `reused_ai_azurea_v1` | 1536×1024, 960×640 | identique au kit |
| `driver.webp`, `-720` | Portrait du chauffeur fictif | `reused_ai_azurea_v1` | 1122×1402, 720×900 | identique au kit |

Contrôle : `docs/preuves/assets-sha256.txt` (empreintes recalculées contre `demo-kit/SHA256.json`).

**Défaut du kit** : `assets/web/vehicle-profile-960.webp` fait **0 octet** dans le zip reçu. Son
empreinte dans `SHA256.json` est celle d'un fichier vide (`e3b0c442…b855`), alors que le
manifeste annonce 57 012 octets. Le fichier a été régénéré par redimensionnement de
`vehicle-profile.webp` (ImageMagick, 960×640, WebP, 51 882 octets). Aucune autre image n'a été
modifiée ; les originaux PNG du kit ne sont pas copiés dans le dépôt (seulement les versions web).

### Calques du hero

La plaque et la voiture partagent le même cadre (1672×941) et la même perspective. Elles sont
affichées dans un même conteneur, à la même échelle de base, et grandissent autour du **point de
contact du pneu avant** (68,8 % ; 88,8 % du cadre). La voiture ne flotte donc jamais. Zone
occupée par la voiture dans le cadre, mesurée sur le canal alpha : x 542 à 1576, y 340 à 850.
Ces valeurs sont utilisées par les tests (`scripts/e2e.mjs`, constante `CAR`) pour vérifier
que la voiture reste entière au début et à la fin du mouvement, de 1100 à 2560 px de large.

Une seule composition est téléchargée selon l'écran : les deux calques sur grand écran paysage
(`min-width: 1100px` et ratio ≥ 3/2), sinon une seule photo (vérifié par les tests e2e).

## Polices, logo, moteur

| Asset | Fichier(s) | Provenance | Droits |
|---|---|---|---|
| Police Bricolage Grotesque (titres) | `src/assets/fonts/bricolage-grotesque-latin-wght.woff2` | `@fontsource-variable/bricolage-grotesque` 5.3.0 | SIL OFL 1.1 (`LICENSE-bricolage-grotesque.txt`) |
| Police Geist (texte) | `src/assets/fonts/geist-latin-wght.woff2` | `@fontsource-variable/geist` 5.3.0 | SIL OFL 1.1 (`LICENSE-geist.txt`) |
| Logo provisoire (deux arrêts reliés) et favicon | `src/components/RouteMark.astro`, `public/favicon.svg` | Création originale (itération 1) | Libre ; à remplacer si une identité existe |
| Image de partage | `public/og-image.png` | Capture du hero démo (`scripts/verify/captures.mjs`) | Comme le hero (image IA) |
| Moteur Scroll Craft | `src/vendor/scrollcraft/scrollcraft.{js,css}` | nateherkai/scroll-craft 0.3.1, copie identique (SHA-256 dans REVIEW.md) | MIT (`src/vendor/scrollcraft/LICENSE`) |

Les illustrations vectorielles provisoires de l'itération 1 (`src/assets/art/`, `scripts/art/`)
ont été supprimées : elles ne sont plus utilisées (historique Git, commit `a3537fe`).

## Site réel (mode `live`) : photos à fournir

Aucune photo réelle n'a été fournie. Pour le site réel, il faudra des photos **du véhicule
réellement utilisé** et du chauffeur, avec une autorisation d'utilisation écrite. Les photos IA
de la démonstration ne doivent pas être reprises telles quelles sur le site réel.

Procédure pour un futur hero photo réel :

1. Photo complète du véhicule devant un décor, en paysage (≥ 1672 px de large) et en portrait.
2. Pour le hero en calques : une plaque du même cadrage **sans** le véhicule (prise de vue sur
   pied, même focale) et un détourage du véhicule avec un vrai canal alpha. Sans ces deux
   fichiers, utiliser la photo complète seule : le code bascule déjà en photo unique sur mobile.
3. Exporter en WebP (une grande et une petite largeur), placer les fichiers dans `src/assets/`,
   mettre à jour les imports de `src/components/home/Hero.astro`, mesurer la nouvelle zone
   du véhicule (constante `CAR` de `scripts/e2e.mjs`) et le point de contact du pneu
   (`transform-origin` dans `Hero.astro`).
4. Relancer `npm run test:e2e`, `npm run verify:contrast` et `npm run verify:captures`.
