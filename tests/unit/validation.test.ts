import { describe, expect, it } from 'vitest';
import { isPhone, parisNow, validateContact, validateQuote } from '../../src/lib/validation';

const ctx = { now: new Date('2026-10-03T10:00:00Z'), serviceIds: ['transfert', 'local'], maxPassengers: 4 }; // 12:00 in Paris (CEST)
const base = {
  departure: 'Hôtel Martinez, Cannes',
  arrival: 'Gare de Cannes',
  date: '2026-10-05',
  time: '14:30',
  passengers: '2',
  service: '',
  name: 'Camille',
  contactMethod: 'email',
  email: 'camille@example.com',
  phone: '',
};

describe('quote validation', () => {
  it('accepts a complete request and normalises whitespace', () => {
    const r = validateQuote({ ...base, departure: '  Hôtel   Martinez,\tCannes ' }, ctx);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.departure).toBe('Hôtel Martinez, Cannes');
  });

  it('judges "past" against Paris time, not UTC', () => {
    // 2026-10-03 23:30 UTC is already 2026-10-04 01:30 in Paris.
    const late = { ...ctx, now: new Date('2026-10-03T23:30:00Z') };
    expect(parisNow(late.now).date).toBe('2026-10-04');
    const r = validateQuote({ ...base, date: '2026-10-03', time: '23:59' }, late);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.date).toBe('datePast');
  });

  it('refuses an earlier time today (Paris) and accepts a later one', () => {
    const today = validateQuote({ ...base, date: '2026-10-03', time: '11:00' }, ctx);
    expect(!today.ok && today.errors.time).toBe('datePast');
    expect(validateQuote({ ...base, date: '2026-10-03', time: '12:30' }, ctx).ok).toBe(true);
  });

  it('enforces the vehicle passenger limit from the data', () => {
    const r = validateQuote({ ...base, passengers: '5' }, ctx);
    expect(!r.ok && r.errors.passengers).toBe('passengersMax');
    expect(!validateQuote({ ...base, passengers: '1.5' }, ctx).ok).toBe(true);
  });

  it('requires the contact field matching the chosen reply method', () => {
    const r = validateQuote({ ...base, contactMethod: 'phone', phone: '' }, ctx);
    expect(!r.ok && r.errors.phone).toBe('required');
    expect(validateQuote({ ...base, contactMethod: 'phone', phone: '+44 20 7946 0000', email: '' }, ctx).ok).toBe(true);
  });

  it('only accepts known service ids', () => {
    const r = validateQuote({ ...base, service: 'monaco' }, ctx);
    expect(!r.ok && r.errors.service).toBe('service');
  });

  it('rejects impossible dates and over-long text', () => {
    expect(!validateQuote({ ...base, date: '2026-02-30' }, ctx).ok).toBe(true);
    const r = validateQuote({ ...base, details: 'x'.repeat(1001) }, ctx);
    expect(!r.ok && r.errors.details).toBe('tooLong');
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
