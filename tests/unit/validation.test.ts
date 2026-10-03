import { describe, expect, it } from 'vitest';
import { addDays, isPhone, parisNow, validateContact, validateQuote, type Context } from '../../src/lib/validation';

// 2026-10-03 10:00 UTC = 12:00 in Paris (CEST)
const ctx: Context = {
  now: new Date('2026-10-03T10:00:00Z'),
  services: [{ id: 'airport' }, { id: 'riviera' }, { id: 'hourly', hourly: { minHours: 3 } }],
  maxPassengers: 4,
  channels: ['phone', 'email', 'whatsapp'],
};
const base = {
  service: 'airport',
  departure: 'Cannes-centre',
  arrival: 'Aéroport Nice Côte d’Azur',
  date: '2026-10-05',
  time: '14:30',
  passengers: '2',
  name: 'Camille',
  contactMethod: 'email',
  email: 'camille@example.com',
  phone: '',
};

describe('quote validation', () => {
  it('accepts a complete request and normalises whitespace', () => {
    const r = validateQuote({ ...base, departure: '  Cannes-\tcentre ' }, ctx);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.departure).toBe('Cannes- centre');
  });

  it('judges "past" against Paris time, not UTC', () => {
    // 2026-10-03 23:30 UTC is already 2026-10-04 01:30 in Paris.
    const late = { ...ctx, now: new Date('2026-10-03T23:30:00Z') };
    expect(parisNow(late.now).date).toBe('2026-10-04');
    const r = validateQuote({ ...base, date: '2026-10-03', time: '23:59' }, late);
    expect(!r.ok && r.errors.date).toBe('datePast');
  });

  it('refuses an earlier time today (Paris) and accepts a later one', () => {
    const today = validateQuote({ ...base, date: '2026-10-03', time: '11:00' }, ctx);
    expect(!today.ok && today.errors.time).toBe('datePast');
    expect(validateQuote({ ...base, date: '2026-10-03', time: '12:30' }, ctx).ok).toBe(true);
  });

  it('requires a time unless "time to be confirmed" is checked', () => {
    const r = validateQuote({ ...base, time: '' }, ctx);
    expect(!r.ok && r.errors.time).toBe('timeOrTbd');
    const tbd = validateQuote({ ...base, time: '', timeTbd: 'on' }, ctx);
    expect(tbd.ok && tbd.data.timeTbd).toBe(true);
  });

  it('enforces the vehicle passenger limit from the data', () => {
    const r = validateQuote({ ...base, passengers: '5' }, ctx);
    expect(!r.ok && r.errors.passengers).toBe('passengersMax');
  });

  it('requires a return after the departure for a return journey', () => {
    const before = validateQuote({ ...base, tripType: 'return', returnDate: '2026-10-05', returnTime: '10:00' }, ctx);
    expect(!before.ok && before.errors.returnDate).toBe('returnBefore');
    const missing = validateQuote({ ...base, tripType: 'return' }, ctx);
    expect(!missing.ok && missing.errors.returnDate).toBe('required');
    const ok = validateQuote({ ...base, tripType: 'return', returnDate: '2026-10-06', returnTime: '09:00' }, ctx);
    expect(ok.ok && ok.data.tripType).toBe('return');
  });

  it('hourly service: no destination needed, minimum duration enforced', () => {
    const short = validateQuote({ ...base, service: 'hourly', arrival: '', duration: '2' }, ctx);
    expect(!short.ok && short.errors.duration).toBe('durationMin');
    const ok = validateQuote({ ...base, service: 'hourly', arrival: '', duration: '3', program: 'Mougins puis Cannes' }, ctx);
    expect(ok.ok && ok.data.duration).toBe(3);
  });

  it('requires only the field of the chosen reply channel (WhatsApp uses the phone field)', () => {
    const wa = validateQuote({ ...base, contactMethod: 'whatsapp', email: '', phone: '' }, ctx);
    expect(!wa.ok && wa.errors.phone).toBe('required');
    expect(!wa.ok && wa.errors.email).toBeUndefined();
    expect(validateQuote({ ...base, contactMethod: 'whatsapp', email: '', phone: '+33 6 39 98 12 34' }, ctx).ok).toBe(true);
  });

  it('refuses a channel the business does not offer', () => {
    const r = validateQuote({ ...base, contactMethod: 'whatsapp' }, { ...ctx, channels: ['email', 'phone'] });
    expect(!r.ok && r.errors.contactMethod).toBe('invalid');
  });

  it('only accepts known service ids and luggage values', () => {
    const r = validateQuote({ ...base, service: 'helicopter', luggage: 'trunk' }, ctx);
    expect(!r.ok && r.errors.service).toBe('service');
    expect(!r.ok && r.errors.luggage).toBe('invalid');
  });

  it('rejects impossible dates and over-long text', () => {
    expect(validateQuote({ ...base, date: '2026-02-30' }, ctx).ok).toBe(false);
    const r = validateQuote({ ...base, details: 'x'.repeat(1001) }, ctx);
    expect(!r.ok && r.errors.details).toBe('tooLong');
  });

  it('computes the example date as calendar days in Paris', () => {
    expect(addDays('2026-10-03', 7)).toBe('2026-10-10');
    expect(addDays('2026-10-28', 7)).toBe('2026-11-04'); // across the DST change
  });
});

describe('international phone numbers', () => {
  it.each(['+33 6 12 34 56 78', '06.12.34.56.78', '+1 (415) 555-0100', '+971 50 123 4567'])('accepts %s', (n) => expect(isPhone(n)).toBe(true));
  it.each(['abc', '12', '+33 6 12 34 56 78 90 12 34', '06 12 <script>'])('rejects %s', (n) => expect(isPhone(n)).toBe(false));
});

describe('contact validation', () => {
  it('needs a message of reasonable length', () => {
    const r = validateContact({ name: 'Alex', contactMethod: 'email', email: 'a@b.fr', message: 'Salut' });
    expect(!r.ok && r.errors.message).toBe('tooShort');
  });
});
