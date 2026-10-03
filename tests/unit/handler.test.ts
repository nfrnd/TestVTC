import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleDemande, type HandlerConfig } from '../../src/lib/server/handle';
import { DuplicateGuard, SlidingWindowLimiter } from '../../src/lib/server/guards';
import * as transport from '../../src/lib/mail/transport';

const SITE = 'https://www.example.fr';
const now = () => new Date('2026-10-03T10:00:00Z');
const quote = {
  kind: 'devis', lang: 'fr', requestId: 'req-abcdef12', website: '',
  departure: 'Hôtel Martinez', arrival: 'Gare de Cannes', date: '2026-10-05', time: '14:30', passengers: '2', service: 'local',
  name: 'Camille Secret', contactMethod: 'email', email: 'camille.secret@example.com', phone: '', luggage: '', travelRef: '', returnTrip: '',
  details: '<img src=x onerror=alert(1)>',
};

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
const cfg = (over: Partial<HandlerConfig> = {}): HandlerConfig => ({
  production: false, siteUrl: SITE, mail: { transport: 'test' }, rateLimit: { max: 5, windowS: 600 }, ...over,
});

beforeEach(() => {
  logs = [];
  deps = { limiter: new SlidingWindowLimiter(5, 600_000), duplicates: new DuplicateGuard(), now, log: (e) => logs.push(e) };
});

describe('POST /api/demandes', () => {
  it('announces a simulated result with the test transport, never "sent"', async () => {
    const res = await handleDemande(req(quote), '1.1.1.1', cfg(), deps);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, status: 'simulated' });
  });

  it('escapes user input in the composed email and keeps the journey readable', async () => {
    await handleDemande(req(quote), '1.1.1.1', cfg(), deps);
    const msg = transport.lastSimulated!;
    expect(msg.html).not.toContain('<img src=x');
    expect(msg.html).toContain('&lt;img src=x');
    expect(msg.text).toContain('Hôtel Martinez');
    expect(msg.text).toContain('14:30 (heure de Paris, Europe/Paris)');
    expect(msg.replyTo).toBe('camille.secret@example.com');
  });

  it('never logs the journey or the contact details', async () => {
    await handleDemande(req(quote), '1.1.1.1', cfg(), deps);
    const dump = JSON.stringify(logs);
    for (const secret of ['Camille', 'camille.secret', 'Martinez', 'Gare de Cannes']) expect(dump).not.toContain(secret);
  });

  it('refuses unexpected origins and missing origins', async () => {
    expect((await handleDemande(req(quote, { origin: 'https://evil.example' }), 'ip', cfg(), deps)).status).toBe(403);
    expect((await handleDemande(req(quote, { origin: null }), 'ip', cfg(), deps)).status).toBe(403);
  });

  it('does not let a visitor choose the recipient (strict schema)', async () => {
    const res = await handleDemande(req({ ...quote, to: 'attacker@example.com' }), 'ip', cfg(), deps);
    expect(res.status).toBe(400);
  });

  it('refuses honeypot submissions without sending', async () => {
    const spy = vi.fn();
    const res = await handleDemande(req({ ...quote, website: 'http://spam' }), 'ip', cfg(), { ...deps, log: spy });
    expect(res.status).toBe(400);
  });

  it('returns field errors from the server-side schema', async () => {
    const res = await handleDemande(req({ ...quote, email: 'nope', passengers: '0' }), 'ip', cfg(), deps);
    expect(res.status).toBe(422);
    expect((await res.json()).errors).toMatchObject({ email: 'email', passengers: 'passengers' });
  });

  it('rate-limits per client', async () => {
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await handleDemande(req({ ...quote, requestId: `req-rate-${i}0000` }), '9.9.9.9', cfg(), deps)).status);
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses[5]).toBe(429);
  });

  it('does not send twice for a repeated request id', async () => {
    const send = vi.spyOn(transport, 'createTransport');
    await handleDemande(req(quote), 'a', cfg(), deps);
    const second = await handleDemande(req(quote), 'a', cfg(), deps);
    expect(second.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(1);
    send.mockRestore();
  });

  it('reports a provider failure, and the same request can be retried', async () => {
    const failed = await handleDemande(req(quote), 'a', cfg({ mail: { transport: 'fail' } }), deps);
    expect(failed.status).toBe(502);
    expect(await failed.json()).toMatchObject({ ok: false, status: 'failed' });
    const retry = await handleDemande(req(quote), 'a', cfg(), deps);
    expect(retry.status).toBe(200);
  });

  it('in production, refuses to pretend: no provider configured means 503', async () => {
    const none = await handleDemande(req(quote), 'a', cfg({ production: true, mail: {} }), deps);
    expect(none.status).toBe(503);
    const testInProd = await handleDemande(req({ ...quote, requestId: 'req-other-001' }), 'a', cfg({ production: true, mail: { transport: 'test' } }), deps);
    expect(testInProd.status).toBe(503);
    const resendMissingKey = await handleDemande(req({ ...quote, requestId: 'req-other-002' }), 'a', cfg({ production: true, mail: { transport: 'resend', to: 'x@y.fr' } }), deps);
    expect(resendMissingKey.status).toBe(503);
  });

  it('sends through Resend with an idempotency key when configured', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'em_123' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await handleDemande(req(quote), 'a', cfg({ production: true, mail: { transport: 'resend', resendApiKey: 'k', to: 'driver@example.fr', from: 'Site <d@example.fr>' } }), deps);
    vi.unstubAllGlobals();
    expect(await res.json()).toMatchObject({ ok: true, status: 'sent' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('req-abcdef12');
    expect(JSON.parse(init.body as string).to).toEqual(['driver@example.fr']);
  });

  it('serves a no-JavaScript form post with a 303 to the result page', async () => {
    const res = await handleDemande(req({ ...quote, lang: 'en' }, { json: false }), 'a', cfg(), deps);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/en/quote/simulated/');
  });
});
