# Plan court

## Direction
Hero sombre ardoise : la Tesla Model 3 noire arrive et se pose devant la baie de Cannes
(Esterel, Suquet), plans en profondeur, texte immobile, « Demander un devis » visible
d'emblée. Sections de lecture claires alternées avec deux passages sombres. Accent vert
d'eau réservé aux actions. Display : Bricolage Grotesque ; texte : Geist (2 familles, OFL, auto-hébergées).

## Parcours
Accueil → (sélecteur de trajet) → /devis?prestation=… → demande transmise → le chauffeur
rappelle avec tarif et disponibilité → confirmation hors site. Appeler / Contact en secondaire.

## Architecture
- Astro 7 + TypeScript, pages prérendues (FR à la racine, EN sous /en/ avec slugs traduits).
- Une seule route à la demande : `src/pages/api/demandes.ts` (`prerender = false`).
- Adaptateur `@astrojs/node` (standalone) : un seul processus Node, ce qui rend la limitation
  de débit et l'anti-doublon en mémoire réellement cohérents. (L'alternative Netlify a été retirée à l'itération 2 : dépendance inutile pour un serveur Node.)
- Données métier : `src/content/business.ts` (seul fichier à éditer pour coordonnées, services,
  tarifs, véhicule, horaires). Chaque valeur inconnue est `unknown()`, jamais une valeur fictive.
- Traductions : `src/i18n/fr.ts`, `src/i18n/en.ts`. Routes : `src/i18n/routes.ts`.
- Validation partagée client/serveur : `src/lib/validation.ts`.
- Transport email : `src/lib/mail/` (resend | test | fail), choisi côté serveur.
- Scroll Craft : moteur copié tel quel dans `src/vendor/scrollcraft/`, chargé seulement sur l'accueil.

## Contraintes
- Rien d'inventé : pas d'avis, de prix, de destinations, d'horaires, de langues.
- Mode aperçu (`SITE_ENV=preview`, défaut) : noindex + annotations « À confirmer ».
- Mode production (`SITE_ENV=production`) : le build échoue si des données critiques manquent,
  et l'endpoint refuse d'annoncer un envoi si le fournisseur n'est pas configuré.
- Sans JS : tout le contenu, le sélecteur (CSS), la FAQ, le menu et les formulaires (POST HTML).
- Reduced motion : composition statique complète, aucun déplacement.
