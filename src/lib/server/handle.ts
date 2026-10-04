// Request handling for POST /api/demandes, kept free of Astro APIs so it can be
// unit-tested. The endpoint (src/pages/api/demandes.ts) only wires config in.
//
// BUSINESS MODE
//   demo: the server ALWAYS simulates. No transport is created, whatever the
//         environment holds (even a real RESEND_API_KEY). The validated request
//         is turned into a summary returned to the browser, never stored, never logged.
//   live: validated request -> email through the configured transport.
import { known, passengerLimitOf, type BusinessMode, type Lang, type SiteContent } from '../../content/types';
import { errorMessage, t } from '../../i18n';
import { routes } from '../../i18n/routes';
import { composeContact, composeQuote, escapeHtml } from '../mail/compose';
import { createTransport, TransportError, type MailConfig } from '../mail/transport';
import { buildSummary, type Summary } from '../summary';
import { CONTACT_FIELDS, META_FIELDS, QUOTE_FIELDS, contextFrom, validateContact, validateQuote, type FieldErrors } from '../validation';
import { allowedOrigins, DuplicateGuard, originAllowed, REQUEST_ID_RE, SlidingWindowLimiter } from './guards';

export interface HandlerConfig {
  mode: BusinessMode;
  content: SiteContent;
  production: boolean;
  siteUrl: string;
  extraOrigins?: string;
  mail: MailConfig;
  rateLimit: { max: number; windowS: number };
}

export interface Deps {
  limiter: SlidingWindowLimiter;
  duplicates: DuplicateGuard;
  now?: () => Date;
  log?: (entry: Record<string, unknown>) => void;
}

export type ApiStatus = 'sent' | 'simulated' | 'invalid' | 'rate-limited' | 'forbidden' | 'not-configured' | 'failed' | 'in-progress' | 'bad-request';

const MAX_BODY = 16 * 1024;

/** Direct contact links for error messages. Never any link in demo mode. */
function contactLinks(cfg: HandlerConfig, lang: Lang) {
  if (cfg.mode === 'demo') return [];
  const out: { label: string; href: string }[] = [];
  const d = t(lang, cfg.mode);
  const phone = known(cfg.content.business.phone);
  const email = known(cfg.content.business.email);
  if (phone) out.push({ label: `${d.contact.phone} : ${phone.display}`, href: `tel:${phone.e164}` });
  if (email) out.push({ label: `${d.contact.email} : ${email}`, href: `mailto:${email}` });
  return out;
}

function fieldLabel(d: ReturnType<typeof t>, field: string): string {
  const fromQuote = (d.quote as Record<string, unknown>)[field === 'arrival' ? 'to' : field === 'departure' ? 'from' : field === 'details' ? 'message' : field];
  const fromContact = (d.contact as Record<string, unknown>)[field];
  return typeof fromQuote === 'string' ? fromQuote : typeof fromContact === 'string' ? fromContact : field;
}

const pageStyle = 'body{margin:0;background:#11191d;color:#f4f6f4;font:17px/1.6 system-ui,sans-serif}main{max-width:44rem;margin:0 auto;padding:4rem 1.25rem}a{color:#a8d5cc}h1{font-size:1.6rem;line-height:1.2}dl{display:grid;grid-template-columns:minmax(0,11rem) minmax(0,1fr);gap:.4rem 1rem;margin:1.5rem 0}dt{color:#beccc9}dd{margin:0;min-width:0;overflow-wrap:anywhere}@media(max-width:30rem){dl{grid-template-columns:minmax(0,1fr);gap:0}dd{margin-bottom:.6rem}}.note{color:#beccc9}';

