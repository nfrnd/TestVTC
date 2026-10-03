# BRIEF : site vitrine, chauffeur VTC à Cannes

> **Auto-rédigé sous délégation créative explicite.** (« Je te délègue explicitement les
> choix créatifs et techniques réversibles à l'intérieur de ce cadre. ») Aucune citation
> du chauffeur n'est inventée. Ce qui suit distingue **FAIT** (fourni par Noa),
> **DÉCISION** (choix créatif ou technique délégué, réversible) et **HYPOTHÈSE** (à confirmer).

Projet piloté par Noa · développement Claude Code · revue indépendante prévue : ChatGPT.
Scroll Craft 0.3.1 (nateherk-design), installé via `claude plugin install nateherk-design@nateherk`.
Le code du site vit dans la racine du dépôt (Astro). Ce dossier contient seulement le brief Scroll Craft.

## Faits confirmés

- Activité : chauffeur VTC à Cannes.
- Véhicule : Tesla Model 3 noire.
- Besoins : prestations, tarifs, chauffeur, coordonnées, page Contact, page Devis personnalisé.
- Positionnement : élégant, contemporain, rassurant, mémorable.
- Action principale unique : « Demander un devis ». Secondaire : « Appeler » (si numéro réel).
- Le devis est une demande étudiée ; la confirmation du trajet intervient ensuite.
- Palette de départ fournie : #11191D, #1C292F, #F4F6F4, #BECCC9, accent #A8D5CC, #112622.

## Restant à confirmer (bloque seulement ce qui en dépend)

Nom commercial, téléphone, email, WhatsApp, prix, prestations exactes, destinations
desservies, horaires, langues, capacité passagers et bagages, génération de la Model 3,
photos réelles, informations légales (SIRET, registre VTC, médiateur, hébergeur).

## Les huit sujets Scroll Craft

1. **Ambiance en 3 à 5 mots** (DÉCISION) : arrivée sereine, crépuscule méditerranéen, ardoise.
   Références hors web : les affiches PLM de la Côte d'Azur (cadrage, horizon bas, silhouettes
   de l'Esterel), la photographie automobile de nuit à lumière rasante, la typographie
   des cartes d'embarquement.
2. **Parcours** (FAIT, tiré du brief de Noa) : première impression (Cannes + la Tesla) →
   compréhension (les trajets) → confiance (véhicule, chauffeur, faits) → décision (tarifs, devis).
3. **Courbe d'énergie** (DÉCISION) : le hero porte le seul moment fort ; tout le reste est calme,
   lisible, sans pinning. Le devis n'est jamais retardé.
4. **Ressenti, étape par étape, et le moment unique** : voir la courbe ci-dessous. Le moment
   dont on se souvient : la Tesla noire qui avance et se pose devant la baie pendant que
   le texte reste immobile.
5. **Ce que ce site fait et qu'aucun autre ne fait** (DÉCISION) : choisir un type de trajet
   redessine un itinéraire abstrait (pas une carte), et le bouton emporte ce choix dans le devis.
6. **Distance au premium-minimal** (DÉCISION) : premium-minimal éditorial, contemporain,
   sans dorure ni néon.
7. **Un monde continu ou des scènes ?** (FAIT) : scènes distinctes, expérience courte.
8. **Assets disponibles** (FAIT) : aucun. Budget de génération : 0 €. Les banques d'images
   (Wikimedia, Unsplash, Pexels, Pixabay, Flickr, Openverse) et Hugging Face sont bloquées
   par le proxy de cette session. **DÉCISION** : illustration vectorielle originale réalisée
   par Claude Code, étiquetée « Illustration » sur le site, construite en calques
   remplaçables par de vraies photos (voir `docs/ASSETS.md`).

## Écart assumé avec Scroll Craft

`worlds.md` recommande un monde photographique et réserve l'illustration aux marques
illustrées. Sans photo autorisée accessible et sans budget, la seule option honnête est une
illustration provisoire originale ; une photo d'ambiance d'une autre Tesla présentée comme
celle du chauffeur serait trompeuse. L'architecture des calques (fond, sujet détouré,
premier plan) est celle que demande `hero-depth.md`, pour que des photos réelles détourées
prennent la place des SVG sans réécrire la scène.

