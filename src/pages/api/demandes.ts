// The only on-demand route of the site: receives Quote and Contact requests.
// Runs on the server (adapter), never prerendered, so secrets stay server-side.
import type { APIRoute } from 'astro';
import {
  ALLOWED_ORIGINS,
  EMAIL_TRANSPORT,
  MAIL_FROM,
  MAIL_TO,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_S,
  RESEND_API_KEY,
  TRUST_PROXY,
} from 'astro:env/server';
import { PUBLIC_SITE_ENV, PUBLIC_SITE_URL } from 'astro:env/client';
import { handleDemande } from '../../lib/server/handle';
import { DuplicateGuard, SlidingWindowLimiter } from '../../lib/server/guards';

export const prerender = false;

const rateLimit = { max: RATE_LIMIT_MAX ?? 5, windowS: RATE_LIMIT_WINDOW_S ?? 600 };
// Module-level state: shared by every request handled by this server process.
const limiter = new SlidingWindowLimiter(rateLimit.max, rateLimit.windowS * 1000);
const duplicates = new DuplicateGuard();

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Behind a reverse proxy, the client IP comes from X-Forwarded-For (only if trusted).
  const forwarded = TRUST_PROXY ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() : undefined;
  let ip = forwarded || 'unknown';
  if (!forwarded) {
    try {
      ip = clientAddress;
    } catch {
      /* not provided by every adapter */
    }
  }
  return handleDemande(
    request,
    ip,
    {
      production: PUBLIC_SITE_ENV === 'production',
      siteUrl: PUBLIC_SITE_URL,
      extraOrigins: ALLOWED_ORIGINS,
      mail: { transport: EMAIL_TRANSPORT, resendApiKey: RESEND_API_KEY, to: MAIL_TO, from: MAIL_FROM },
      rateLimit,
    },
    { limiter, duplicates },
  );
};

export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
