// ============================================================================
// DEMO mode content (BUSINESS_MODE=demo): AZURÉA PRIVÉ, a FICTIONAL business.
// Source: demo-kit/business-demo.json and demo-kit/textes-fr-en.json
// (kit "azurea-prive-claude-demo-v2", prepared by Noa, 4 October 2026).
//
// Everything here is invented for the exercise: identity, prices, conditions,
// equipment. No SIRET, VTC registration, insurance, address, Google profile,
// rating or review is created. The contact details are displayed only and are
// never linked (no tel:, mailto:, wa.me): see src/components/ContactAction.astro.
// This object is flagged `fictional` and can never pass the live guard.
// ============================================================================
import { confirmed, unknown, type FaqItem, type L10n, type Service, type SiteContent } from './types';

const routesDemo = [
  { id: 'cannes-nice-airport', serviceId: 'airport', from: 'Cannes-centre', to: 'Aéroport Nice Côte d’Azur', price: { amount: 95, kind: 'forfait' as const } },
  { id: 'cannes-antibes-station', serviceId: 'station', from: 'Cannes-centre', to: 'Gare d’Antibes', price: { amount: 55, kind: 'forfait' as const } },
  { id: 'cannes-nice-centre', serviceId: 'riviera', from: 'Cannes-centre', to: 'Nice-centre', price: { amount: 100, kind: 'forfait' as const } },
  { id: 'cannes-mougins', serviceId: 'riviera', from: 'Cannes-centre', to: 'Mougins-centre', price: { amount: 45, kind: 'forfait' as const } },
  { id: 'cannes-monaco', serviceId: 'riviera', from: 'Cannes-centre', to: 'Monaco', price: { amount: 170, kind: 'forfait' as const } },
];

const waitingAirport: L10n = {
  fr: '45 minutes d’attente incluses à compter de l’atterrissage réel, puis 15 € par tranche de 15 minutes commencée, après accord et selon disponibilité.',
  en: '45 minutes of waiting included from actual landing, then €15 per started 15 minutes, with agreement and subject to availability.',
};
const waitingOther: L10n = {
  fr: '15 minutes d’attente incluses à compter de l’heure convenue, puis 15 € par tranche de 15 minutes commencée, après accord.',
  en: '15 minutes of waiting included from the agreed time, then €15 per started 15 minutes, with agreement.',
};
const tolls: L10n = { fr: 'Péages et stationnement ordinaires inclus.', en: 'Ordinary tolls and parking included.' };