/** Minimal standalone page for submissions made without JavaScript. */
function htmlPage(cfg: HandlerConfig, lang: Lang, status: number, message: string, opts: { errors?: FieldErrors; formHref: string; summary?: Summary; reference?: string; intro?: string }) {
  const d = t(lang, cfg.mode);
  const items = Object.entries(opts.errors ?? {})
    .map(([field, code]) => `<li><strong>${escapeHtml(fieldLabel(d, field))}</strong> : ${escapeHtml(errorMessage(d, field, code as string))}</li>`)
    .join('');
  const links = contactLinks(cfg, lang)
    .map((l) => `<li><a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a></li>`)
    .join('');
  const summary = opts.summary
    ? `<h2>${escapeHtml(d.quote.summary)}</h2><dl>${opts.summary.rows.map((r) => `<dt>${escapeHtml(r.label)}</dt><dd>${escapeHtml(r.value)}</dd>`).join('')}</dl>
<p><strong>${escapeHtml(opts.summary.fare.kind === 'reference' ? d.quote.fareReference : '')}</strong> ${opts.summary.fare.lines.map(escapeHtml).join('<br>')}</p>`
    : '';
  const back = opts.summary
    ? `<p><a href="${opts.formHref}">${escapeHtml(d.quote.restart)}</a></p>`
    : `<p class="note">${lang === 'fr' ? 'Le bouton « Retour » de votre navigateur ramène en général au formulaire avec vos saisies.' : 'Your browser’s Back button usually returns to the form with what you typed.'} <a href="${opts.formHref}">${lang === 'fr' ? 'Ouvrir le formulaire' : 'Open the form'}</a></p>`;
  const body = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(d.meta.quote.title)}</title>
