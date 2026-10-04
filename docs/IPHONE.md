# Vérification sur un vrai iPhone (à faire par Noa)

Les tests automatisés ont tourné dans Chromium headless. Ni WebKit/Safari ni un appareil réel
n'ont été utilisés : ce contrôle reste à faire. Durée : environ 10 minutes.

## Préparer

- Le site doit être accessible depuis le téléphone : un aperçu déployé (recommandé), ou,
  sur le même Wi-Fi, `HOST=0.0.0.0 ALLOWED_ORIGINS=http://<IP-de-l-ordinateur>:4321 npm start`
  sur l'ordinateur puis `http://<IP-de-l-ordinateur>:4321` sur l'iPhone (sans `ALLOWED_ORIGINS`,
  les simulations de formulaire sont refusées par le contrôle d'origine). Arrêter le serveur ensuite.
- Noter le modèle d'iPhone et la version d'iOS.

## Parcourir

1. **Accueil, premier écran** : le bandeau « Démonstration — entreprise et tarifs fictifs »,
   le titre « Votre chauffeur privé à Cannes. », le bouton « Demander un devis » et, sous le
   texte, la photo de la Tesla **entière** (aucune roue coupée). Toucher le bouton : la page
   Devis s'ouvre.
2. **Défilement** : sur téléphone, le hero n'est pas épinglé (photo unique, flux naturel) ;
   le défilement n'est jamais bloqué, rien ne saute pendant le chargement des photos.
   Sur iPad en paysage, vérifier aussi le hero en calques : la voiture grandit doucement
   devant la baie, ses roues restent posées au sol, le texte ne bouge pas.
3. **Barre d'action en bas** (« Appeler » + « Demander un devis ») : invisible sur le hero,
   visible ensuite, au-dessus de la barre d'accueil de l'iPhone, sans cacher de texte.
4. **Appeler / WhatsApp / e-mail** (page Contact) : chaque bouton ouvre une **fenêtre de
   simulation** ; l'application Téléphone, WhatsApp ou Mail ne doit **jamais** s'ouvrir.
   « Copier le message » copie le texte d'exemple ; la fenêtre se ferme avec « Fermer » ou
   « Compris ».
5. **Prestations** : toucher chaque prestation ; le résumé, les prix et le lien changent ;
   le bouton ouvre le devis avec la prestation présélectionnée.
6. **Menu** : ouvrir, choisir « EN », vérifier qu'on arrive sur la page anglaise équivalente.
7. **Formulaire de devis** : « Remplir un exemple fictif » remplit la date (dans 7 jours) et
   10:30 ; champs date et heure natifs ; pas de zoom automatique en touchant un champ ; la
   barre d'action ne recouvre aucun champ ; « Continuer » sans rien remplir affiche les
   erreurs **lisibles** sous les champs ; « Simuler ma demande de devis » affiche le
   récapitulatif et « Simulation réussie. Aucun message n'a été envoyé et aucun trajet n'est
   réservé. »
8. **Réglages > Accessibilité > Mouvement > Réduire les animations** activé : recharger ;
   le hero est statique et complet, sans espace de défilement vide.
9. **Taille du texte** augmentée (Réglages > Luminosité > Taille du texte) : rien ne se
   chevauche.
10. **VoiceOver** (facultatif) : le titre, les boutons et les champs sont annoncés avec leur
    libellé ; une fenêtre de simulation ouverte est annoncée comme une boîte de dialogue.

## Rapporter

Pour chaque point : OK / problème, avec une capture d'écran (bouton latéral + volume haut)
et le modèle/la version d'iOS. Ne pas considérer ce contrôle comme fait tant que ce
rapport n'existe pas.
