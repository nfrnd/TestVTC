# Données personnelles : ce que fait réellement le code

## Mode démonstration (`BUSINESS_MODE=demo`, build actuel)

- Les formulaires Devis et Contact sont **simulés par le serveur** : la demande est validée,
  un récapitulatif est renvoyé au navigateur, **rien n'est envoyé ni stocké**. Le fournisseur
  d'e-mail n'est jamais appelé, même si une clé est configurée
  (`docs/preuves/demo-simulation-proof.txt` : 0 appel sortant, espion vérifié par un témoin positif).
- Le contenu de la demande ne quitte le navigateur que pour cet aller-retour (POST, jamais dans
  l'URL). Il n'est **pas journalisé** : le journal contient seulement le mode, le type, le
  résultat, le code HTTP et la durée (test unitaire « logs no personal data »).
- Mémoire du processus : identifiant aléatoire de la demande (anti-doublon) et adresse IP avec
  horodatages (limitation de débit), au plus 30 minutes, comme en mode live.
- Sans JavaScript, le formulaire poste vers `/api/demandes` et le serveur répond par une page
  HTML de récapitulatif. Limite : pour corriger une saisie, il faut revenir en arrière dans le
  navigateur (les champs sont en général conservés par le navigateur, sans garantie).
- Appeler, WhatsApp et e-mail ouvrent une fenêtre de simulation : aucun lien `tel:`, `mailto:`
  ou `wa.me` n'existe dans les pages démo (vérifié sur 8 pages par les tests e2e).
- La page « Confidentialité de la démonstration » reprend ces points. Les coordonnées affichées
  (06 39 98 12 34, bonjour@azurea-prive.example) sont fictives ; le domaine `.example` est
  réservé et ne peut recevoir aucun courrier.

Le reste de ce document décrit le **mode live** (site réel).

À faire valider par le responsable de l'activité (et, si besoin, un conseil). Ce document
décrit l'implémentation, il ne constitue pas un avis juridique.

## Collecte

| Formulaire | Champs obligatoires | Facultatifs |
|---|---|---|
| Devis (`/devis`) | départ, arrivée, date, heure (Europe/Paris), passagers, nom, moyen de réponse, l'email **ou** le téléphone correspondant | type de trajet, l'autre coordonnée, bagages, vol/train, retour, autre demande |
| Contact (`/contact`) | nom, moyen de réponse, coordonnée correspondante, message | l'autre coordonnée |

Pas de compte, pas de paiement, pas de géolocalisation, pas de pièce jointe. Les longueurs
sont limitées (`src/lib/validation.ts`, `LIMITS`) et le corps d'une requête à 16 Ko.

## Traitement

1. Le navigateur envoie la demande en POST à `/api/demandes` (jamais en GET : pas de données
   personnelles dans l'URL, vérifié par le test « no JavaScript »).
2. Le serveur valide, compose un email (texte + HTML échappé) et le remet au fournisseur
   configuré. **Rien n'est stocké** sur le serveur : ni base de données, ni fichier.
3. Mémoire du processus, pour 30 minutes au plus : l'identifiant aléatoire de la demande et
   son statut (anti-doublon), et l'adresse IP avec les horodatages des requêtes (limitation
   de débit, fenêtre de 10 minutes). Aucun contenu de demande n'y est conservé.
4. Journaux : une ligne JSON par requête avec le type, le résultat, le code HTTP et la durée.
   **Ni trajet, ni nom, ni coordonnées** (vérifié par un test unitaire). L'hébergeur peut
   tenir ses propres journaux d'accès (IP, URL), à préciser dans la politique.

## Destinataires

- Le chauffeur (adresse `MAIL_TO`, fixée côté serveur).
- Le fournisseur d'email (Resend prévu) en tant que sous-traitant : vérifier sa localisation,
  son DPA et le mécanisme de transfert hors UE le cas échéant.
- L'hébergeur.

## Conservation

Non décidée : `business.legal.retention` est un champ bloquant. Pour mémoire, la CNIL
retient souvent trois ans à compter du dernier contact pour des données de prospects ;
la durée pertinente ici (demandes de devis, éventuels échanges commerciaux et obligations
comptables si le trajet a lieu) est à fixer par le responsable. La conservation se fait
dans la boîte email du chauffeur, à purger selon la durée retenue.

## Cookies et traceurs

Vérifié par le test « no third-party requests and no cookies/storage on any page » :
aucune requête vers un domaine tiers, aucun cookie, aucun `localStorage`/`sessionStorage`.
Pas d'outil de mesure d'audience, pas de publicité, pas de widget social, pas de carte
intégrée (la carte Google, si fournie, est un simple lien externe). Dans ces conditions, la
règle de la CNIL sur les traceurs (consentement préalable sauf traceurs strictement
nécessaires) ne s'applique pas, et aucun bandeau n'est ajouté. La page CNIL citée dans le
brief n'a pas pu être relue pendant la session (accès bloqué) ; à revoir si un outil de
mesure ou une carte intégrée est ajouté plus tard.

Remarque : l'adaptateur Node signale au build « Enabling sessions with filesystem storage ».
La fonction de sessions d'Astro n'est **pas utilisée** par le site : aucun cookie de
session n'est émis (vérifié en test).

## Information près des formulaires

Une phrase sous chaque formulaire, avec un lien vers `/confidentialite`, dont la structure
(responsable, finalité, base légale art. 6.1.b RGPD, destinataires, conservation, droits,
CNIL) est prête et dont les éléments manquants sont marqués « [À compléter] ».
