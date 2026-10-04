# Déploiement, HTTPS, coûts

> **Démonstration AZURÉA PRIVÉ** : elle n'est pas destinée à une publication publique et son
> build de production est refusé. Pour la montrer à quelqu'un, la lancer en local (README) ou,
> si Noa le décide, sur un aperçu privé ; elle reste `noindex` dans tous les cas.
> Ce document concerne le **site réel** (`BUSINESS_MODE=live`).

> Rien n'a été souscrit ni publié. Les offres commerciales citées n'ont **pas pu être
> revérifiées en ligne** pendant cette session : le proxy réseau bloquait les sites des
> hébergeurs et des fournisseurs (netlify.com, resend.com, cloudflare.com, vercel.com,
> render.com, brevo.com, ovhcloud.com). Les montants ci-dessous sont des ordres de grandeur
> à confirmer par Noa sur les pages officielles avant toute décision.

## Pourquoi un hébergement purement statique ne suffit pas

Les pages sont des fichiers HTML prérendus, mais l'envoi d'une demande exige un code serveur :

1. **La clé du fournisseur d'email doit rester secrète.** Un site statique n'exécute que du
   code dans le navigateur du visiteur ; toute clé placée là est lisible par n'importe qui,
   qui pourrait alors envoyer des emails au nom du site.
2. **Le destinataire doit être fixé côté serveur.** Sinon un tiers pourrait détourner le
   formulaire vers d'autres adresses.
3. **La validation, l'anti-abus et la réponse honnête** (« transmis », « échec »,
   « non configuré ») dépendent de ce que répond réellement le fournisseur.

D'où une seule route rendue à la demande, `src/pages/api/demandes.ts` (`prerender = false`),
conformément à la documentation Astro « On-demand rendering » (lue dans le dépôt officiel
`withastro/docs`, docs.astro.build étant bloqué) : pages statiques par défaut, adaptateur
serveur, opt-out du prérendu sur la seule route qui en a besoin.

## Option A (recommandée) : serveur Node managé

Build : `BUSINESS_MODE=live SITE_ENV=production SITE_URL=https://www.votre-domaine.fr npx astro build`
(ou `npm run build:live:production` avec `SITE_URL` défini).
Démarrage : `npm start` (lit `PORT` et `HOST`, par exemple `HOST=0.0.0.0`).

- **Avantage clé** : un seul processus, donc la limitation de débit et l'anti-doublon en
  mémoire sont réellement cohérents. Pas de démarrage à froid sur une offre payante « toujours allumée ».
- Plateformes possibles (à comparer par Noa) : Scalingo ou Clever Cloud (hébergeurs
  français), Render, Railway, Fly.io, ou un petit VPS avec Caddy.
- Éviter les offres gratuites qui mettent le service en veille : la première demande après
  une période d'inactivité peut prendre plusieurs dizaines de secondes.
- Variables : celles de [.env.example](../.env.example), plus `TRUST_PROXY=true` si la
  plateforme passe l'IP du client dans `X-Forwarded-For`.
- **Derrière un proxy TLS**, la vérification d'origine d'Astro compare l'en-tête `Origin`
  (https) à l'URL vue par le serveur (souvent http). Si les formulaires renvoient 403 en
  production, déclarer le domaine dans `astro.config.ts` :
  `security: { checkOrigin: true, allowedDomains: [{ hostname: 'www.votre-domaine.fr', protocol: 'https' }] }`
  (option présente dans Astro 7.3.5, vérifiée dans `node_modules/astro`).