const services: Service[] = [
  {
    id: 'airport',
    motif: 'transfer',
    status: 'confirmed',
    travelRef: true,
    title: { fr: 'Transferts aéroport', en: 'Airport transfers' },
    short: { fr: 'Cannes ↔ aéroport Nice Côte d’Azur', en: 'Cannes ↔ Nice Côte d’Azur Airport' },
    summary: {
      fr: 'Organisez votre transfert entre Cannes et l’aéroport Nice Côte d’Azur. Le numéro de vol aide à préparer la prise en charge.',
      en: 'Plan your transfer between Cannes and Nice Côte d’Azur Airport. Your flight number helps prepare the pick-up.',
    },
    price: confirmed({ amount: 95, kind: 'forfait' }),
    conditions: confirmed([waitingAirport, tolls]),
    cta: { fr: 'Préparer mon transfert', en: 'Plan my transfer' },
  },
  {
    id: 'station',
    motif: 'station',
    status: 'confirmed',
    travelRef: true,
    title: { fr: 'Transferts gare', en: 'Train station transfers' },
    short: { fr: 'Gares de la région, rendez-vous convenu', en: 'Local stations, agreed meeting point' },
    summary: {
      fr: 'Préparez votre arrivée ou votre départ dans les gares de la région, avec horaires et lieu de rendez-vous convenus.',
      en: 'Prepare your arrival or departure at a local train station, with an agreed time and meeting point.',
    },
    price: confirmed({ amount: 55, kind: 'forfait' }),
    conditions: confirmed([waitingOther, tolls]),
    cta: { fr: 'Préparer mon transfert', en: 'Plan my transfer' },
  },
  {
    id: 'riviera',
    motif: 'riviera',
    status: 'confirmed',
    title: { fr: 'Cannes et la Riviera', en: 'Cannes and the Riviera' },
    short: { fr: 'Mougins, Antibes, Nice, Monaco', en: 'Mougins, Antibes, Nice, Monaco' },
    summary: {
      fr: 'Hôtel, restaurant ou rendez-vous : rejoignez votre prochaine adresse à Cannes, Mougins, Antibes, Nice ou Monaco.',
      en: 'Hotel, restaurant or appointment: travel to your next address in Cannes, Mougins, Antibes, Nice or Monaco.',
    },
    price: confirmed({ amount: 45, kind: 'a-partir-de' }),
    conditions: confirmed([waitingOther, tolls]),
    cta: { fr: 'Décrire mon trajet', en: 'Describe my journey' },
  },
  {
    id: 'business',
    motif: 'business',
    status: 'confirmed',
    title: { fr: 'Professionnels et événements', en: 'Business and events' },
    short: { fr: 'Rendez-vous, congrès, soirées', en: 'Meetings, conferences, evenings' },
    summary: {
      fr: 'Partagez vos adresses et votre programme pour organiser vos déplacements d’affaires, de congrès ou de soirée. Les conditions des jours d’événement sont précisées avant confirmation.',
      en: 'Share your addresses and schedule to plan business meetings, conference travel or an evening out. Conditions on event days are specified before confirmation.',
    },
    price: unknown('Sur devis (scénario)'),
    conditions: confirmed([
      { fr: 'Conditions particulières des grands événements communiquées et acceptées avant confirmation.', en: 'Specific conditions for major events are shared and accepted before confirmation.' },
    ]),
    cta: { fr: 'Organiser mes déplacements', en: 'Plan my travel' },
  },
  {
    id: 'hourly',
    motif: 'hourly',
    status: 'confirmed',
    hourly: { minHours: 3 },
    title: { fr: 'Mise à disposition', en: 'Hourly chauffeur service' },
    short: { fr: 'Plusieurs étapes, à partir de 3 heures', en: 'Several stops, from three hours' },
    summary: {
      fr: 'À partir de trois heures, construisez un programme de plusieurs étapes avec un même chauffeur.',
      en: 'From three hours, build a multi-stop itinerary with the same chauffeur.',
    },
    price: confirmed({ amount: 80, kind: 'horaire' }),
    conditions: confirmed([
      { fr: 'Minimum 3 heures, soit 240 €. Base : Cannes, Le Cannet et Mougins, 30 km par heure inclus.', en: 'Minimum 3 hours, or €240. Base area: Cannes, Le Cannet and Mougins, 30 km per hour included.' },
      { fr: 'Autre programme ou dépassement précisé dans le devis.', en: 'Other plans or extra distance specified in the quote.' },
    ]),
    cta: { fr: 'Préparer mon programme', en: 'Plan my itinerary' },
  },
];

