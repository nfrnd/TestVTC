// Shared validation schema for the quote and contact forms. Imported by the
// browser (instant feedback) and by the server endpoint (authoritative).
// Dependency-free on purpose: it ships to the client.

export type ErrorCode =
  | 'required' | 'tooShort' | 'tooLong' | 'email' | 'phone' | 'date' | 'datePast'
  | 'dateFar' | 'time' | 'passengers' | 'passengersMax' | 'service' | 'contactMethod' | 'invalid';

export type ContactMethod = 'email' | 'phone';

export interface QuoteData {
  kind: 'devis';
  departure: string;
  arrival: string;
  date: string; // YYYY-MM-DD, Europe/Paris
  time: string; // HH:MM, Europe/Paris
  passengers: number;
  service: string; // '' when not chosen
  name: string;
  contactMethod: ContactMethod;
  email: string;
  phone: string;
  luggage: string;
  travelRef: string;
  returnTrip: string;
  details: string;
}

export interface ContactData {
  kind: 'contact';
  name: string;
  contactMethod: ContactMethod;
  email: string;
  phone: string;
  message: string;
}

export type FieldErrors = Partial<Record<string, ErrorCode>>;
export type Result<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

export interface Context {
  now?: Date;
  serviceIds: string[];
  maxPassengers: number;
}

// Field length limits (characters). Also used for maxlength attributes.
export const LIMITS = {
  place: [3, 160],
  name: [2, 80],
  email: [3, 254],
  phone: [6, 30],
  luggage: [0, 200],
  travelRef: [0, 40],
  returnTrip: [0, 200],
  details: [0, 1000],
  message: [10, 2000],
} as const;

export const QUOTE_STEP1 = ['departure', 'arrival', 'date', 'time', 'passengers', 'service'] as const;
export const QUOTE_FIELDS = [...QUOTE_STEP1, 'name', 'contactMethod', 'email', 'phone', 'luggage', 'travelRef', 'returnTrip', 'details'] as const;
export const CONTACT_FIELDS = ['name', 'contactMethod', 'email', 'phone', 'message'] as const;
/** Transport fields accepted alongside the form fields. */
export const META_FIELDS = ['kind', 'lang', 'requestId', 'website'] as const;

const MAX_DAYS_AHEAD = 548; // ~18 months

// Control characters, zero-width and line/paragraph separators (written as escapes on purpose).
const CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u200B-\\u200F\\u2028\\u2029]', 'g');

/** Trim, collapse inner whitespace (keeping newlines for free text), drop control characters. */
export function clean(v: unknown, multiline = false): string {
  if (typeof v !== 'string') return '';
  let s = v.normalize('NFC').replace(CONTROL_CHARS, '');
  s = multiline ? s.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  return s.trim();
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE_CHARS_RE = /^\+?[0-9\s().-]+$/;

export function isEmail(s: string) {
  return s.length <= LIMITS.email[1] && EMAIL_RE.test(s);
}
export function isPhone(s: string) {
  if (!PHONE_CHARS_RE.test(s) || s.length > LIMITS.phone[1]) return false;
  const digits = s.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
}

/** Current date and minutes-since-midnight in Europe/Paris. */
export function parisNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

function text(raw: Record<string, unknown>, key: string, [min, max]: readonly [number, number], errors: FieldErrors, { required = true, multiline = false } = {}) {
  const v = clean(raw[key], multiline);
  if (!v) {
    if (required) errors[key] = 'required';
    return v;
  }
  if (v.length < min) errors[key] = 'tooShort';
  else if (v.length > max) errors[key] = 'tooLong';
  return v;
}

function contact(raw: Record<string, unknown>, errors: FieldErrors) {
  const method = clean(raw.contactMethod);
  const contactMethod: ContactMethod = method === 'phone' ? 'phone' : 'email';
  if (method !== 'email' && method !== 'phone') errors.contactMethod = method ? 'invalid' : 'contactMethod';
  const email = clean(raw.email);
  const phone = clean(raw.phone);
  // The chosen method's field is required; the other is optional but validated if filled.
  if (contactMethod === 'email' && !email) errors.email = 'required';
  if (contactMethod === 'phone' && !phone) errors.phone = 'required';
  if (email && !isEmail(email)) errors.email = 'email';
  if (phone && !isPhone(phone)) errors.phone = 'phone';
  return { contactMethod, email, phone };
}

export function validateStep1(raw: Record<string, unknown>, ctx: Context): FieldErrors {
  const errors: FieldErrors = {};
  text(raw, 'departure', LIMITS.place, errors);
  text(raw, 'arrival', LIMITS.place, errors);

  const date = clean(raw.date);
  const time = clean(raw.time);
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().startsWith(date);
  const timeOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  if (!date) errors.date = 'required';
  else if (!dateOk) errors.date = 'date';
  if (!time) errors.time = 'required';
  else if (!timeOk) errors.time = 'time';
  if (dateOk) {
    const now = parisNow(ctx.now);
    const ahead = daysBetween(now.date, date);
    if (ahead < 0) errors.date = 'datePast';
    else if (ahead > MAX_DAYS_AHEAD) errors.date = 'dateFar';
    else if (ahead === 0 && timeOk) {
      const [h, m] = time.split(':').map(Number);
      if (h * 60 + m < now.minutes) errors.time = 'datePast';
    }
  }

  const p = clean(raw.passengers);
  if (!p) errors.passengers = 'required';
  else if (!/^\d{1,3}$/.test(p) || Number(p) < 1) errors.passengers = 'passengers';
  else if (Number(p) > ctx.maxPassengers) errors.passengers = 'passengersMax';

  const service = clean(raw.service);
  if (service && !ctx.serviceIds.includes(service)) errors.service = 'service';
  return errors;
}

export function validateQuote(raw: Record<string, unknown>, ctx: Context): Result<QuoteData> {
  const errors = validateStep1(raw, ctx);
  const name = text(raw, 'name', LIMITS.name, errors);
  const c = contact(raw, errors);
  const luggage = text(raw, 'luggage', LIMITS.luggage, errors, { required: false });
  const travelRef = text(raw, 'travelRef', LIMITS.travelRef, errors, { required: false });
  const returnTrip = text(raw, 'returnTrip', LIMITS.returnTrip, errors, { required: false });
  const details = text(raw, 'details', LIMITS.details, errors, { required: false, multiline: true });
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      kind: 'devis',
      departure: clean(raw.departure),
      arrival: clean(raw.arrival),
      date: clean(raw.date),
      time: clean(raw.time),
      passengers: Number(clean(raw.passengers)),
      service: clean(raw.service),
      name,
      ...c,
      luggage,
      travelRef,
      returnTrip,
      details,
    },
  };
}

export function validateContact(raw: Record<string, unknown>): Result<ContactData> {
  const errors: FieldErrors = {};
  const name = text(raw, 'name', LIMITS.name, errors);
  const c = contact(raw, errors);
  const message = text(raw, 'message', LIMITS.message, errors, { multiline: true });
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { kind: 'contact', name, ...c, message } };
}
