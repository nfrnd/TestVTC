# Questions métier à faire valider par le chauffeur

> Ces questions concernent le **site réel** (`BUSINESS_MODE=live`). Aucune ne bloque la
> démonstration AZURÉA PRIVÉ, dont toutes les informations sont fictives et fournies par le kit.

Regroupées par effet sur le site. Chaque réponse se reporte dans `src/content/business.ts`
(voir README). `npm run content:report` affiche ce qui reste ouvert.

## Bloquant pour la publication

1. **Nom commercial** affiché sur le site (sinon : « Chauffeur privé · Cannes »).
2. **Téléphone professionnel** (active le bouton « Appeler » partout) et **email public**.
3. **WhatsApp** : est-il réellement utilisé pour les réservations ? Si oui, quel numéro ?
4. **Prestations réellement proposées** parmi : aéroport/gare, trajets à Cannes,
   déplacements professionnels, événements, mise à disposition. À retirer ou à reformuler ?
5. **Adresse email qui reçoit les demandes** (variable serveur `MAIL_TO`) et accord pour
   ouvrir un compte chez un fournisseur d'envoi (Resend proposé).
6. **Informations légales** : nom/raison sociale, statut, SIRET, numéro d'inscription au
   registre des exploitants VTC, adresse, TVA ou franchise, directeur de la publication,
   médiateur de la consommation, assurance RC pro.
7. **Hébergeur retenu** et **fournisseur d'email** (pour les mentions et la confidentialité).
8. **Durée de conservation** des demandes reçues par email.
9. **Nom de domaine** souhaité.

## Pour compléter les contenus

10. **Prix** : pour chaque prestation, forfait, prix indicatif ou « à partir de » ? Montants TTC ?
11. **Conditions** : attente incluse ?, péages, stationnement, majorations de nuit /
    dimanche / jours fériés, moyens de paiement, annulation.
12. **Destinations** au-delà de Cannes (aéroports, gares, villes) que vous acceptez de
    mentionner explicitement.
13. **Horaires / disponibilités** à afficher (sans promettre de 24 h/24 si ce n'est pas le cas).
14. **Langues parlées.**
15. **Véhicule** : année ou génération de la Model 3, nombre maximum de passagers,
    nombre de valises, équipements réellement disponibles (siège enfant ? chargeurs ?).
16. **Présentation du chauffeur** : prénom, quelques phrases validées, photo authentique.
17. **Photos réelles** de la voiture (extérieur de profil, intérieur) avec droits d'utilisation.
18. **Fiche Google** ou lien de carte à indiquer (facultatif).
19. **Avis clients** : uniquement s'ils existent et peuvent être sourcés (lien vers la source).
20. **Clientèle visée** : habitants, visiteurs, professionnels. Faut-il insister sur l'un d'eux ?
