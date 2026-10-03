import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleDemande, type HandlerConfig } from '../../src/lib/server/handle';
import { DuplicateGuard, SlidingWindowLimiter } from '../../src/lib/server/guards';
import * as transport from '../../src/lib/mail/transport';
import { demoContent } from '../../src/content/demo';
import { liveContent } from '../../src/content/business';
import { contentGaps, liveReadinessProblems } from '../../src/content/readiness';

const SITE = 'https://www.example.fr';
/** Intl puts narrow no-break spaces before € in French: compare on plain spaces. */
const plain = (v: unknown) => JSON.parse(JSON.stringify(v).replace(/[\u00a0\u202f]/g, ' '));
const now = () => new Date('2026-10-03T10:00:00Z');

const demoQuote = {
  kind: 'devis', lang: 'fr', requestId: 'req-abcdef12', website: '',
  service: 'airport', departure: 'Cannes-centre', arrival: 'Aéroport Nice Côte d’Azur', date: '2026-10-10', time: '10:30',
  passengers: '2', luggage: 'one', luggageDetail: '1 valise moyenne', tripType: 'oneway',
  name: 'Camille Secret', contactMethod: 'email', email: 'camille.secret@example.com', phone: '', details: '<img src=x onerror=alert(1)>',
};
const liveQuote = { ...demoQuote, service: 'transfert', departure: 'Hôtel Martinez', arrival: 'Gare de Cannes', contactMethod: 'email' };

function req(body: unknown, { origin = SITE, json = true }: { origin?: string | null; json?: boolean } = {}) {
  const headers: Record<string, string> = { 'Content-Type': json ? 'application/json' : 'application/x-www-form-urlencoded' };
  if (origin) headers.Origin = origin;
  return new Request(`${SITE}/api/demandes`, {
    method: 'POST',
    headers,
    body: json ? JSON.stringify(body) : new URLSearchParams(body as Record<string, string>).toString(),
  });
}

let logs: Record<string, unknown>[];
let deps: { limiter: SlidingWindowLimiter; duplicates: DuplicateGuard; now: typeof now; log: (e: Record<string, unknown>) => void };
const demoCfg = (over: Partial<HandlerConfig> = {}): HandlerConfig => ({
  mode: 'demo', content: demoContent, production: true, siteUrl: SITE, mail: {}, rateLimit: { max: 5, windowS: 600 }, ...over,
});
const liveCfg = (over: Partial<HandlerConfig> = {}): HandlerConfig => ({
  mode: 'live', content: liveContent, production: false, siteUrl: SITE, mail: { transport: 'test' }, rateLimit: { max: 5, windowS: 600 }, ...over,
});

beforeEach(() => {
  logs = [];
  deps = { limiter: new SlidingWindowLimiter(5, 600_000), duplicates: new DuplicateGuard(), now, log: (e) => logs.push(e) };
});
afterEach(() => vi.unstubAllGlobals());

describe('demo mode: the server always simulates', () => {
  it('never calls the email provider, even with a real-looking key configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const create = vi.spyOn(transport, 'createTransport');
    const res = await handleDemande(req(demoQuote), '1.1.1.1', demoCfg({ mail: { transport: 'resend', resendApiKey: 're_live_key', to: 'driver@example.fr', from: 'x@example.fr' } }), deps);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, status: 'simulated' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    create.mockRestore();
  });

  it('returns the exact simulation message, a DEMO reference and the server-built summary', async () => {
    const body = await (await handleDemande(req(demoQuote), 'a', demoCfg(), deps)).json();
    expect(body.message).toBe('Simulation réussie. Aucun message n’a été envoyé et aucun trajet n’est réservé.');
    expect(body.reference).toMatch(/^DEMO-[A-Z0-9]{8}$/);
    const rows = Object.fromEntries(body.summary.rows.map((r: { label: string; value: string }) => [r.label, r.value]));
    expect(rows['Type de prestation']).toBe('Transferts aéroport');
    expect(rows['Date souhaitée']).toContain('10:30 (heure de Paris)');
    expect(plain(body.summary.fare)).toEqual({ kind: 'reference', lines: ['Cannes-centre ↔ Aéroport Nice Côte d’Azur : 95 € · Aller simple, par véhicule'] });
  });

  it('shows the night rule for a 23:00 pick-up and the "custom quote" line for an unknown route', async () => {
    const night = await (await handleDemande(req({ ...demoQuote, time: '23:00', requestId: 'req-night-001' }), 'a', demoCfg(), deps)).json();
    expect(night.summary.fare.lines).toHaveLength(2);
    expect(night.summary.fare.lines[1]).toMatch(/22 h.*6 h.*20 %/);
    const other = await (await handleDemande(req({ ...demoQuote, arrival: 'Grasse', requestId: 'req-other-001' }), 'a', demoCfg(), deps)).json();
    expect(other.summary.fare).toEqual({ kind: 'custom', lines: ['Un devis personnalisé préciserait le tarif.'] });
  });

  it('keeps the same prices as the content file (no duplicated number)', async () => {
    for (const r of demoContent.fares.routes) {
      const body = await (await handleDemande(req({ ...demoQuote, service: r.serviceId, departure: r.to, arrival: r.from, requestId: `req-${r.id}`.slice(0, 40) }), 'p', demoCfg({ rateLimit: { max: 99, windowS: 600 } }), { ...deps, limiter: new SlidingWindowLimiter(99, 1) })).json();
      expect(plain(body.summary.fare.lines[0])).toContain(`${r.price.amount} €`);
    }
  });

  it('answers a no-JavaScript post with a summary page and no outbound link', async () => {
    const res = await handleDemande(req(demoQuote, { json: false }), 'a', demoCfg(), deps);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Simulation terminée');
    expect(html).toContain('Cannes-centre');
    expect(html).not.toMatch(/tel:|mailto:|wa\.me/);
    expect(html).not.toContain('<img src=x');
  });

  it('still validates on the server and logs no personal data', async () => {
    const bad = await handleDemande(req({ ...demoQuote, email: 'nope', passengers: '5' }), 'a', demoCfg(), deps);
    expect(bad.status).toBe(422);
    expect((await bad.json()).errors).toMatchObject({ email: 'email', passengers: 'passengersMax' });
    await handleDemande(req(demoQuote), 'a', demoCfg(), deps);
    const dump = JSON.stringify(logs);
    for (const secret of ['Camille', 'camille.secret', 'Cannes-centre', 'Nice']) expect(dump).not.toContain(secret);
  });

  it('simulates the contact form too', async () => {
    const res = await handleDemande(req({ kind: 'contact', lang: 'en', name: 'Alex', contactMethod: 'whatsapp', phone: '+44 20 7946 0000', email: '', message: 'Hello, is Saturday possible?' }), 'a', demoCfg(), deps);
    expect(await res.json()).toMatchObject({ ok: true, status: 'simulated', message: 'Message simulated. Nothing has been sent.' });
  });
});

