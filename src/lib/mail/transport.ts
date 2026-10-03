// Email transports. The endpoint picks one from server configuration only.
//   resend  real delivery through the Resend HTTP API (https://resend.com)
//   test    development: validates and composes, sends nothing, says so
//   fail    always fails, to exercise the error path end to end
import type { MailMessage } from './compose';

export type SendResult =
  | { status: 'sent'; provider: 'resend'; id: string }
  | { status: 'simulated'; provider: 'test'; id: string };

export class TransportError extends Error {
  constructor(
    message: string,
    readonly kind: 'not-configured' | 'provider' | 'timeout',
    readonly httpStatus?: number,
  ) {
    super(message);
  }
}

export interface Transport {
  name: 'resend' | 'test' | 'fail';
  send(msg: MailMessage, opts: { idempotencyKey: string }): Promise<SendResult>;
}

export interface MailConfig {
  transport?: 'resend' | 'test' | 'fail';
  resendApiKey?: string;
  to?: string;
  from?: string;
}

/** Last simulated message, for automated tests only (kept in memory, never logged). */
export let lastSimulated: MailMessage | null = null;

export function createTransport(cfg: MailConfig, { production }: { production: boolean }): Transport {
  const name = cfg.transport ?? (production ? undefined : 'test');
  if (!name) throw new TransportError('EMAIL_TRANSPORT is not set', 'not-configured');
  if (name === 'test') {
    if (production) throw new TransportError('The test transport cannot run in production', 'not-configured');
    return {
      name,
      async send(msg, { idempotencyKey }) {
        lastSimulated = msg;
        return { status: 'simulated', provider: 'test', id: `test-${idempotencyKey}` };
      },
    };
  }
  if (name === 'fail') {
    return {
      name,
      async send() {
        throw new TransportError('Simulated provider failure (EMAIL_TRANSPORT=fail)', 'provider', 502);
      },
    };
  }
  const { resendApiKey, to, from } = cfg;
  if (!resendApiKey || !to || !from) throw new TransportError('RESEND_API_KEY, MAIL_TO and MAIL_FROM are required', 'not-configured');
  return {
    name,
    async send(msg, { idempotencyKey }) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
            // Lets the provider drop a retried request (same form submission) instead of sending twice.
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject: msg.subject,
            text: msg.text,
            html: msg.html,
            ...(msg.replyTo ? { reply_to: msg.replyTo } : {}),
          }),
        });
        if (!res.ok) throw new TransportError(`Resend responded ${res.status}`, 'provider', res.status);
        const body = (await res.json().catch(() => ({}))) as { id?: string };
        return { status: 'sent', provider: 'resend', id: body.id ?? 'unknown' };
      } catch (e) {
        if (e instanceof TransportError) throw e;
        if ((e as Error).name === 'AbortError') throw new TransportError('Resend timed out', 'timeout');
        throw new TransportError(`Resend request failed: ${(e as Error).message}`, 'provider');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