const faq: FaqItem[] = [
  {
    id: 'reserver',
    q: { fr: 'Comment réserver un trajet ?', en: 'How do I book a journey?' },
    a: {
      fr: 'Commencez par une demande de devis. Adrien précise sa disponibilité, le tarif et les conditions, puis confirme votre réservation par écrit après votre accord.',
      en: 'Start with a quote request. Adrien confirms availability, the fare and conditions, then provides written booking confirmation after you agree.',
    },
  },
  {
    id: 'par-personne',
    q: { fr: 'Les prix sont-ils indiqués par personne ?', en: 'Are the fares per person?' },
    a: {
      fr: 'Les forfaits correspondent à un aller simple, par véhicule, dans les deux sens du trajet indiqué. Ils couvrent une prise en charge de 6 h à 22 h ; une majoration de 20 % s’applique la nuit.',
      en: 'The fixed fares are one way, per vehicle, in either direction of the listed route. They cover pick-ups between 6 am and 10 pm; a 20% night surcharge applies.',
    },
  },
  {
    id: 'nuit',
    q: { fr: 'Puis-je demander un trajet tôt le matin ou la nuit ?', en: 'Can I request an early or late journey?' },
    a: {
      fr: 'Oui, sur réservation et selon disponibilité. Une prise en charge à partir de 22 h et avant 6 h entraîne une majoration de 20 %.',
      en: 'Yes, by reservation and subject to availability. Pick-ups from 10 pm until before 6 am carry a 20% surcharge.',
    },
  },
  {
    id: 'retard-vol',
    q: { fr: 'Que se passe-t-il si mon vol arrive en retard ?', en: 'What if my flight is delayed?' },
    a: {
      fr: 'Précisez le numéro de vol et communiquez tout changement. Le transfert comprend 45 minutes d’attente après l’atterrissage réel, puis 15 € par tranche de 15 minutes commencée, après accord et selon disponibilité.',
      en: 'Provide the flight number and communicate any changes. The transfer includes 45 minutes of waiting after actual landing, then €15 per started 15 minutes, with agreement and subject to availability.',
    },
  },
  {
    id: 'capacite',
    q: { fr: 'Combien de passagers et de bagages à bord ?', en: 'How many passengers and bags can travel?' },
    a: {
      fr: 'Trois passagers sont recommandés. Un quatrième est possible sur demande, sans gros bagages. Prévoyez deux valises moyennes et deux sacs cabine, dont les dimensions seront à confirmer.',
      en: 'Three passengers are recommended. A fourth is possible on request without large luggage. Allow for two medium suitcases and two cabin bags, with dimensions to be confirmed.',
    },
  },
  {
    id: 'arrets',
    q: { fr: 'Puis-je prévoir plusieurs arrêts ?', en: 'Can I plan several stops?' },
    a: {
      fr: 'La mise à disposition commence à trois heures, à 80 € de l’heure. La base couvre Cannes, Le Cannet et Mougins, avec 30 km par heure inclus. Un autre programme est précisé dans le devis.',
      en: 'Hourly service starts at three hours, at €80 per hour. The base covers Cannes, Le Cannet and Mougins with 30 km per hour included. Other plans are specified in the quote.',
    },
  },
  {
    id: 'paiement',
    q: { fr: 'Quels moyens de paiement sont proposés ?', en: 'Which payment methods are offered?' },
    a: {
      fr: 'Le règlement prévu est par carte à bord ou en espèces. Aucun paiement n’est possible dans cette démonstration.',
      en: 'The planned payment methods are card on board and cash. No payment is possible in this demonstration.',
    },
  },
  {
    id: 'annulation',
    q: { fr: 'Puis-je modifier ou annuler mon trajet ?', en: 'Can I change or cancel my journey?' },
    a: {
      fr: 'Toute modification doit être reconfirmée. Annulation gratuite jusqu’à 24 heures avant, puis 50 % à moins de 24 heures et 100 % en cas d’absence. Ces conditions sont fictives pour ce test.',
      en: 'Changes must be reconfirmed. Cancellation is free until 24 hours beforehand, then 50% within 24 hours and 100% for a no-show. These conditions are fictional for this test.',
    },
  },
].map((item) => ({ ...item, status: 'documented' as const }));

const noLegal = (what: string) => unknown(`${what} : absent, entreprise fictive`);

