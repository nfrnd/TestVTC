// Abuse protections sized for a single-driver site.
//
// IMPORTANT: the rate limiter and the duplicate guard below keep their state in
// the memory of ONE server process. With the default Node standalone adapter
// (one long-running process) that is a real, consistent limit. On serverless
// platforms (Netlify Functions, Vercel…) each instance has its own memory and
// instances are recycled, so these become best-effort only: rely on the
// platform's rate-limiting rules and on the email provider's Idempotency-Key
// header there. See README "Protection contre les abus".

export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private max: number,
    private windowMs: number,
  ) {}

  /** Returns true when the request is allowed (and records it). */
  allow(key: string, now = Date.now()): boolean {
    const since = now - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > since);
    if (list.length >= this.max) {
      this.hits.set(key, list);
      return false;
    }
    list.push(now);
    this.hits.set(key, list);
    if (this.hits.size > 5000) this.prune(now);
    return true;
  }

  private prune(now: number) {
    const since = now - this.windowMs;
    for (const [k, v] of this.hits) if (!v.some((t) => t > since)) this.hits.delete(k);
  }
}

type Outcome = { state: 'pending' } | { state: 'done'; status: 'sent' | 'simulated' };

/** Remembers recent request ids so a double submit or a retry is not sent twice. */
export class DuplicateGuard {
  private seen = new Map<string, { at: number; outcome: Outcome }>();
  constructor(private ttlMs = 30 * 60_000) {}

  get(id: string, now = Date.now()): Outcome | undefined {
    const e = this.seen.get(id);
    if (!e) return undefined;
    if (now - e.at > this.ttlMs) {
      this.seen.delete(id);
      return undefined;
    }
    return e.outcome;
  }
  start(id: string, now = Date.now()) {
    this.seen.set(id, { at: now, outcome: { state: 'pending' } });
    if (this.seen.size > 5000) for (const [k, v] of this.seen) if (now - v.at > this.ttlMs) this.seen.delete(k);
  }
  finish(id: string, status: 'sent' | 'simulated', now = Date.now()) {
    this.seen.set(id, { at: now, outcome: { state: 'done', status } });
  }
  /** A failed attempt may be retried with the same id. */
  release(id: string) {
    this.seen.delete(id);
  }
}

/** Expected origins: the canonical site URL plus any configured preview origins. */
export function allowedOrigins(siteUrl: string, extra?: string): Set<string> {
  const set = new Set<string>();
  for (const u of [siteUrl, ...(extra ?? '').split(',')]) {
    const s = u.trim();
    if (!s) continue;
    try {
      set.add(new URL(s).origin);
    } catch {
      /* ignore malformed entries */
    }
  }
  return set;
}

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);
const isLoopback = (origin: string) => {
  try {
    return LOOPBACK.has(new URL(origin).hostname);
  } catch {
    return false;
  }
};

/**
 * Local preview (site URL on localhost). Two extra cases are accepted, and only then:
 *  - other loopback spellings and ports: http://127.0.0.1:4321 is the same machine
 *    as http://localhost:4321;
 *  - a same-origin request on the LAN: a phone on the Wi-Fi opens
 *    http://192.168.x.y:4321, so its Origin is that address, equal to the Host the
 *    request was sent to, and that address is a private-network one. A page from
 *    another site has a different Origin and is still refused.
 * Never applies once the site URL is a public domain.
 */
// Private-network addresses a phone on the same Wi-Fi uses (IP literals or mDNS .local
// names). Public domain names are excluded on purpose: with DNS rebinding, a hostile
// domain can point at a LAN address and its pages would look "same-origin".
function isPrivateNetworkHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h.endsWith('.local')) return true;
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a === 127;
  }
  return /^(fc|fd)[0-9a-f]{2}:/.test(h) || h.startsWith('fe80:');
}

function matches(origin: string, allowed: Set<string>, requestHost: string | null): boolean {
  if (allowed.has(origin)) return true;
  const localPreview = [...allowed].some(isLoopback);
  if (!localPreview) return false;
  if (isLoopback(origin)) return true;
  try {
    const o = new URL(origin);
    return (o.protocol === 'http:' || o.protocol === 'https:') && !!requestHost && o.host === requestHost.toLowerCase() && isPrivateNetworkHost(o.hostname);
  } catch {
    return false;
  }
}

export function originAllowed(request: Request, allowed: Set<string>): boolean {
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  if (origin) return matches(origin, allowed, host);
  // Some older browsers omit Origin on same-origin POSTs; fall back to Referer.
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    return matches(new URL(referer).origin, allowed, host);
  } catch {
    return false;
  }
}

export const REQUEST_ID_RE = /^[A-Za-z0-9-]{8,64}$/;