<style>${pageStyle}</style></head>
<body><main>${cfg.content.demo ? `<p class="note">${escapeHtml(cfg.content.demo.label[lang])}</p>` : ''}<h1>${escapeHtml(message)}</h1>${opts.intro ? `<p>${escapeHtml(opts.intro)}</p>` : ''}${opts.reference ? `<p class="note">${escapeHtml(d.quote.reference)} : ${escapeHtml(opts.reference)}</p>` : ''}${items ? `<ul>${items}</ul>` : ''}${summary}
${back}
${links ? `<p>${escapeHtml(d.status.direct)}</p><ul>${links}</ul>` : ''}<p><a href="${routes.home[lang]}">${escapeHtml(d.status.backHome)}</a></p></main></body></html>`;
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function readBody(request: Request): Promise<{ raw: Record<string, unknown>; isJson: boolean } | null> {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY) return null;
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  if (type === 'application/json') {
    try {
      const v = JSON.parse(text);
      if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
      return { raw: v as Record<string, unknown>, isJson: true };
    } catch {
      return null;
    }
  }
  if (type === 'application/x-www-form-urlencoded') {
    return { raw: Object.fromEntries(new URLSearchParams(text)), isJson: false };
  }
  return null;
}

export async function handleDemande(request: Request, clientIp: string, cfg: HandlerConfig, deps: Deps): Promise<Response> {
  const started = Date.now();
  const log = deps.log ?? ((e) => console.info(JSON.stringify(e)));
  const wantsJson = (request.headers.get('content-type') ?? '').includes('application/json');
  let lang: Lang = 'fr';
  let formKey: 'quote' | 'contact' = 'quote';

  const fail = (status: number, apiStatus: ApiStatus, message: string, extra: Record<string, unknown> = {}, logExtra: Record<string, unknown> = {}) => {
    // Only metadata is logged: never the journey, the name or the contact details.
    log({ evt: 'demande', mode: cfg.mode, outcome: apiStatus, http: status, ms: Date.now() - started, ...logExtra });
    return wantsJson
      ? json(status, { ok: false, status: apiStatus, message, direct: contactLinks(cfg, lang), ...extra })
      : htmlPage(cfg, lang, status, message, { errors: (extra.errors as FieldErrors) ?? {}, formHref: routes[formKey][lang] });
  };

  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });

  if (!originAllowed(request, allowedOrigins(cfg.siteUrl, cfg.extraOrigins))) {
    return fail(403, 'forbidden', t(lang, cfg.mode).status.failed);
  }

  if (!deps.limiter.allow(clientIp)) {
    return fail(429, 'rate-limited', t(lang, cfg.mode).status.rateLimited);
  }

  const body = await readBody(request);
  if (!body) return fail(400, 'bad-request', t(lang, cfg.mode).status.failed);
  const { raw } = body;
  if (raw.lang === 'en') lang = 'en';
  const d = t(lang, cfg.mode);

  const kind = raw.kind === 'contact' ? 'contact' : raw.kind === 'devis' ? 'devis' : null;
  if (!kind) return fail(400, 'bad-request', d.status.failed);
  if (kind === 'contact') formKey = 'contact';

  // Strict schema: unexpected keys are refused rather than silently forwarded.
  const accepted = new Set<string>([...META_FIELDS, ...(kind === 'devis' ? QUOTE_FIELDS : CONTACT_FIELDS)]);
  const unexpected = Object.keys(raw).filter((k) => !accepted.has(k));
  if (unexpected.length) return fail(400, 'bad-request', d.status.failed);
  if (Object.values(raw).some((v) => typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean')) return fail(400, 'bad-request', d.status.failed);

  // Honeypot: a field humans never see. Refused with an honest message, nothing is sent.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') return fail(400, 'bad-request', d.status.failed);

  const now = deps.now?.() ?? new Date();
  const ctx = contextFrom(cfg.content, passengerLimitOf(cfg.content), now);
  const result = kind === 'devis' ? validateQuote(raw, ctx) : validateContact(raw, cfg.content.contactChannels);
  if (!result.ok) return fail(422, 'invalid', d.status.invalid, { errors: result.errors });

  const requestId = typeof raw.requestId === 'string' && REQUEST_ID_RE.test(raw.requestId) ? raw.requestId : crypto.randomUUID();

  // ---- DEMO: always simulated, nothing leaves the server, nothing is kept ----
  if (cfg.mode === 'demo') {
    const reference = `${cfg.content.demo?.referencePrefix ?? 'DEMO-'}${requestId.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`;
    const summary = result.data.kind === 'devis' ? buildSummary(result.data, cfg.content, lang, cfg.mode) : undefined;
    const message = kind === 'devis' ? d.status.quoteSent : d.status.contactSent;
    log({ evt: 'demande', mode: 'demo', kind, outcome: 'simulated', http: 200, ms: Date.now() - started });
    if (wantsJson) return json(200, { ok: true, status: 'simulated', requestId, reference, message, summary });
    return htmlPage(cfg, lang, 200, kind === 'devis' ? d.quote.resultTitle : message, {
      formHref: routes[formKey][lang],
      summary,
      reference,
      intro: kind === 'devis' ? `${message} ${d.quote.resultIntro}` : undefined,
    });
  }

  // ---- LIVE ----
  const previous = deps.duplicates.get(requestId);
  if (previous?.state === 'pending') return fail(409, 'in-progress', d.status.inProgress);

  const successBody = (status: 'sent' | 'simulated') => {
    const message = status === 'simulated' ? d.status.simulated : kind === 'devis' ? d.status.quoteSent : d.status.contactSent;
    if (wantsJson) return json(200, { ok: true, status, requestId, message });
    const key = kind === 'devis' ? (status === 'sent' ? 'quoteSent' : 'quoteSimulated') : status === 'sent' ? 'contactSent' : 'contactSimulated';
    return new Response(null, { status: 303, headers: { Location: routes[key][lang], 'Cache-Control': 'no-store' } });
  };

  if (previous?.state === 'done') {
    log({ evt: 'demande', mode: 'live', outcome: `duplicate-${previous.status}`, http: 200, ms: Date.now() - started });
    return successBody(previous.status);
  }

  let transport;
  try {
    transport = createTransport(cfg.mail, { production: cfg.production });
  } catch (e) {
    return fail(503, 'not-configured', d.status.notConfigured, {}, { reason: (e as Error).message });
  }

  deps.duplicates.start(requestId);
  try {
    const opts = { requestId, lang, simulated: transport.name === 'test' };
    const msg =
      result.data.kind === 'devis'
        ? composeQuote(result.data, { ...opts, summary: buildSummary(result.data, cfg.content, 'fr', cfg.mode) })
        : composeContact(result.data, opts);
    const sent = await transport.send(msg, { idempotencyKey: requestId });
    deps.duplicates.finish(requestId, sent.status);
    log({ evt: 'demande', mode: 'live', kind, outcome: sent.status, provider: sent.provider, http: 200, ms: Date.now() - started });
    return successBody(sent.status);
  } catch (e) {
    deps.duplicates.release(requestId);
    const te = e instanceof TransportError ? e : new TransportError(String(e), 'provider');
    return fail(502, 'failed', d.status.failed, {}, { kind, reason: te.kind, providerStatus: te.httpStatus });
  }
}