export const demoContent: SiteContent = {
  mode: 'demo',
  fictional: true,
  business: {
    name: confirmed('AZURÉA PRIVÉ'),
    slogan: confirmed({ fr: 'Cannes, à votre rythme.', en: 'Cannes, at your own pace.' }),
    activity: confirmed({ fr: 'Chauffeur indépendant', en: 'Independent chauffeur' }),
    city: confirmed('Cannes'),
    phone: confirmed({ e164: '+33639981234', display: '06 39 98 12 34' }),
    email: confirmed('bonjour@azurea-prive.example'),
    whatsapp: confirmed({ e164: '+33639981234' }),
    hours: confirmed({ fr: 'Tous les jours, de 7 h à 22 h, heure de Paris.', en: 'Every day, 7 am to 10 pm, Paris time.' }),
    languages: confirmed({ fr: 'Français, English', en: 'French, English' }),
    serviceArea: confirmed({
      fr: 'Cannes, Le Cannet, Mougins, Antibes, Juan-les-Pins, Nice, aéroport Nice Côte d’Azur et Monaco.',
      en: 'Cannes, Le Cannet, Mougins, Antibes, Juan-les-Pins, Nice, Nice Côte d’Azur Airport and Monaco.',
    }),
    googleBusinessUrl: unknown('Aucune fiche Google dans la démonstration'),
    driver: {
      name: confirmed('Adrien Morel'),
      photo: confirmed({
        src: 'asset:driver',
        alt: { fr: 'Portrait IA d’Adrien, chauffeur fictif de la démonstration.', en: 'AI portrait of Adrien, the fictional chauffeur of this demonstration.' },
      }),
      bio: confirmed({
        fr: 'J’ai imaginé AZURÉA PRIVÉ autour d’une idée simple : rendre vos déplacements aussi agréables à organiser qu’à vivre. Je prends le temps de comprendre votre trajet, vos horaires et les détails qui comptent pour vous. Pour un transfert, un rendez-vous ou une journée sur la Riviera, vous échangez directement avec moi. Mon approche : une présentation soignée, de l’attention et un accueil naturel.',
        en: 'I created AZURÉA PRIVÉ around a simple idea: make journeys as pleasant to organise as they are to experience. I take the time to understand your itinerary, timing and the details that matter to you. For a transfer, an appointment or a day on the Riviera, you speak directly with me. My approach: a smart presentation, personal attention and a natural welcome.',
      }),
    },
    legal: {
      legalName: noLegal('Raison sociale'),
      legalForm: noLegal('Statut'),
      siret: noLegal('SIRET'),
      vtcRegistry: noLegal('Registre VTC'),
      address: noLegal('Adresse'),
      vat: noLegal('TVA'),
      publicationDirector: noLegal('Directeur de la publication'),
      mediator: noLegal('Médiateur'),
      insurance: noLegal('Assurance'),
      host: noLegal('Hébergeur'),
      emailProvider: noLegal('Prestataire email'),
      retention: unknown('Aucune conservation : rien n’est transmis ni stocké en démonstration'),
    },
  },
  vehicle: {
    model: confirmed('Tesla Model 3'),
    color: confirmed({ fr: 'noire, intérieur noir', en: 'black, black interior' }),
    generation: confirmed('Highland 2024 (représentation IA)'),
    maxPassengers: confirmed(4),
    passengersNote: confirmed({
      fr: '3 passagers recommandés. Un quatrième sur demande, sans gros bagages.',
      en: '3 passengers recommended. A fourth on request, without large luggage.',
    }),
    luggage: confirmed({ fr: '2 valises moyennes et 2 sacs cabine, selon leurs dimensions.', en: '2 medium suitcases and 2 cabin bags, depending on their dimensions.' }),
    comfort: confirmed({ fr: 'Eau, recharge du téléphone et climatisation.', en: 'Water, phone charging and air conditioning.' }),
    photos: confirmed({ profile: 'asset:vehicle-profile', interior: 'asset:interior' }),
  },
  vehicleFacts: [
    {
      title: { fr: 'Prenez place.', en: 'Take your seat.' },
      text: { fr: 'Un intérieur noir, soigné et climatisé pour commencer le trajet dans de bonnes conditions.', en: 'A clean, air-conditioned black interior to start the journey comfortably.' },
    },
    {
      title: { fr: 'Voyagez à votre rythme.', en: 'Travel at your own pace.' },
      text: { fr: 'Un moment de conversation ou de tranquillité, selon votre envie.', en: 'A moment of conversation or quiet, as you prefer.' },
    },
    {
      title: { fr: 'Préparons les détails.', en: 'Let’s prepare the details.' },
      text: { fr: 'Passagers, bagages et besoins particuliers sont précisés avant le départ.', en: 'Passengers, luggage and special needs are confirmed before departure.' },
    },
  ],
  services,
  fares: {
    routes: routesDemo,
    hourly: confirmed({ pricePerHour: 80, minHours: 3, minTotal: 240, includedKmPerHour: 30, area: ['Cannes', 'Le Cannet', 'Mougins'] }),
    night: confirmed({ start: '22:00', end: '06:00', rate: 0.2 }),
  },
  pricingConditions: [
    { id: 'base', label: { fr: 'Forfaits', en: 'Fixed fares' }, value: confirmed({ fr: 'Par véhicule et par aller simple, applicables dans les deux sens pour les lieux indiqués. Prix finaux du scénario.', en: 'Per vehicle, one way, valid in both directions for the listed places. Final prices of the scenario.' }) },
    { id: 'nuit', label: { fr: 'Nuit', en: 'Night' }, value: confirmed({ fr: 'Tarif de base pour une prise en charge de 6 h à 22 h. À partir de 22 h et avant 6 h : majoration de 20 % sur le forfait de transport ou la base de mise à disposition, hors attente supplémentaire.', en: 'Base fare for pick-ups from 6 am to 10 pm. From 10 pm until before 6 am: 20% surcharge on the transport fare or the hourly base, excluding extra waiting.' }) },
    { id: 'peages', label: { fr: 'Péages et stationnement', en: 'Tolls and parking' }, value: confirmed({ fr: 'Péages et stationnement ordinaires inclus dans les forfaits des trajets affichés.', en: 'Ordinary tolls and parking included in the listed fixed fares.' }) },
    { id: 'attente', label: { fr: 'Attente', en: 'Waiting' }, value: confirmed({ fr: 'Aéroport : 45 minutes incluses à compter de l’atterrissage réel. Autres points : 15 minutes à compter de l’heure convenue. Au-delà : 15 € par tranche de 15 minutes commencée, selon disponibilité et après accord.', en: 'Airport: 45 minutes included from actual landing. Other pick-ups: 15 minutes from the agreed time. Beyond: €15 per started 15 minutes, subject to availability and agreement.' }) },
    { id: 'aller-retour', label: { fr: 'Aller-retour', en: 'Return journeys' }, value: confirmed({ fr: 'Addition des deux trajets ; la majoration de nuit s’applique séparément selon l’heure de chaque prise en charge.', en: 'Both journeys are added; the night surcharge applies separately to each pick-up time.' }) },
    { id: 'disposition', label: { fr: 'Mise à disposition', en: 'Hourly service' }, value: confirmed({ fr: '80 € de l’heure, minimum 3 heures, soit 240 €. Base : Cannes, Le Cannet et Mougins, 30 km par heure inclus. Programme différent ou dépassement précisé dans le devis.', en: '€80 per hour, minimum 3 hours, or €240. Base area: Cannes, Le Cannet and Mougins, 30 km per hour included. Other plans or extra distance specified in the quote.' }) },
    { id: 'evenements', label: { fr: 'Grands événements', en: 'Major events' }, value: confirmed({ fr: 'Une tarification différente ne s’applique qu’après communication et accord avant réservation.', en: 'A different fare applies only after it has been shared and agreed before booking.' }) },
    { id: 'devis', label: { fr: 'Devis et réservation', en: 'Quote and booking' }, value: confirmed({ fr: 'Devis gratuit et sans engagement ; réservation après confirmation écrite.', en: 'Free, no-obligation quote; booking after written confirmation.' }) },
    { id: 'paiement', label: { fr: 'Paiement', en: 'Payment' }, value: confirmed({ fr: 'Carte bancaire à bord ou espèces. Aucun paiement en ligne.', en: 'Card on board or cash. No online payment.' }) },
    { id: 'annulation', label: { fr: 'Annulation', en: 'Cancellation' }, value: confirmed({ fr: 'Sans frais jusqu’à 24 heures avant le départ ; à moins de 24 heures : 50 % ; absence au rendez-vous : 100 %. Aucun montant n’est prélevé dans ce prototype.', en: 'Free until 24 hours before departure; within 24 hours: 50%; no-show: 100%. No amount is charged in this prototype.' }) },
  ],
  faq,
  contactChannels: ['phone', 'email', 'whatsapp'],
  demo: {
    label: { fr: 'Démonstration — entreprise et tarifs fictifs', en: 'Demo — fictional business and prices' },
    footer: {
      fr: 'AZURÉA PRIVÉ est une entreprise fictive créée pour une démonstration. Les visuels sont générés par IA. Aucun message, paiement ou réservation n’est transmis.',
      en: 'AZURÉA PRIVÉ is a fictional business created for a demonstration. Images are AI-generated. No message, payment or booking is transmitted.',
    },
    referencePrefix: 'DEMO-',
    example: {
      name: 'Camille Exemple',
      contactMethod: 'email',
      email: 'camille@example.com',
      phone: '+33639981234',
      serviceId: 'airport',
      from: 'Cannes-centre',
      to: 'Aéroport Nice Côte d’Azur',
      daysFromToday: 7,
      time: '10:30',
      passengers: 2,
      luggage: 'one',
      luggageDetail: '1 valise moyenne et 2 sacs cabine',
      message: 'Exemple fictif pour tester le parcours.',
    },
  },
};
