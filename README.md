# Site vitrine · Chauffeur VTC à Cannes (Tesla Model 3)

Site Astro + TypeScript : pages prérendues (FR à la racine, EN sous `/en/`), une seule
route serveur `/api/demandes` pour les formulaires Devis et Contact, hero animé avec le
moteur [Scroll Craft](https://github.com/nateherkai/scroll-craft) (MIT, non modifié).

> **Statut : aperçu, non publiable en l'état.** Le nom commercial, les coordonnées,
> les prestations, les prix, les informations légales et l'envoi réel des emails ne sont
> pas confirmés. Un build de production est volontairement refusé tant que ces éléments
> manquent (`npm run content:report` liste ce qui reste à fournir).

Revue indépendante : voir [REVIEW.md](REVIEW.md). Questions métier : [docs/QUESTIONS.md](docs/QUESTIONS.md).

## Démarrer

Prérequis : Node 22.12 ou plus.

```bash
npm ci
npm run dev            # http://localhost:4321, transport email "test" (rien n'est envoyé)
npm run build          # build d'aperçu (noindex, annotations « À confirmer »)
npm start              # sert le build : http://localhost:4321 (variables PORT et HOST)
```

En local, les formulaires fonctionnent en **mode test** : la demande est validée, l'email
est composé mais **pas envoyé**, et l'interface l'annonce comme une simulation.

## Où modifier quoi

| Je veux changer… | Fichier |
|---|---|
| Nom commercial, téléphone, email, WhatsApp, horaires, langues, zone, informations légales | `src/content/business.ts` (objet `business`) |
| Prestations, textes de chaque prestation, prix (forfait, indicatif, « à partir de ») | `src/content/business.ts` (`services`) |
| Conditions tarifaires (attente, péages, stationnement, nuit, paiement, annulation) | `src/content/business.ts` (`pricingConditions`) |
| Véhicule (génération, passagers max, bagages, photos) | `src/content/business.ts` (`vehicle`) |
| Questions fréquentes | `src/content/business.ts` (`faq`) |
| Textes de l'interface (titres, boutons, messages, erreurs) | `src/i18n/fr.ts` et `src/i18n/en.ts` (mêmes clés) |
| Adresses des pages et correspondance FR/EN | `src/i18n/routes.ts` |
| Illustrations du hero et de la Tesla | `scripts/art/*.mjs` puis `npm run art` (voir [docs/ASSETS.md](docs/ASSETS.md)) |
| Couleurs, typographie, boutons, formulaires | `src/styles/global.css` |

Règle des données : chaque information est soit `confirmed(valeur)`, soit `unknown('note')`.
Une information inconnue n'apparaît jamais en production. En aperçu, elle est signalée par une
étiquette jaune « À confirmer ». Les valeurs marquées `critical` bloquent le build de production.

Exemple, une fois le numéro validé :

```ts
phone: confirmed({ e164: '+33600000000', display: '06 00 00 00 00' }),
```

Le bouton « Appeler » apparaît alors automatiquement partout (hero, barre mobile, fin de page,
contact, pied de page). Même principe pour un prix :

```ts
price: confirmed({ amount: 85, kind: 'forfait' }),   // affiche « Forfait 85 € TTC »
```

### Photos réelles

1. Déposer les fichiers optimisés dans `public/photos/` (WebP ou JPEG, 1600 px de large au plus, droits d'utilisation écrits).
2. Chauffeur : `driver.photo: confirmed({ src: '/photos/chauffeur.webp', alt: { fr: '…', en: '…' } })`.
3. Véhicule et hero : procédure détaillée dans [docs/ASSETS.md](docs/ASSETS.md#remplacer-les-illustrations-par-des-photos).

## Envoi des emails

Fournisseur prévu : [Resend](https://resend.com) (API HTTP, clé côté serveur uniquement).
Variables (voir [.env.example](.env.example)) :

```bash
EMAIL_TRANSPORT=resend
RESEND_API_KEY=…              # jamais dans le dépôt
MAIL_TO=adresse-validee@…     # destinataire fixé côté serveur, non modifiable par un visiteur
MAIL_FROM="Site VTC <demandes@votre-domaine.fr>"   # domaine vérifié chez le fournisseur
```

- `EMAIL_TRANSPORT=test` (par défaut hors production) : rien n'est envoyé, réponse « simulée ».
- `EMAIL_TRANSPORT=fail` : échec forcé, pour tester l'affichage d'erreur.
- En production, sans fournisseur configuré, l'endpoint répond **503** et l'interface
  affiche une erreur. Il n'annonce jamais une transmission qui n'a pas eu lieu.

Trois preuves distinctes (voir REVIEW.md) : validation du formulaire (testée), acceptation par
le fournisseur (non testée : pas de compte), réception dans une boîte autorisée (non testée).

## Configurations

| Variable | Moment | Valeurs |
|---|---|---|
| `SITE_ENV` | build | `preview` (défaut : noindex, robots `Disallow: /`, annotations) · `production` |
| `SITE_URL` | build | domaine canonique, obligatoire et non local en production |
| `DEPLOY_TARGET` | build | `node` (défaut, serveur autonome) · `netlify` |
| `EMAIL_TRANSPORT`, `RESEND_API_KEY`, `MAIL_TO`, `MAIL_FROM` | exécution | voir ci-dessus |
| `ALLOWED_ORIGINS` | exécution | origines supplémentaires autorisées à poster (aperçus) |
| `TRUST_PROXY` | exécution | `true` derrière un proxy qui fournit `X-Forwarded-For` |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_S` | exécution | 5 demandes / 600 s par IP par défaut |

```bash
npm run build:preview      # aperçu
npm run build:production   # échoue tant que des données critiques manquent (voulu)
npm run build:netlify      # variante Netlify
```

## Déployer et revenir en arrière

Résumé (détails, coûts et HTTPS dans [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)) :

- L'endpoint `/api/demandes` doit s'exécuter sur un serveur : un hébergement purement statique
  ne peut ni garder la clé du fournisseur secrète, ni envoyer l'email.
- Option recommandée : un service Node managé (un seul processus) avec domaine et HTTPS
  automatiques. Option alternative : Netlify (`npm run build:netlify`).
- Aucune souscription ni publication n'a été faite : c'est la décision de Noa.

Revenir à une version précédente :

```bash
git log --oneline                 # repérer la version voulue
git revert <commit>               # annule proprement un changement, puis redéployer
# ou, sur la plateforme : redéployer le déploiement précédent depuis son historique
```

Chaque mise en ligne devrait être étiquetée (`git tag v1.0.0 && git push --tags`) pour
retrouver facilement une version.

## Vérifier

```bash
npm test                 # tests unitaires (validation, endpoint, transports)
npm run check            # TypeScript / Astro
npm run build && npm run test:e2e        # navigateur réel sur le build (lab/e2e/results.json)
scripts/serve-local.sh && npm run verify:contrast   # contraste du hero sur l'image composée
npm run verify:captures  # captures dans docs/captures/ (PNG)
npm run content:report   # informations encore manquantes
```

Protocole Scroll Craft (plugin installé) :

```bash
SC=~/.claude/plugins/cache/nateherk/nateherk-design/0.3.1/skills/scroll-craft
node $SC/scripts/doctor.mjs
scripts/serve-local.sh
SCROLLCRAFT_CHROME=/chemin/vers/chrome node $SC/scripts/shoot.mjs --url http://127.0.0.1:4321 --out lab/scrollcraft/desktop
```

## Structure

```
src/
  content/        business.ts (données métier), types.ts, readiness*.ts (garde-fou production)
  i18n/           fr.ts, en.ts, routes.ts
  lib/            validation.ts (client + serveur), mail/ (composition, transports), server/ (endpoint, protections)
  components/     home/ (sections de l'accueil), forms/, en-tête, pied de page, etc.
  views/          une vue par page, partagée par FR et EN
  pages/          routes FR, en/ routes EN, api/demandes.ts (seule route serveur)
  vendor/scrollcraft/   moteur Scroll Craft copié tel quel (MIT)
  assets/         art/ (SVG générés), fonts/ (Bricolage Grotesque, Geist, OFL)
scripts/          art/ (générateur d'illustrations), e2e.mjs, verify/, serve-local.sh
scrollcraft/      brief Scroll Craft (BRIEF.md) et registre des empreintes
docs/             déploiement, assets, données, iPhone, questions, captures, preuves
```
