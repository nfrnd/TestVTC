// ============================================================================
// THE file to edit for business facts: name, contacts, services, prices,
// conditions, vehicle, hours, languages, legal information.
//
// Rules
//  - Replace `unknown('…')` with `confirmed(value)` only once the driver has
//    validated the information.
//  - Never invent: no review, rating, client, partner, years of experience,
//    24/7 availability, response time or equipment.
//  - The email that RECEIVES the form submissions is not here: it is the
//    server variable MAIL_TO (see .env.example), so visitors cannot choose it.
// ============================================================================
import { confirmed, unknown, type Field, type FaqItem, type L10n, type Service } from './types';

export const business = {
  /** Trading name. Until confirmed, the site uses a neutral descriptor (i18n: brand.fallback). */
  name: unknown('Nom commercial', { critical: true }) as Field<string>,
  activity: confirmed<L10n>({ fr: 'Chauffeur VTC', en: 'Private driver (VTC)' }),
  city: confirmed('Cannes'),

  /** E.164 for links (+33…) and a display form. Enables the "Appeler" button everywhere. */
  phone: unknown('Numéro de téléphone professionnel', { critical: true }) as Field<{ e164: string; display: string }>,
  /** Public email shown on the Contact page (may differ from MAIL_TO). */
  email: unknown('Adresse email publique', { critical: true }) as Field<string>,
  /** Only set if the driver really uses WhatsApp for bookings. */
  whatsapp: unknown('Utilisation de WhatsApp (oui/non) et numéro') as Field<{ e164: string }>,

  hours: unknown('Horaires / disponibilités') as Field<L10n>,
  languages: unknown('Langues parlées') as Field<L10n>,
  /** Cannes is confirmed as the base. Destinations beyond Cannes must be confirmed one by one. */
  serviceArea: unknown('Zone desservie et destinations au-delà de Cannes') as Field<L10n>,
  googleBusinessUrl: unknown('Lien fiche Google / carte (facultatif)') as Field<string>,

  driver: {
    name: unknown('Prénom (et nom) du chauffeur') as Field<string>,
    /** Path under public/photos/ (e.g. '/photos/chauffeur.webp'), authentic photo only. */
    photo: unknown('Photo authentique du chauffeur') as Field<{ src: string; alt: L10n }>,
    bio: unknown('Présentation rédigée ou validée par le chauffeur') as Field<L10n>,
  },

  legal: {
    legalName: unknown('Nom / raison sociale de l’exploitant', { critical: true }) as Field<string>,
    legalForm: unknown('Statut juridique (EI, SASU…)', { critical: true }) as Field<string>,
    siret: unknown('SIRET', { critical: true }) as Field<string>,
    vtcRegistry: unknown('Numéro d’inscription au registre des exploitants VTC', { critical: true }) as Field<string>,
    address: unknown('Adresse professionnelle (ou domiciliation)', { critical: true }) as Field<string>,
    vat: unknown('N° TVA intracommunautaire ou mention de franchise') as Field<string>,
    publicationDirector: unknown('Directeur / directrice de la publication', { critical: true }) as Field<string>,
    mediator: unknown('Médiateur de la consommation (nom et site)', { critical: true }) as Field<string>,
    insurance: unknown('Assurance RC professionnelle (assureur, couverture)') as Field<string>,
    host: unknown('Hébergeur (nom, adresse, téléphone)', { critical: true }) as Field<string>,
    emailProvider: unknown('Prestataire d’envoi des emails (ex. Resend) et localisation des données', { critical: true }) as Field<string>,
    retention: unknown('Durée de conservation des demandes, validée par le responsable', { critical: true }) as Field<L10n>,
  },
};

