// Shared validation schema for the quote and contact forms. Imported by the
// browser (instant feedback) and by the server endpoint (authoritative).
// Dependency-free on purpose: it ships to the client.

export type ErrorCode =
  | 'required' | 'tooShort' | 'tooLong' | 'email' | 'phone' | 'date' | 'datePast'
  | 'dateFar' | 'time' | 'passengers' | 'passengersMax' | 'service' | 'contactMethod' | 'invalid'
  | 'returnBefore' | 'timeOrTbd' | 'durationMin';

export type ContactMethod = 'email' | 'phone' | 'whatsapp';
export type Luggage = '' | 'none' | 'small' | 'one' | 'two' | 'tbd';
export const LUGGAGE_VALUES: Luggage[] = ['none', 'small', 'one', 'two', 'tbd'];

export interface QuoteData {
  kind: 'devis';
  service: string; // '' when not chosen
  departure: string;
  arrival: string; // may be '' for an hourly service
  date: string; // YYYY-MM-DD, Europe/Paris
  time: string; // HH:MM, Europe/Paris, '' when timeTbd
  timeTbd: boolean;
  passengers: number;
  luggage: Luggage;
  luggageDetail: string;
  tripType: 'oneway' | 'return';
  returnDate: string;
  returnTime: string;
  duration: number | null; // hours, hourly service only
  program: string;
  travelRef: string;
  name: string;
  contactMethod: ContactMethod;
  email: string;
  phone: string;
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

export interface ServiceRule {
  id: string;
  hourly?: { minHours: number };
}

export interface Context {
  now?: Date;
  services: ServiceRule[];
  maxPassengers: number;
  channels: ContactMethod[];
}

// Field length limits (characters). Also used for maxlength attributes.
export const LIMITS = {
  place: [3, 160],
  name: [2, 80],
  email: [3, 254],
  phone: [6, 30],
  luggageDetail: [0, 200],
  travelRef: [0, 40],
  program: [0, 1000],
  details: [0, 1000],
  message: [10, 2000],
} as const;
export const MAX_HOURS = 24;

export const QUOTE_STEP1 = ['service', 'departure', 'arrival', 'date', 'time', 'timeTbd', 'passengers', 'luggage', 'luggageDetail', 'tripType', 'returnDate', 'returnTime', 'duration', 'program', 'travelRef'] as const;
export const QUOTE_STEP2 = ['name', 'contactMethod', 'email', 'phone', 'details'] as const;
export const QUOTE_FIELDS = [...QUOTE_STEP1, ...QUOTE_STEP2] as const;
export const CONTACT_FIELDS = ['name', 'contactMethod', 'email', 'phone', 'message'] as const;
/** Transport fields accepted alongside the form fields. */
export const META_FIELDS = ['kind', 'lang', 'requestId', 'website'] as const;

const MAX_DAYS_AHEAD = 548; // ~18 months

// Control characters, zero-width and line/paragraph separators (written as escapes on purpose).
const CONTROL_CHARS = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u200B-\\u200F\\u2028\\u2029]', 'g');

/** Trim, collapse inner whitespace (keeping newlines for free text), drop control characters. */
export function clean(v: unknown, multiline = false): string {
  if (typeof v === 'number') v = String(v);
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

/** Adds days to a YYYY-MM-DD date (calendar arithmetic, no time zone involved). */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);
const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const minutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
const flag = (v: unknown) => v === true || v === 'on' || v === '1' || v === 'true';

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

function contact(raw: Record<string, unknown>, errors: FieldErrors, channels: ContactMethod[]) {
  const method = clean(raw.contactMethod) as ContactMethod;
  const valid = channels.includes(method);
  if (!valid) errors.contactMethod = method ? 'invalid' : 'contactMethod';
  const contactMethod: ContactMethod = valid ? method : channels[0];
  const email = clean(raw.email);
  const phone = clean(raw.phone);
  // Only the chosen channel's field is required; the other is validated if filled.
  if (valid && contactMethod === 'email' && !email) errors.email = 'required';
  if (valid && contactMethod !== 'email' && !phone) errors.phone = 'required';
  if (email && !isEmail(email)) errors.email = 'email';
  if (phone && !isPhone(phone)) errors.phone = 'phone';
  return { contactMethod, email, phone };
}

function checkDateTime(date: string, time: string, timeTbd: boolean, now: Date | undefined, errors: FieldErrors, keys = { date: 'date', time: 'time' }) {
  const dateOk = isDate(date);
  if (!date) errors[keys.date] = 'required';
  else if (!dateOk) errors[keys.date] = 'date';
  if (!timeTbd) {
    if (!time) errors[keys.time] = keys.time === 'time' ? 'timeOrTbd' : 'required';
    else if (!isTime(time)) errors[keys.time] = 'time';
  }
  if (!dateOk) return;
  const p = parisNow(now);
  const ahead = daysBetween(p.date, date);
  if (ahead < 0) errors[keys.date] = 'datePast';
  else if (ahead > MAX_DAYS_AHEAD) errors[keys.date] = 'dateFar';
  else if (ahead === 0 && !timeTbd && isTime(time) && minutes(time) < p.minutes) errors[keys.time] = 'datePast';
}

