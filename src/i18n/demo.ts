// Interface copy for BUSINESS_MODE=demo (fictional AZURÉA PRIVÉ scenario).
// Source: demo-kit/textes-fr-en.json, completed by demo-kit/docs/02-ENTREPRISE-ET-TEXTES-FR.txt
// (contact dialogs, error messages, result page). English strings marked
// "EN: Claude" have no source in the kit and were translated for this build.
import type { Dict } from './fr';

type DeepPartial<T> = T extends string ? string : T extends readonly unknown[] ? T : { [K in keyof T]?: DeepPartial<T[K]> };
export type DictOverride = DeepPartial<Dict>;

export const demoFr: DictOverride = {
  meta: {
    home: {
      title: 'AZURÉA PRIVÉ — Chauffeur privé à Cannes | Démonstration',
      description: 'Prototype fictif de chauffeur privé à Cannes en Tesla Model 3 noire : services, tarifs et simulation de demande de devis.',
    },
    rates: { title: 'Tarifs · AZURÉA PRIVÉ — Démonstration', description: 'Tarifs fictifs d’AZURÉA PRIVÉ, chauffeur privé à Cannes : forfaits, mise à disposition et conditions de la démonstration.' },
    quote: { title: 'Demande de devis · AZURÉA PRIVÉ — Démonstration', description: 'Simulation d’une demande de devis en deux étapes pour un trajet en Tesla Model 3 à Cannes. Rien n’est transmis.' },
    contact: { title: 'Contact · AZURÉA PRIVÉ — Démonstration', description: 'Coordonnées fictives d’Adrien Morel, chauffeur de démonstration à Cannes. Les contacts sont simulés.' },
    legal: { title: 'À propos de cette démonstration', description: 'AZURÉA PRIVÉ et Adrien Morel sont fictifs : cadre de la démonstration.' },
    privacy: { title: 'Confidentialité de la démonstration', description: 'Les formulaires de la démonstration ne transmettent ni ne conservent aucune donnée.' },
    sent: { title: 'Simulation terminée', description: 'Aucune demande envoyée.' },
    simulated: { title: 'Simulation terminée', description: 'Aucune demande envoyée.' },
  },
  nav: { services: 'Services', vehicle: 'La Tesla', rates: 'Tarifs', driver: 'Votre chauffeur', contact: 'Contact', menuOpen: 'Ouvrir le menu', menuClose: 'Fermer le menu' },
  cta: {
    quote: 'Demander un devis',
    call: 'Appeler',
    callDriver: 'Appeler Adrien',
    callAria: 'Simulation d’appel vers',
    whatsapp: 'WhatsApp',
    whatsappWrite: 'Écrire sur WhatsApp',
    emailWrite: 'Écrire un e-mail',
    quoteThis: 'Demander ce trajet',
    vehicleLink: 'Découvrir la Tesla',
    contactDriver: 'Contacter Adrien',
    seeContact: 'Voir les coordonnées',
  },
  hero: {
    eyebrow: 'AZURÉA PRIVÉ · CHAUFFEUR INDÉPENDANT',
    title: 'Votre chauffeur privé à Cannes.',
    signature: 'Cannes, à votre rythme.',
    lede: 'Pour vos transferts, vos rendez-vous et vos journées sur la Riviera, retrouvez Adrien à bord d’une Tesla Model 3 noire. Un contact direct et un trajet préparé avec vous.',
    facts: ['Basé à Cannes', 'Français / English', 'Sur réservation'],
    caption: 'Image générée par IA',
    artLabel: 'Illustration IA d’une Tesla Model 3 noire sur la Riviera au crépuscule.',
  },
  services: {
    title: 'Un chauffeur pour les moments qui comptent.',
    intro: 'Un avion à prendre, une arrivée à organiser, un rendez-vous ou une journée à composer : décrivez votre programme, je prépare le trajet avec vous.',
    legend: 'Type de prestation',
  },
  tesla: {
    title: 'Le calme fait aussi partie du voyage.',
    intro: 'Une silhouette noire sobre, un habitacle épuré et un espace préparé pour votre trajet. Installez-vous et profitez de votre déplacement.',
    passengers: 'Passagers',
    luggage: 'Bagages',
    caption: 'Images générées par IA pour la démonstration.',
  },
  driver: {
    title: 'Adrien, du premier message à l’arrivée.',
    intro: 'Je m’appelle Adrien et je suis chauffeur indépendant à Cannes.',
    signature: 'Adrien Morel · Chauffeur indépendant à Cannes',
    base: 'Base',
    languages: 'Langues',
    hours: 'Contact',
  },
  how: {
    title: 'Votre trajet, en trois étapes.',
    note: 'Dans cette démonstration, seule la demande est simulée.',
    trustTitle: 'Les détails sont convenus avant le départ.',
    trust: ['Un interlocuteur identifié', 'Un tarif proposé avant confirmation', 'Des coordonnées et horaires accessibles'],
  },
  quote: {
    steps: [
      { t: 'Décrivez votre trajet.', d: 'Adresses, horaires, passagers et bagages : quelques informations suffisent pour commencer.' },
      { t: 'Recevez une proposition.', d: 'Le chauffeur précise la disponibilité, le tarif et les conditions correspondant à votre demande.' },
      { t: 'Confirmez votre réservation.', d: 'Après votre accord, vous recevez une confirmation écrite et les détails de prise en charge.' },
    ],
    title: 'Parlons de votre prochain trajet.',
    intro: 'Quelques détails pour préparer une proposition adaptée à votre programme.',
    notice: 'Démonstration : utilisez des informations fictives. Rien n’est transmis.',
    step1: 'Votre trajet',
    step2: 'Vos coordonnées',
    service: 'Type de prestation',
    serviceNone: 'Choisir une prestation',
    from: 'Lieu de départ',
    to: 'Destination',
    date: 'Date souhaitée',
    time: 'Heure de prise en charge',
    timeHint: 'Heure de Paris',
    passengers: 'Passagers',
    luggage: 'Bagages',
    tripType: 'Type de trajet',
    returnDate: 'Date de retour',
    returnTime: 'Heure de retour',
    duration: 'Durée souhaitée',
    program: 'Programme ou itinéraire envisagé',
    travelRef: 'Numéro de vol ou de train, facultatif',
    name: 'Votre nom',
    contactMethod: 'Comment souhaitez-vous être recontacté ?',
    byEmail: 'E-mail',
    byPhone: 'Téléphone',
    email: 'E-mail',
    phone: 'Téléphone',
    whatsapp: 'WhatsApp',
    message: 'Votre message, facultatif',
    next: 'Continuer',
    back: 'Retour au trajet',
    submit: 'Simuler ma demande de devis',
    sending: 'Simulation en cours…',
    example: 'Remplir un exemple fictif',
    summary: 'Récapitulatif de démonstration',
    resultTitle: 'Simulation terminée — aucune demande envoyée.',
    resultIntro: 'Voici le récapitulatif de votre trajet. Sur la version finale, il serait transmis au chauffeur pour préparer une réponse. Dans cette démonstration, aucune donnée n’a été envoyée et aucune course n’est réservée.',
    fareReference: 'Repère tarifaire de démonstration',
    privacy: 'Aucune donnée de ce formulaire n’est transmise à un chauffeur réel.',
    privacyLink: 'Confidentialité de la démonstration',
    directTitle: 'Un contact direct',
    directBody: 'Coordonnées fictives : les boutons ouvrent une simulation, aucun appel ni message n’est lancé.',
  },
  contact: {
    title: 'Un contact direct pour préparer la suite.',
    intro: 'Une question sur un trajet ou un programme ? Échangez directement avec Adrien.',
    hours: 'Disponibilités',
    phoneTitle: 'Un échange de vive voix.',
    phoneText: 'Tous les jours, de 7 h à 22 h. Les trajets peuvent être organisés à d’autres horaires sur réservation et selon disponibilité.',
    whatsappTitle: 'Les détails, à votre rythme.',
    whatsappText: 'Adresse, date, horaires ou question pratique : préparez votre message avec les informations utiles.',
    emailTitle: 'Un programme à partager.',
    emailText: 'bonjour@azurea-prive.example',
    zoneTitle: 'Cannes comme point de départ.',
    areaBase: 'Cannes, Mougins, Antibes, Nice et Monaco. Pour une autre destination, précisez votre itinéraire dans la demande de devis.',
    zoneNote: 'Prises en charge sur rendez-vous. Aucun bureau d’accueil dans cette démonstration.',
    formTitle: 'Écrire à Adrien',
    message: 'Votre message',
    submit: 'Simuler mon message',
  },
  sim: {
    callTitle: 'Appel de démonstration.',
    callText: 'Sur le site final, ce bouton ouvrira l’application Téléphone avec le numéro du chauffeur. Aucun appel n’est lancé ici.',
    waTitle: 'Exemple de message WhatsApp.',
    waText: 'Bonjour Adrien, je souhaite organiser un trajet de Cannes-centre vers l’aéroport de Nice, pour 2 personnes avec 2 valises. Pouvez-vous me préciser vos disponibilités et le tarif ? Je vous communiquerai la date et l’heure souhaitées.',
    waNote: 'Exemple local : aucun message n’est envoyé et aucune conversation externe n’est ouverte.',
    mailTitle: 'Exemple d’e-mail.',
    mailTo: 'bonjour@azurea-prive.example',
    mailSubject: 'Demande de devis — trajet Cannes / aéroport de Nice.',
    mailBody: 'Bonjour Adrien, je souhaiterais un devis pour un trajet de Cannes-centre vers l’aéroport de Nice, pour 2 personnes avec 2 valises. Je préciserai la date et l’heure de prise en charge. Merci de m’indiquer les disponibilités et les conditions correspondantes. Bonne journée, Camille Démo.',
    mailNote: 'Exemple de démonstration ; aucune demande n’est envoyée à cette adresse.',
    understood: 'Compris',
  },
  fares: {
    title: 'Des repères clairs pour préparer votre trajet.',
    intro: 'Des forfaits pour les trajets fréquents, une proposition personnalisée pour vos autres programmes.',
    demoLabel: 'Tarifs fictifs pour tester le site.',
    oneWay: 'Aller simple, par véhicule',
    perHour: '/ heure',
    minimum: 'Minimum {hours} heures, soit {total}',
    custom: 'Sur devis',
    other: 'Autre trajet',
    night: 'Entre {start} et {end} : majoration fictive de {rate} %.',
    conditions: 'Voir les tarifs et conditions',
  },
  pricing: {
    title: 'Tarifs',
    conditionsTitle: 'Conditions de la démonstration',
    conditionsIntro: 'Conditions fictives, identiques sur toutes les pages.',
    offerConditions: 'Inclus et conditions',
    ttc: '',
  },
  faq: { title: 'Avant de prendre la route.' },
  final: { title: 'Où souhaitez-vous aller ?', body: 'Votre point de départ, votre destination, vos horaires : préparons la suite ensemble.' },
  footer: {
    legal: 'À propos de cette démonstration',
    privacy: 'Confidentialité de la démonstration',
    contact: 'Contact',
    illustration: 'Prototype de démonstration · Entreprise, conducteur, tarifs et visuels fictifs.',
  },
  status: {
    quoteSent: 'Simulation réussie. Aucun message n’a été envoyé et aucun trajet n’est réservé.',
    simulated: 'Simulation réussie. Aucun message n’a été envoyé et aucun trajet n’est réservé.',
    contactSent: 'Message simulé. Aucun envoi n’a été effectué.',
    notConfirmed: '',
    failed: 'La simulation n’a pas abouti. Votre saisie est conservée ; vous pouvez réessayer.',
    invalid: 'Vérifiez les champs indiqués avant de continuer.',
    direct: 'Coordonnées fictives de la démonstration :',
  },
  errors: {
    datePast: 'Choisissez une date à venir.',
    email: 'Vérifiez le format de cette adresse e-mail.',
    durationMin: 'La mise à disposition commence à 3 heures dans cette démonstration.',
  },
  fieldErrors: {
    departure: { required: 'Indiquez votre lieu de départ.' },
    arrival: { required: 'Indiquez votre destination.' },
    time: { required: 'Indiquez l’heure ou choisissez « Horaire à préciser ».' },
    email: { required: 'Ajoutez l’adresse e-mail à utiliser pour la réponse.' },
    phone: { required: 'Ajoutez le numéro de téléphone à utiliser pour la réponse.' },
  },
  demoInfo: {
    aboutTitle: 'À propos de cette démonstration',
    aboutText: 'Ce site sert à expérimenter la conception d’une vitrine de chauffeur VTC. AZURÉA PRIVÉ et Adrien Morel sont des identités fictives. Les services et conditions sont des exemples de travail. Les images sont générées par intelligence artificielle. Aucun trajet ne peut être commandé sur ce prototype. Il n’existe aucune immatriculation, assurance ou autorisation professionnelle associée à ce prototype. Les renseignements professionnels du futur exploitant devront remplacer cette page avant toute utilisation commerciale.',
    privacyTitle: 'Confidentialité de la démonstration',
    privacyText: 'Le formulaire montre un parcours de demande de devis. Les champs ne sont transmis ni à un chauffeur, ni à un service d’e-mail, ni à un outil marketing, et ne sont pas conservés : le serveur de démonstration les valide puis renvoie seulement le récapitulatif à votre navigateur, sans les enregistrer ni les journaliser. Utilisez des données fictives pour le tester. Les éventuels traitements techniques de la plateforme qui héberge l’aperçu relèvent de cette plateforme et doivent être vérifiés séparément ; cette page ne prétend pas décrire leurs pratiques.',
  },
};