export const vehicle = {
  model: confirmed('Tesla Model 3'),
  color: confirmed<L10n>({ fr: 'noire', en: 'black' }),
  /** 2017-2023 or 2024+ ("Highland"). The illustration fits both silhouettes. */
  generation: unknown('Génération / année de la Model 3') as Field<string>,
  /** Drives the passengers field limit in the quote form and the server schema. */
  maxPassengers: unknown('Nombre maximum de passagers transportés') as Field<number>,
  luggage: unknown('Capacité bagages (nombre de valises)') as Field<L10n>,
  /** Real photos under public/photos/ replace the illustration (see docs/ASSETS.md). */
  photos: unknown('Photos réelles du véhicule (extérieur, intérieur)') as Field<string[]>,
};

// Model-inherent facts true of every Tesla Model 3, whatever the generation.
export const vehicleFacts: L10n[] = [
  { fr: '100 % électrique : pas de bruit de moteur thermique', en: 'Fully electric: no combustion engine noise' },
  { fr: 'Toit en verre sur toute la longueur de l’habitacle', en: 'Glass roof over the whole cabin' },
];

// Service ideas from the brief, all to be confirmed by the driver.
// Wording stays generic: no destination (Nice, Antibes, Monaco…) is named.
export const services: Service[] = [
  {
    id: 'transfert',
    motif: 'transfer',
    status: 'to-confirm',
    title: { fr: 'Aéroport ou gare', en: 'Airport or station' },
    short: { fr: 'Arrivée, départ, correspondance', en: 'Arrival, departure, connection' },
    summary: {
      fr: 'Un transfert vers ou depuis un aéroport ou une gare. Indiquez votre numéro de vol ou de train dans la demande.',
      en: 'A transfer to or from an airport or a station. Add your flight or train number to the request.',
    },
    price: unknown('Prix du transfert'),
    conditions: unknown('Conditions (attente incluse, suivi du vol…)'),
  },
  {
    id: 'local',
    motif: 'local',
    status: 'to-confirm',
    title: { fr: 'Trajets à Cannes', en: 'Rides in Cannes' },
    short: { fr: 'Restaurant, hôtel, rendez-vous', en: 'Restaurant, hotel, appointment' },
    summary: {
      fr: 'Un trajet dans Cannes, pour un rendez-vous, un dîner ou un retour à l’hôtel.',
      en: 'A ride within Cannes, for an appointment, a dinner or a return to your hotel.',
    },
    price: unknown('Prix des trajets locaux'),
    conditions: unknown('Conditions des trajets locaux'),
  },
  {
    id: 'affaires',
    motif: 'business',
    status: 'to-confirm',
    title: { fr: 'Déplacements professionnels', en: 'Business travel' },
    short: { fr: 'Rendez-vous, salons, clients', en: 'Meetings, trade fairs, clients' },
    summary: {
      fr: 'Un ou plusieurs rendez-vous dans la journée, pour vous ou pour vos invités.',
      en: 'One or several meetings in the day, for you or for your guests.',
    },
    price: unknown('Prix des déplacements professionnels'),
    conditions: unknown('Conditions (facturation entreprise…)'),
  },
  {
    id: 'evenement',
    motif: 'event',
    status: 'to-confirm',
    title: { fr: 'Événements', en: 'Events' },
    short: { fr: 'Aller, retour, soirée', en: 'Way there, way back, evening' },
    summary: {
      fr: 'L’aller et le retour d’une soirée, d’une cérémonie ou d’un événement à Cannes.',
      en: 'The way there and back for an evening, a ceremony or an event in Cannes.',
    },
    price: unknown('Prix des prestations événementielles'),
    conditions: unknown('Conditions événements'),
  },
  {
    id: 'disposition',
    motif: 'hourly',
    status: 'to-confirm',
    title: { fr: 'Mise à disposition', en: 'Chauffeur by the hour' },
    short: { fr: 'Plusieurs arrêts, un chauffeur', en: 'Several stops, one driver' },
    summary: {
      fr: 'Le véhicule et le chauffeur pour une durée convenue, avec plusieurs arrêts.',
      en: 'The car and driver for an agreed duration, with several stops.',
    },
    price: unknown('Tarif horaire / durée minimale'),
    conditions: unknown('Conditions de mise à disposition'),
  },
];