export function validateStep1(raw: Record<string, unknown>, ctx: Context): FieldErrors {
  const errors: FieldErrors = {};
  const service = clean(raw.service);
  const rule = ctx.services.find((s) => s.id === service);
  if (service && !rule) errors.service = 'service';
  const hourly = rule?.hourly;

  text(raw, 'departure', LIMITS.place, errors);
  text(raw, 'arrival', LIMITS.place, errors, { required: !hourly });

  const timeTbd = flag(raw.timeTbd);
  const date = clean(raw.date);
  const time = clean(raw.time);
  checkDateTime(date, time, timeTbd, ctx.now, errors);

  const p = clean(raw.passengers);
  if (!p) errors.passengers = 'required';
  else if (!/^\d{1,3}$/.test(p) || Number(p) < 1) errors.passengers = 'passengers';
  else if (Number(p) > ctx.maxPassengers) errors.passengers = 'passengersMax';

  const luggage = clean(raw.luggage);
  if (luggage && !LUGGAGE_VALUES.includes(luggage as Luggage)) errors.luggage = 'invalid';
  text(raw, 'luggageDetail', LIMITS.luggageDetail, errors, { required: false });
  text(raw, 'travelRef', LIMITS.travelRef, errors, { required: false });

  if (hourly) {
    const dur = clean(raw.duration);
    if (!dur) errors.duration = 'required';
    else if (!/^\d{1,2}$/.test(dur) || Number(dur) > MAX_HOURS) errors.duration = 'invalid';
    else if (Number(dur) < hourly.minHours) errors.duration = 'durationMin';
    text(raw, 'program', LIMITS.program, errors, { required: false, multiline: true });
  } else {
    const tripType = clean(raw.tripType) || 'oneway';
    if (tripType !== 'oneway' && tripType !== 'return') errors.tripType = 'invalid';
    if (tripType === 'return') {
      const rDate = clean(raw.returnDate);
      const rTime = clean(raw.returnTime);
      checkDateTime(rDate, rTime, false, ctx.now, errors, { date: 'returnDate', time: 'returnTime' });
      if (!errors.returnDate && !errors.returnTime && isDate(date) && !errors.date) {
        const after = rDate > date || (rDate === date && (timeTbd || !isTime(time) || minutes(rTime) > minutes(time)));
        if (!after) errors.returnDate = 'returnBefore';
      }
    }
  }
  return errors;
}

export function validateQuote(raw: Record<string, unknown>, ctx: Context): Result<QuoteData> {
  const errors = validateStep1(raw, ctx);
  const name = text(raw, 'name', LIMITS.name, errors);
  const c = contact(raw, errors, ctx.channels);
  const details = text(raw, 'details', LIMITS.details, errors, { required: false, multiline: true });
  if (Object.keys(errors).length) return { ok: false, errors };
  const service = clean(raw.service);
  const hourly = ctx.services.find((s) => s.id === service)?.hourly;
  const timeTbd = flag(raw.timeTbd);
  const tripType = !hourly && clean(raw.tripType) === 'return' ? 'return' : 'oneway';
  return {
    ok: true,
    data: {
      kind: 'devis',
      service,
      departure: clean(raw.departure),
      arrival: clean(raw.arrival),
      date: clean(raw.date),
      time: timeTbd ? '' : clean(raw.time),
      timeTbd,
      passengers: Number(clean(raw.passengers)),
      luggage: (clean(raw.luggage) as Luggage) || '',
      luggageDetail: clean(raw.luggageDetail),
      tripType,
      returnDate: tripType === 'return' ? clean(raw.returnDate) : '',
      returnTime: tripType === 'return' ? clean(raw.returnTime) : '',
      duration: hourly ? Number(clean(raw.duration)) : null,
      program: hourly ? clean(raw.program, true) : '',
      travelRef: clean(raw.travelRef),
      name,
      ...c,
      details,
    },
  };
}

export function validateContact(raw: Record<string, unknown>, channels: ContactMethod[] = ['email', 'phone']): Result<ContactData> {
  const errors: FieldErrors = {};
  const name = text(raw, 'name', LIMITS.name, errors);
  const c = contact(raw, errors, channels);
  const message = text(raw, 'message', LIMITS.message, errors, { multiline: true });
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { kind: 'contact', name, ...c, message } };
}

/** Validation context derived from a content object (same rules on client and server). */
export function contextFrom(c: { services: { id: string; hourly?: { minHours: number } }[]; contactChannels: ContactMethod[] }, maxPassengers: number, now?: Date): Context {
  return { now, services: c.services.map((s) => ({ id: s.id, hourly: s.hourly })), maxPassengers, channels: c.contactChannels };
}