Exemple de proxy sur VPS (HTTPS automatique Let's Encrypt, compression, en-têtes) :

```caddyfile
www.votre-domaine.fr {
  encode zstd gzip
  header {
    Strict-Transport-Security "max-age=31536000"
    X-Content-Type-Options nosniff
    Referrer-Policy strict-origin-when-cross-origin
    X-Frame-Options DENY
    Permissions-Policy "camera=(), microphone=(), geolocation=()"
  }
  reverse_proxy 127.0.0.1:4321
}
votre-domaine.fr {
  redir https://www.votre-domaine.fr{uri} permanent
}
```

Le serveur Node sert déjà `/_astro/*` (fichiers à nom haché : CSS, JS, polices, SVG) avec
`Cache-Control: public, max-age=31536000, immutable` (vérifié dans
`node_modules/@astrojs/node/dist/serve-static.js`). Les pages HTML restent sans cache long, ce
qui permet de publier une correction immédiatement. Le serveur Node ne compresse pas : la
compression doit venir du proxy ou de la plateforme (Lighthouse le signale en local).

## Option B : Netlify

`npm run build:netlify` (vérifié : le build génère une fonction SSR et `_redirects`).
`public/_headers` fournit les en-têtes de sécurité et le cache des assets.

- Les pages sont servies par le CDN ; `/api/demandes` tourne dans une fonction.
- **Limite** : chaque instance de fonction a sa propre mémoire. Le compteur anti-abus et
  l'anti-doublon deviennent indicatifs. Protection réelle à prévoir : règles de limitation
  de débit de la plateforme (disponibilité selon l'offre, à vérifier) et en-tête
  `Idempotency-Key` déjà transmis au fournisseur d'email.
- Aperçus : les « deploy previews » restent en `SITE_ENV=preview` (noindex). Ajouter leur
  URL à `ALLOWED_ORIGINS`, ou configurer un contexte dédié.

Vercel n'est pas proposé : l'offre gratuite « Hobby » était réservée à un usage non
commercial selon ses conditions connues (à revérifier si l'option intéresse Noa).

## Domaine et HTTPS

1. Acheter le domaine (par exemple `.fr`) chez un registrar.
2. Le relier à la plateforme (enregistrement CNAME ou A/AAAA selon ses instructions).
3. Le certificat HTTPS est émis automatiquement par la plateforme (ou par Caddy).
4. Choisir une forme canonique (`www.` ou non), rediriger l'autre, et mettre cette URL
   exacte dans `SITE_URL`.
5. Vérifier le domaine d'envoi chez le fournisseur d'email (enregistrements SPF/DKIM),
   faute de quoi les demandes risquent d'arriver en spam ou d'être refusées.

## Aperçu et production

| | Aperçu | Production |
|---|---|---|
| `SITE_ENV` | `preview` | `production` |
| Indexation | `noindex, nofollow` sur toutes les pages, `robots.txt` → `Disallow: /` | `index, follow`, `robots.txt` + `sitemap.xml` |
| Données inconnues | étiquettes « À confirmer » visibles | build refusé si une donnée critique manque |
| Transport | `test` autorisé (réponses « simulées ») | `test` refusé ; sans fournisseur : 503 |
| JSON-LD LocalBusiness | omis tant que le nom n'est pas confirmé | émis avec les seules données confirmées |

## Coûts possibles (ordres de grandeur NON vérifiés)

| Poste | Ordre de grandeur | À vérifier |
|---|---|---|
| Domaine `.fr` | environ 10 à 20 € par an selon le registrar | prix de renouvellement, pas seulement la 1re année |
| Hébergement Node toujours allumé | environ 5 à 15 € par mois pour la plus petite offre payante | usage commercial autorisé, veille, région (UE), sauvegarde |
| Netlify | offre gratuite existante ; le mode de facturation a changé ces dernières années | quotas de fonctions, limitation de débit, usage commercial |
| Email (Resend) | offre gratuite avec quota mensuel et quotidien limité, connue pour couvrir un faible volume | quota actuel, localisation des données, DPA |
| Assets | 0 € à ce stade (illustrations originales) ; photos réelles : séance photo éventuelle | droits écrits du photographe et des personnes |
| Polices | 0 € (SIL Open Font License) | aucune |

## Revenir en arrière

- Git : `git revert <commit>` puis redéployer ; étiqueter chaque mise en ligne (`v1.0.0`…).
- Plateforme : la plupart conservent l'historique des déploiements et permettent de republier
  le précédent en un clic.
- Le contenu métier étant dans un seul fichier (`src/content/business.ts`), un retour
  arrière de données est un simple revert de ce fichier.
