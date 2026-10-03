// Every business fact is either confirmed (with its value) or explicitly unknown.
// Components go through `known()` and render nothing (live, production) or a
// visible "à confirmer" annotation (live, preview) for unknown values.
// The fictional demo dataset uses the same shape but is flagged `fictional`
// and can never satisfy the live publication guard.

export type Lang = 'fr' | 'en';
export type L10n = Record<Lang, string>;
export type BusinessMode = 'live' | 'demo';

export interface Confirmed<T> {
  readonly known: true;
  readonly value: T;
}
export interface Unknown {
  readonly known: false;
  /** What is missing, for Noa and the annotation shown in preview builds. */
  readonly note: string;
  /** Blocks a live production build while unknown. */
  readonly critical?: boolean;
}
export type Field<T> = Confirmed<T> | Unknown;

export const confirmed = <T>(value: T): Confirmed<T> => ({ known: true, value });
export const unknown = (note: string, opts: { critical?: boolean } = {}): Unknown => ({ known: false, note, ...opts });

export function known<T>(f: Field<T>): T | undefined {
  return f.known ? f.value : undefined;
}

export type PriceKind = 'forfait' | 'indicatif' | 'a-partir-de' | 'horaire';
export interface Price {
  amount: number; // euros, final price as displayed
  kind: PriceKind;
}

export type RouteMotif = 'transfer' | 'station' | 'local' | 'riviera' | 'business' | 'event' | 'hourly';
export type ContactChannel = 'email' | 'phone' | 'whatsapp';

export interface Service {
  id: string;
  motif: RouteMotif;
  /** Until the driver confirms the service is offered, it stays 'to-confirm'. */
  status: 'confirmed' | 'to-confirm';
  title: L10n;
  short: L10n;
  summary: L10n;
  price: Field<Price>;
  /** Inclusions/conditions specific to this offer, only when confirmed. */
  conditions: Field<L10n[]>;
  /** Shows the optional flight/train number field. */
  travelRef?: boolean;
  /** Hourly service: duration field (minimum) instead of a return option. */
  hourly?: { minHours: number };
  /** Label of the button that opens the quote form for this service. */
  cta?: L10n;
}

/** A fixed fare between two named places (valid in both directions). */
export interface FareRoute {
  id: string;
  serviceId: string;
  from: string;
  to: string;
  price: Price;
}

export interface HourlyFare {
  pricePerHour: number;
  minHours: number;
  minTotal: number;
  includedKmPerHour: number;
  area: string[];
}

export interface NightRule {
  /** Pick-up times from `start` (inclusive) to `end` (exclusive), HH:MM, Europe/Paris. */
  start: string;
  end: string;
  rate: number; // 0.2 = +20 %
}

export interface FaqItem {
  id: string;
  /** 'documented' answers rely only on facts in the content file or on how the site works. */
  status: 'documented' | 'to-document';
  q: L10n;
  a: L10n;
}

export interface Fares {
  routes: FareRoute[];
  hourly: Field<HourlyFare>;
  night: Field<NightRule>;
}

/** Copy that only exists in the fictional demonstration. */
export interface DemoInfo {
  label: L10n;
  footer: L10n;
  referencePrefix: string;
  example: {
    name: string;
    contactMethod: ContactChannel;
    email: string;
    phone: string;
    serviceId: string;
    from: string;
    to: string;
    daysFromToday: number;
    time: string;
    passengers: number;
    luggage: string;
    luggageDetail: string;
    message: string;
  };
}

export interface BusinessInfo {
  name: Field<string>;
  slogan: Field<L10n>;
  activity: Confirmed<L10n>;
  city: Confirmed<string>;
  /** E.164 for links (+33…) and a display form. */
  phone: Field<{ e164: string; display: string }>;
  email: Field<string>;
  /** Only set if WhatsApp is really used for bookings. */
  whatsapp: Field<{ e164: string }>;
  hours: Field<L10n>;
  languages: Field<L10n>;
  serviceArea: Field<L10n>;
  googleBusinessUrl: Field<string>;
  driver: {
    name: Field<string>;
    /** `src` is a public path (/photos/…) or `asset:<key>` for a bundled image. */
    photo: Field<{ src: string; alt: L10n }>;
    bio: Field<L10n>;
  };
  legal: Record<
    'legalName' | 'legalForm' | 'siret' | 'vtcRegistry' | 'address' | 'vat' | 'publicationDirector' | 'mediator' | 'insurance' | 'host' | 'emailProvider',
    Field<string>
  > & { retention: Field<L10n> };
}

export interface VehicleInfo {
  model: Confirmed<string>;
  color: Confirmed<L10n>;
  generation: Field<string>;
  /** Hard limit used by the quote form and the server schema. */
  maxPassengers: Field<number>;
  passengersNote: Field<L10n>;
  luggage: Field<L10n>;
  comfort: Field<L10n>;
  /** `asset:<key>` images (profile, interior) once available. */
  photos: Field<{ profile: string; interior: string }>;
}

export interface SiteContent {
  mode: BusinessMode;
  /** True for the invented demonstration dataset. Never accepted by the live guard. */
  fictional: boolean;
  business: BusinessInfo;
  vehicle: VehicleInfo;
  /** Short facts or numbered points about the car (title optional). */
  vehicleFacts: { title?: L10n; text: L10n }[];
  services: Service[];
  fares: Fares;
  pricingConditions: { id: string; label: L10n; value: Field<L10n> }[];
  faq: FaqItem[];
  /** Reply channels offered in the forms. */
  contactChannels: ContactChannel[];
  demo: DemoInfo | null;
}

/** Upper bound used only when the vehicle capacity is unknown, to reject absurd input. */
export const PASSENGERS_SANITY_MAX = 20;
export const passengerLimitOf = (c: SiteContent): number => (c.vehicle.maxPassengers.known ? c.vehicle.maxPassengers.value : PASSENGERS_SANITY_MAX);
