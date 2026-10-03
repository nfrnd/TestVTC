# Assets : provenance, droits, remplacement

Aucune image externe n'est chargée : tout est servi par le site lui-même.

## Inventaire

| Asset | Fichier(s) | Provenance | Droits | Statut |
|---|---|---|---|---|
| Hero : ciel, Esterel, mer, Suquet, chaussée, palmes | `src/assets/art/{back,mid}-{desktop,mobile}.svg`, `road.svg`, `fronds.svg` | Illustration vectorielle **originale**, générée par code (`scripts/art/scene.mjs`) par Claude Code le 3 octobre 2026 | Création pour ce projet, sans élément tiers ; réutilisable librement par l'exploitant | **Provisoire** |
| Tesla Model 3 de profil (crépuscule et studio) | `src/assets/art/car-dusk.svg`, `car-studio.svg` | Illustration vectorielle **originale**, tracée à partir des proportions publiques du modèle (longueur ≈ 4,7 m, empattement 2 875 mm, hauteur ≈ 1,44 m), `scripts/art/car.mjs` | Création pour ce projet. Pas de logo Tesla. La forme du véhicule n'est utilisée que pour désigner le véhicule réellement employé | **Provisoire** |
| Logo provisoire (deux arrêts reliés) et favicon | `src/components/RouteMark.astro`, `public/favicon.svg` | Création originale | Libre | Provisoire, à remplacer si une identité existe |
| Image de partage | `public/og-image.png` | Capture du hero (`scripts/verify/captures.mjs`) | Comme le hero | Provisoire |
| Police Bricolage Grotesque (titres) | `src/assets/fonts/bricolage-grotesque-latin-wght.woff2` (41 Ko) | Paquet npm `@fontsource-variable/bricolage-grotesque` 5.3.0 | SIL Open Font License 1.1 (`LICENSE-bricolage-grotesque.txt`) | Définitif |
| Police Geist (texte) | `src/assets/fonts/geist-latin-wght.woff2` (29 Ko) | `@fontsource-variable/geist` 5.3.0 | SIL OFL 1.1 (`LICENSE-geist.txt`) | Définitif |
| Moteur Scroll Craft | `src/vendor/scrollcraft/scrollcraft.{js,css}` | nateherkai/scroll-craft 0.3.1, copie identique (SHA-256 vérifiés dans REVIEW.md) | MIT (`src/vendor/scrollcraft/LICENSE`) | Définitif |

Polices : uniquement le sous-ensemble latin (couvre les accents français, « œ », « € »),
fichiers variables WOFF2, préchargés, avec piles de secours système dans `global.css`.

## Pourquoi des illustrations et pas des photos

Les vraies photos de la Tesla et du chauffeur n'ont pas été fournies, et le budget de
génération est nul. Pendant cette session, le proxy bloquait toutes les banques d'images
(Wikimedia Commons, Unsplash, Pexels, Pixabay, Flickr, Openverse) et Hugging Face. Montrer
la photo d'une autre Tesla aurait laissé croire qu'il s'agit du véhicule du chauffeur.
L'illustration est donc étiquetée « Illustration » dans le hero, dans la légende de la
section Tesla et dans le pied de page, et les mentions légales précisent qu'il ne s'agit pas
de photographies.

**Génération du modèle** : le profil dessiné correspond à la silhouette commune à la Model 3
2017-2023 et à la version 2024+ (« Highland »). La face avant (phares fins) se rapproche de
la version 2024+. La même silhouette est utilisée partout. Dès que la génération réelle est
connue (`vehicle.generation`), le détail des phares et des jantes pourra être ajusté dans
`scripts/art/car.mjs` (ou les photos remplaceront le dessin).

## Remplacer les illustrations par des photos

Le hero est construit en plans indépendants (méthode `hero-depth.md` de Scroll Craft). Chaque
plan peut recevoir une photo :

| Plan | Aujourd'hui | Photo à fournir | Contrainte |
|---|---|---|---|
| Fond | `back-*.svg` | Plaque de fond : baie de Cannes au crépuscule, **sans voiture** | 2400 × 1350 (ordinateur), 1200 × 2133 (mobile), horizon vers 60 % de la hauteur |
| Plan intermédiaire | `mid-*.svg` (mer, Suquet) | Optionnel : peut être fusionné dans la plaque de fond | Fond transparent si conservé séparé |
| Sujet | SVG en ligne `car-dusk.svg` | **Détourage réel** (PNG ou WebP avec transparence) de la Tesla noire de profil, roues comprises | Même cadrage de profil, face vers la gauche, ombre de contact séparée ou incluse |
| Premier plan | `fronds.svg` | Palme ou détail réel détouré | Transparent, bord adouci |

Procédure :

1. Faire photographier la voiture de profil, de nuit ou au crépuscule, sur fond simple
   (facilite le détourage), plus quelques détails (jante, toit en verre, intérieur).
2. Détourer, vérifier les bords sur fond clair et sur fond sombre (pas de halo), exporter
   en WebP avec transparence, 1600 px de large au plus.
3. Dans `src/components/home/Hero.astro`, remplacer le bloc `<figure class="hero__car">`
   par un `<img>` du détourage (garder `role`/`alt` descriptif) ; retirer alors les variables
   de rotation des roues (`--wheel-turn`) : une photo ne fait pas tourner ses roues. Le
   déplacement horizontal peut rester, ou être réduit.
4. Remplacer les plaques de fond dans le même composant (balise `<picture>`).
5. Section Tesla : remplacer `car-studio.svg` par une photo réelle dans
   `src/components/home/Tesla.astro`, et changer la légende.
6. Relancer `npm run build`, `npm run verify:contrast` (le contraste dépend de la photo) et
   les captures.

Exigences pour les photos réelles : droits écrits (photographe et, pour le chauffeur, accord
de la personne), pas de plaque d'immatriculation lisible si non souhaitée, pas d'autre
marque ni de personne identifiable sans accord.

## Régénérer les illustrations

```bash
npm run art      # réécrit src/assets/art/*.svg à partir de scripts/art/*.mjs
```

Les SVG sont minifiés. Poids : 2 à 17 Ko par plan, 12 Ko par voiture.
