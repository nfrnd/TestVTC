# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| vtc-cannes (2026-10-03) | « Arrivée puis dossier » : une scène épinglée courte, puis chapitres en flux sur fonds tranchés clair/sombre | Deux pastilles vitrées flottantes (marque à gauche, navigation + action à droite), menu `<details>` sur mobile, barre d'action mobile | `pin` 1,6 + 4 plans `parallax` + véhicule roulant (roues liées au déplacement par `--sc-p`) | pin > flow (sélecteur) > flow+reveal > flow > flow > flow > flow ; 7,2 vh à 1440 | Invitation finale sur fond surface, phrase + bouton, rappel « rien n'est confirmé avant l'échange » | Sélecteur de trajets qui redessine un itinéraire abstrait et transmet le seul choix au devis | Illustration vectorielle crépuscule ardoise (provisoire, photos à venir) | 4321 |
| vtc-cannes · révision démo AZURÉA PRIVÉ (2026-10-03) | Inchangée : « Arrivée puis dossier » | Inchangé (pastilles vitrées, menu `<details>`, barre d'action mobile) + bandeau « Démonstration » fixe | `pin` 1,4 + 2 plans photo (plaque sans voiture + voiture détourée), échelles ×1,03 / ×1,09 autour du point de contact du pneu ; ultra-large : cadre calé sur la hauteur avec fondu | pin > flow (sélecteur) > flow > flow > flow (3 étapes) > flow > flow > flow ; 9,4 vh à 1440 | Inchangé, appel « Appeler Adrien » simulé | Inchangée | Photographique (images IA du kit, crépuscule sur la Croisette) | 4321 |

*(empty: your first build has nothing to clear, so build whatever the interview
points at. From the second onwards, this table is the constraint.)*

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- Grammaire « Arrivée puis dossier » (vtc-cannes).
- Signature : itinéraire abstrait redessiné par un choix de service, transmis au formulaire (vtc-cannes).
- Hero « véhicule qui roule » : translation + rotation des roues proportionnelle (vtc-cannes, itération 1).
- Hero « avancée de caméra à deux plans photo » sur pivot de contact commun (vtc-cannes, révision démo).

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