// General pricing conditions. Shown only once confirmed (annotated in preview).
export const pricingConditions: { id: string; label: L10n; value: Field<L10n> }[] = [
  { id: 'attente', label: { fr: 'Temps d’attente', en: 'Waiting time' }, value: unknown('Politique d’attente') },
  { id: 'peages', label: { fr: 'Péages', en: 'Tolls' }, value: unknown('Péages inclus ou non') },
  { id: 'stationnement', label: { fr: 'Stationnement', en: 'Parking' }, value: unknown('Frais de stationnement') },
  { id: 'horaires', label: { fr: 'Nuit, dimanches et jours fériés', en: 'Nights, Sundays and public holidays' }, value: unknown('Majorations éventuelles') },
  { id: 'paiement', label: { fr: 'Moyens de paiement', en: 'Payment methods' }, value: unknown('Moyens de paiement acceptés') },
  { id: 'annulation', label: { fr: 'Annulation', en: 'Cancellation' }, value: unknown('Conditions d’annulation') },
];

export const faq: FaqItem[] = [
  {
    id: 'engagement',
    status: 'documented',
    q: { fr: 'Envoyer une demande de devis confirme-t-il mon trajet ?', en: 'Does sending a quote request confirm my ride?' },
    a: {
      fr: 'Non. Le chauffeur étudie votre demande puis vous contacte pour préciser le tarif et sa disponibilité. Le trajet est confirmé ensuite, directement avec le chauffeur.',
      en: 'No. The driver reviews your request, then contacts you to confirm the price and availability. The ride is confirmed afterwards, directly with the driver.',
    },
  },
  {
    id: 'vehicule',
    status: 'documented',
    q: { fr: 'Dans quel véhicule vais-je voyager ?', en: 'Which car will I travel in?' },
    a: {
      fr: 'Dans une Tesla Model 3 noire, une berline 100 % électrique.',
      en: 'In a black Tesla Model 3, a fully electric saloon.',
    },
  },
  {
    id: 'heure',
    status: 'documented',
    q: { fr: 'Dans quel fuseau horaire indiquer l’heure ?', en: 'Which time zone should I use?' },
    a: {
      fr: 'À l’heure de Paris (Europe/Paris), c’est-à-dire l’heure locale à Cannes, même si vous réservez depuis l’étranger.',
      en: 'Paris time (Europe/Paris), the local time in Cannes, even if you book from abroad.',
    },
  },
  {
    id: 'infos',
    status: 'documented',
    q: { fr: 'Quelles informations préparer ?', en: 'What information should I prepare?' },
    a: {
      fr: 'Le lieu de départ, le lieu d’arrivée, la date, l’heure, le nombre de passagers et, si possible, vos bagages et votre numéro de vol ou de train.',
      en: 'The pick-up place, the destination, the date, the time, the number of passengers and, if possible, your luggage and flight or train number.',
    },
  },
  {
    id: 'paiement-en-ligne',
    status: 'documented',
    q: { fr: 'Dois-je payer sur le site ?', en: 'Do I pay on the website?' },
    a: {
      fr: 'Non, aucun paiement n’est demandé sur ce site. Les modalités sont précisées avec le chauffeur.',
      en: 'No, no payment is taken on this website. Terms are agreed with the driver.',
    },
  },
  {
    id: 'siege-enfant',
    status: 'to-document',
    q: { fr: 'Un siège enfant est-il disponible ?', en: 'Is a child seat available?' },
    a: { fr: 'À confirmer par le chauffeur.', en: 'To be confirmed by the driver.' },
  },
  {
    id: 'langues',
    status: 'to-document',
    q: { fr: 'Quelles langues parle le chauffeur ?', en: 'Which languages does the driver speak?' },
    a: { fr: 'À confirmer par le chauffeur.', en: 'To be confirmed by the driver.' },
  },
];

/** Upper bound used only when the vehicle capacity is unknown, to reject absurd input. */
export const PASSENGERS_SANITY_MAX = 20;
export const passengerLimit = (): number =>
  vehicle.maxPassengers.known ? vehicle.maxPassengers.value : PASSENGERS_SANITY_MAX;