describe('protections (both modes)', () => {
  it('refuses unexpected origins and missing origins', async () => {
    expect((await handleDemande(req(demoQuote, { origin: 'https://evil.example' }), 'ip', demoCfg(), deps)).status).toBe(403);
    expect((await handleDemande(req(liveQuote, { origin: null }), 'ip', liveCfg(), deps)).status).toBe(403);
  });

  it('does not let a visitor choose the recipient (strict schema)', async () => {
    expect((await handleDemande(req({ ...liveQuote, to: 'attacker@example.com' }), 'ip', liveCfg(), deps)).status).toBe(400);
  });

  it('refuses honeypot submissions', async () => {
    expect((await handleDemande(req({ ...demoQuote, website: 'http://spam' }), 'ip', demoCfg(), deps)).status).toBe(400);
  });

  it('rate-limits per client', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await handleDemande(req({ ...demoQuote, requestId: `req-rate-${i}0000` }), '9.9.9.9', demoCfg(), deps)).status);
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});

describe('live mode', () => {
  it('announces a simulated result with the test transport, never "sent"', async () => {
    const res = await handleDemande(req(liveQuote), '1.1.1.1', liveCfg(), deps);
    expect(await res.json()).toMatchObject({ ok: true, status: 'simulated' });
  });

  it('escapes user input in the composed email and keeps the journey readable', async () => {
    await handleDemande(req(liveQuote), '1.1.1.1', liveCfg(), deps);
    const msg = transport.lastSimulated!;
    expect(msg.html).not.toContain('<img src=x');
    expect(msg.html).toContain('&lt;img src=x');
    expect(msg.text).toContain('Hôtel Martinez');
    expect(msg.text).toContain('10:30 (heure de Paris)');
    expect(msg.replyTo).toBe('camille.secret@example.com');
  });

  it('does not send twice for a repeated request id', async () => {
    const create = vi.spyOn(transport, 'createTransport');
    await handleDemande(req(liveQuote), 'a', liveCfg(), deps);
    expect((await handleDemande(req(liveQuote), 'a', liveCfg(), deps)).status).toBe(200);
    expect(create).toHaveBeenCalledTimes(1);
    create.mockRestore();
  });

  it('reports a provider failure, and the same request can be retried', async () => {
    const failed = await handleDemande(req(liveQuote), 'a', liveCfg({ mail: { transport: 'fail' } }), deps);
    expect(failed.status).toBe(502);
    expect((await handleDemande(req(liveQuote), 'a', liveCfg(), deps)).status).toBe(200);
  });

  it('in production, refuses to pretend: no provider configured means 503', async () => {
    expect((await handleDemande(req(liveQuote), 'a', liveCfg({ production: true, mail: {} }), deps)).status).toBe(503);
    expect((await handleDemande(req({ ...liveQuote, requestId: 'req-other-001' }), 'a', liveCfg({ production: true, mail: { transport: 'test' } }), deps)).status).toBe(503);
  });

  it('sends through Resend with an idempotency key when configured', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'em_123' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await handleDemande(req(liveQuote), 'a', liveCfg({ production: true, mail: { transport: 'resend', resendApiKey: 'k', to: 'driver@example.fr', from: 'Site <d@example.fr>' } }), deps);
    expect(await res.json()).toMatchObject({ ok: true, status: 'sent' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('req-abcdef12');
    expect(JSON.parse(init.body as string).to).toEqual(['driver@example.fr']);
  });

  it('serves a no-JavaScript form post with a 303 to the result page', async () => {
    const res = await handleDemande(req({ ...liveQuote, lang: 'en' }, { json: false }), 'a', liveCfg(), deps);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/en/quote/simulated/');
  });
});

describe('publication guard', () => {
  it('the fictional dataset can never pass the live guard', () => {
    const problems = liveReadinessProblems('https://www.vrai-domaine.fr', demoContent);
    expect(problems[0]).toMatch(/fictif/);
  });

  it('the live content still has blocking gaps, and an example domain is refused', () => {
    expect(contentGaps(liveContent).some((g) => g.critical)).toBe(true);
    expect(liveReadinessProblems('https://azurea-prive.example')[0]).toMatch(/SITE_URL/);
  });

  it('demo and live contents are separate objects', () => {
    expect(demoContent.fictional).toBe(true);
    expect(liveContent.fictional).toBe(false);
    expect(liveContent.business.name.known).toBe(false);
  });
});