## Grammaire

**« Arrivée puis dossier »** (DÉCISION, grammaire propre au projet) : une seule scène épinglée
et courte en ouverture, puis des chapitres en flux naturel sur des fonds tranchés (clair pour
lire, sombre pour respirer), une surface de travail (le sélecteur), une fin qui est un vrai
point d'action. Interdits : scrub vidéo, rail horizontal, crossfade de textes épinglés,
compteurs, curseur magnétique, défilement bloqué. Pourquoi les huit grammaires de référence
ne convenaient pas telles quelles : le filmic one-shot et le continuous world demandent des
vidéos (budget nul) et retardent l'action ; le chaptered editorial interdit le hero média ;
la galerie et le cutlist ne racontent pas un trajet ; le split stage et le live surface
conviennent seulement à une section (la surface de travail est reprise dans Services) ;
le poster typographique ne montre pas le véhicule, qui est un fait central.

## Parcours (beats)

1. Reconnaissance : « c'est un chauffeur, à Cannes, en Tesla, je peux demander un devis ».
2. Compréhension : « voici les trajets possibles, je choisis le mien ».
3. Confiance : « je sais dans quelle voiture je monte et à qui je parle ».
4. Clarté : « je sais comment le prix est établi : sur devis tant qu'il n'est pas publié ».
5. Décision : « je décris mon trajet, j'attends une réponse, rien n'est encore confirmé ».

## Courbe de ressenti (écrite avant les sections)

| Acte | Émotion | Ce qui la provoque à l'écran |
|---|---|---|
| Hero | Calme ébloui | La Tesla noire avance et se pose ; les plans de la baie glissent ; le texte ne bouge pas (`pin` court + `parallax` + roues liées à `--sc-p`) |
| Services | Curiosité active | Le visiteur choisit et l'itinéraire abstrait se redessine (signature, CSS `:has()` + tracé SVG) |
| Tesla | Assurance | Fond clair, profil net du véhicule qui se dévoile (`reveal`), faits courts |
| Chauffeur | Proximité | Passage sombre resserré, une personne, un seul interlocuteur (`flow` + `in`) |
| Tarifs | Clarté | Liste lisible, « Sur devis » assumé, conditions explicites |
| FAQ | Soulagement | Réponses courtes sur le déroulé (`details`) |
| Fin | Résolution | Une phrase, un bouton, le rappel que rien n'est confirmé avant l'échange |

Aucun couple d'actes adjacents ne partage la même émotion.

**Le pic** : le hero. « Sur le site, la Tesla arrive vraiment devant la baie de Cannes quand
on descend, et le bouton devis est là tout de suite. » Il reçoit le seul budget d'assets,
le seul épinglage, et le silence vient après (Services en flux calme).

**Phrase à raconter** : « C'est le site où la voiture arrive devant la baie et où on choisit
son trajet en traçant la route. »

**Silence volontaire** : aucun. Les sections après le hero sont en flux naturel, pas de dead scroll.

## Partition (device par beat)

| Beat | Device | Pourquoi |
|---|---|---|
| Reconnaissance | `pin` 1,6 + `parallax` (4 plans) + transforms CSS sur `--sc-p` | Une arrivée se joue sur un mouvement court et contrôlé |
| Compréhension | sélecteur (signature, page-local) + `in` | Le visiteur agit ; le texte et le bouton portent l'information |
| Confiance | `reveal` (gauche) | Le véhicule « apparaît » comme un changement d'état |
| Proximité | `flow` + `in` stagger | Lecture simple, ton humain |
| Clarté / soulagement | `flow` | Pas d'effet, la lisibilité est l'effet |
| Résolution | `in` + bouton | Une fin qui tient, pas un fondu |

Familles utilisées : pin, parallax, reveal, flow/in, signature (5). Jamais deux fois la même
de suite. Longueur totale : courte (≈ 7 à 9 écrans à 1440 px), sans remplissage.

## Gate des empreintes

Registre vide (premier build de ce workspace) : rien à franchir. Ligne ajoutée après livraison.
