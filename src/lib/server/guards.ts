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

export function originAllowed(request: Request, allowed: Set<string>): boolean {
  const origin = request.headers.get('origin');
  if (origin) return allowed.has(origin);
  // Some older browsers omit Origin on same-origin POSTs; fall back to Referer.
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    return allowed.has(new URL(referer).origin);
  } catch {
    return false;
  }
}

export const REQUEST_ID_RE = /^[A-Za-z0-9-]{8,64}$/;