export const demoEn: DictOverride = {
  meta: {
    home: {
      title: 'AZURÉA PRIVÉ — Private Chauffeur in Cannes | Demo',
      description: 'Fictional chauffeur website prototype in Cannes with a black Tesla Model 3: services, sample fares and a simulated quote request.',
    },
    rates: { title: 'Fares · AZURÉA PRIVÉ — Demo', description: 'Fictional fares of AZURÉA PRIVÉ, private chauffeur in Cannes: fixed fares, hourly service and demo conditions.' },
    quote: { title: 'Quote request · AZURÉA PRIVÉ — Demo', description: 'Simulation of a two-step quote request for a Tesla Model 3 journey in Cannes. Nothing is transmitted.' },
    contact: { title: 'Contact · AZURÉA PRIVÉ — Demo', description: 'Fictional contact details of Adrien Morel, demo chauffeur in Cannes. Contacts are simulated.' },
    legal: { title: 'About this demonstration', description: 'AZURÉA PRIVÉ and Adrien Morel are fictional: scope of the demonstration.' },
    privacy: { title: 'Demo privacy', description: 'The demo forms neither transmit nor keep any data.' },
    sent: { title: 'Simulation complete', description: 'No request sent.' },
    simulated: { title: 'Simulation complete', description: 'No request sent.' },
  },
  nav: { services: 'Services', vehicle: 'The Tesla', rates: 'Fares', driver: 'Your chauffeur', contact: 'Contact', menuOpen: 'Open menu', menuClose: 'Close menu' },
  cta: {
    quote: 'Request a quote',
    call: 'Call',
    callDriver: 'Call Adrien',
    callAria: 'Simulated call to',
    whatsapp: 'WhatsApp',
    whatsappWrite: 'Write on WhatsApp',
    emailWrite: 'Write an email',
    quoteThis: 'Request this journey',
    vehicleLink: 'Discover the Tesla',
    contactDriver: 'Contact Adrien',
    seeContact: 'See contact details',
  },
  hero: {
    eyebrow: 'AZURÉA PRIVÉ · INDEPENDENT CHAUFFEUR',
    title: 'Your private chauffeur in Cannes.',
    signature: 'Cannes, at your own pace.',
    lede: 'For transfers, appointments and days on the Riviera, meet Adrien aboard a black Tesla Model 3. Direct contact and a journey planned with you.',
    facts: ['Based in Cannes', 'French / English', 'By reservation'],
    caption: 'AI-generated image',
    artLabel: 'AI illustration of a black Tesla Model 3 on the Riviera at dusk.',
  },
  services: {
    title: 'A chauffeur for the moments that matter.',
    intro: 'A flight to catch, an arrival to arrange, an appointment or a day to plan: share your schedule and I will prepare the journey with you.',
    legend: 'Service type',
  },
  tesla: {
    title: 'Peace of mind is part of the journey.',
    intro: 'A discreet black silhouette, a minimalist interior and a space prepared for your trip. Settle in and enjoy the journey.',
    passengers: 'Passengers',
    luggage: 'Luggage',
    caption: 'AI-generated images for the demonstration.',
  },
  driver: {
    title: 'Adrien, from the first message to your arrival.',
    intro: 'My name is Adrien and I am an independent chauffeur in Cannes.',
    signature: 'Adrien Morel · Independent chauffeur in Cannes',
    base: 'Base',
    languages: 'Languages',
    hours: 'Contact',
  },
  how: {
    title: 'Your journey in three steps.',
    note: 'This demonstration only simulates the request.',
    trustTitle: 'Details are agreed before departure.', // EN: Claude
    trust: ['One identified contact person', 'A fare proposed before confirmation', 'Accessible contact details and hours'], // EN: Claude
  },
  quote: {
    steps: [
      { t: 'Describe your journey.', d: 'Addresses, timing, passengers and luggage: a few details are enough to get started.' },
      { t: 'Receive a proposal.', d: 'The chauffeur confirms availability, the fare and the conditions for your request.' },
      { t: 'Confirm your booking.', d: 'After you agree, you receive written confirmation and the pick-up details.' },
    ],
    title: 'Let’s plan your next journey.',
    intro: 'A few details to prepare a proposal suited to your plans.',
    notice: 'Demo: use fictional details. Nothing is transmitted.',
    step1: 'Your journey',
    step2: 'Your contact details',
    service: 'Service type',
    serviceNone: 'Choose a service',
    from: 'Pick-up location',
    to: 'Destination',
    date: 'Preferred date',
    time: 'Pick-up time',
    timeHint: 'Paris time',
    passengers: 'Passengers',
    luggage: 'Luggage',
    tripType: 'Journey type',
    returnDate: 'Return date',
    returnTime: 'Return pick-up time',
    duration: 'Preferred duration',
    program: 'Planned itinerary or schedule',
    travelRef: 'Flight or train number, optional',
    name: 'Your name',
    contactMethod: 'How would you prefer to be contacted?',
    byEmail: 'Email',
    byPhone: 'Phone',
    email: 'Email',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    message: 'Your message, optional',
    next: 'Continue',
    back: 'Back to the journey',
    submit: 'Simulate my quote request',
    sending: 'Simulating…',
    example: 'Fill in a fictional example',
    summary: 'Demo summary',
    resultTitle: 'Simulation complete — no request sent.', // EN: Claude
    resultIntro: 'Here is the summary of your journey. On the final version, it would be sent to the chauffeur to prepare a reply. In this demonstration, no data has been sent and no ride is booked.', // EN: Claude
    fareReference: 'Demo fare guide', // EN: Claude
    privacy: 'No information from this form is sent to a real chauffeur.',
    privacyLink: 'Demo privacy',
    directTitle: 'Direct contact', // EN: Claude
    directBody: 'Fictional details: the buttons open a simulation, no call or message is started.', // EN: Claude
  },
  contact: {
    title: 'Direct contact to plan what comes next.',
    intro: 'A question about a journey or an itinerary? Speak directly with Adrien.',
    hours: 'Availability',
    phoneTitle: 'A conversation in person.', // EN: Claude
    phoneText: 'Every day, 7 am to 10 pm. Journeys can be arranged at other times by reservation and subject to availability.', // EN: Claude
    whatsappTitle: 'The details, at your own pace.', // EN: Claude
    whatsappText: 'Address, date, timing or a practical question: prepare your message with the useful details.', // EN: Claude
    emailTitle: 'A plan to share.', // EN: Claude
    emailText: 'bonjour@azurea-prive.example',
    zoneTitle: 'Cannes as a starting point.', // EN: Claude
    areaBase: 'Cannes, Mougins, Antibes, Nice and Monaco. For another destination, describe your itinerary in the quote request.', // EN: Claude
    zoneNote: 'Pick-ups by appointment, with no reception office.',
    formTitle: 'Write to Adrien', // EN: Claude
    message: 'Your message',
    submit: 'Simulate my message',
  },
  sim: {
    callTitle: 'Demo call.', // EN: Claude
    callText: 'On the final website, this button would open the Phone app with the chauffeur’s number. No call is started here.', // EN: Claude
    waTitle: 'Sample WhatsApp message.', // EN: Claude
    waText: 'Hello Adrien, I would like to arrange a journey from Cannes-centre to Nice airport for 2 people with 2 suitcases. Could you let me know your availability and the fare? I will send the preferred date and time.', // EN: Claude
    waNote: 'Local example: no message is sent and no external conversation is opened.', // EN: Claude
    mailTitle: 'Sample email.', // EN: Claude
    mailTo: 'bonjour@azurea-prive.example',
    mailSubject: 'Quote request — Cannes / Nice airport journey.', // EN: Claude
    mailBody: 'Hello Adrien, I would like a quote for a journey from Cannes-centre to Nice airport for 2 people with 2 suitcases. I will confirm the pick-up date and time. Please let me know your availability and the corresponding conditions. Kind regards, Camille Demo.', // EN: Claude
    mailNote: 'Demo example; no request is sent to this address.', // EN: Claude
    understood: 'Got it',
  },
  fares: {
    title: 'Clear starting points for your journey.',
    intro: 'Fixed fares for frequent journeys, and a personalised proposal for other plans.',
    demoLabel: 'Fictional fares for website testing.',
    oneWay: 'One way, per vehicle',
    perHour: '/ hour',
    minimum: 'Minimum {hours} hours, or {total}',
    custom: 'On request',
    other: 'Other journeys',
    night: 'Between {start} and {end}: fictional {rate}% surcharge.',
    conditions: 'View fares and conditions',
  },
  pricing: {
    title: 'Fares',
    conditionsTitle: 'Demo conditions', // EN: Claude
    conditionsIntro: 'Fictional conditions, identical on every page.', // EN: Claude
    offerConditions: 'Included and conditions',
    ttc: '',
  },
  faq: { title: 'Before you travel.' },
  final: { title: 'Where would you like to go?', body: 'Your pick-up, your destination, your timing: let’s plan what comes next.' },
  footer: {
    legal: 'About this demonstration',
    privacy: 'Demo privacy',
    contact: 'Contact',
    illustration: 'Demo prototype · Fictional business, chauffeur, fares and visuals.', // EN: Claude
  },
  status: {
    quoteSent: 'Simulation successful. No message has been sent and no ride has been booked.',
    simulated: 'Simulation successful. No message has been sent and no ride has been booked.',
    contactSent: 'Message simulated. Nothing has been sent.',
    notConfirmed: '',
    failed: 'The simulation could not be completed. Your details are preserved; please try again.',
    invalid: 'Please check the highlighted fields before continuing.', // EN: Claude
    direct: 'Fictional demo contact details:', // EN: Claude
  },
  errors: {
    datePast: 'Choose a future date.', // EN: Claude
    email: 'Check the format of this email address.', // EN: Claude
    durationMin: 'Hourly service starts at 3 hours in this demonstration.', // EN: Claude
  },
  fieldErrors: {
    departure: { required: 'Enter your pick-up location.' }, // EN: Claude
    arrival: { required: 'Enter your destination.' },
    time: { required: 'Enter the time or choose “Time to be confirmed”.' },
    email: { required: 'Add the email address to use for the reply.' },
    phone: { required: 'Add the phone number to use for the reply.' },
  },
  demoInfo: {
    aboutTitle: 'About this demonstration',
    aboutText: 'This website is an experiment in designing a chauffeur business website. AZURÉA PRIVÉ and Adrien Morel are fictional. The services and conditions are working examples. The images are generated by artificial intelligence. No journey can be ordered on this prototype. There is no registration, insurance or professional authorisation associated with this prototype. The future operator’s business details must replace this page before any commercial use.',
    privacyTitle: 'Demo privacy',
    privacyText: 'The form demonstrates a quote request journey. The fields are not sent to a chauffeur, an email service or a marketing tool, and they are not kept: the demo server validates them and only returns the summary to your browser, without storing or logging them. Use fictional details to test it. Any technical processing by the platform hosting the preview is that platform’s responsibility and must be checked separately; this page does not claim to describe its practices.',
  },
};
