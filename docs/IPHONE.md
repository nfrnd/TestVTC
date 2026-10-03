# Vérification sur un vrai iPhone (à faire par Noa)

Les tests automatisés ont tourné dans Chromium headless. Ni WebKit/Safari ni un appareil réel
n'ont été utilisés : ce contrôle reste à faire. Durée : environ 10 minutes.

## Préparer

- Le site doit être accessible depuis le téléphone : un aperçu déployé (recommandé), ou,
  sur le même Wi-Fi, `HOST=0.0.0.0 npm start` sur l'ordinateur puis
  `http://<IP-de-l-ordinateur>:4321` sur l'iPhone. Arrêter le serveur ensuite.
- Noter le modèle d'iPhone et la version d'iOS.

## Parcourir

1. **Accueil, premier écran** : le titre, « Chauffeur VTC · Cannes », la mention de la
   Tesla Model 3 et le bouton « Demander un devis » sont visibles sans attendre. Toucher le
   bouton : la page Devis s'ouvre.
2. **Défilement du hero** : faire glisser lentement. La voiture avance un peu, les roues
   tournent, le décor glisse en profondeur, le texte ne bouge pas, rien ne saccade, et le
   défilement n'est jamais bloqué. Recommencer en mode économie d'énergie.
3. **Barre d'action en bas** : invisible tant que le bouton du hero est à l'écran, visible
   ensuite, au-dessus de la barre d'accueil de l'iPhone (zone sûre), sans cacher de texte.
4. **Trajets** : toucher chaque type de trajet ; le motif et le résumé changent ; le bouton
   ouvre le devis avec le trajet présélectionné.
5. **Menu** : ouvrir, choisir « English version », vérifier qu'on arrive sur la page
   anglaise équivalente.
6. **Formulaire de devis** : champs date et heure natifs ; clavier numérique pour les
   passagers et le téléphone ; clavier email pour l'email ; pas de zoom automatique en
   touchant un champ ; la barre d'action ne recouvre aucun champ ; « Continuer » sans rien
   remplir affiche les erreurs sous les champs ; « Modifier le trajet » conserve la saisie.
   Envoyer : le message affiché doit être celui du mode test (aperçu) ou celui de
   transmission (production configurée).
7. **Réglages > Accessibilité > Mouvement > Réduire les animations** activé : recharger ;
   le hero est statique et complet, sans espace de défilement vide.
8. **Taille du texte** augmentée (Réglages > Luminosité > Taille du texte) : rien ne se
   chevauche.
9. **VoiceOver** (facultatif) : le titre, les boutons et les champs sont annoncés avec leur
   libellé.

## Rapporter

Pour chaque point : OK / problème, avec une capture d'écran (bouton latéral + volume haut)
et le modèle/la version d'iOS. Ne pas considérer ce contrôle comme fait tant que ce
rapport n'existe pas.
