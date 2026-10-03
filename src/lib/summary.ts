// Builds the human-readable summary of a validated quote request: rows for the
// result screen / no-JS page / live email, plus a fare guide when the journey
// matches a published route exactly. This is a lookup, not a pricing engine:
// no total is computed (waiting, events and other plans stay "in the quote").
import type { Lang, SiteContent } from '../content/types';
import { known } from '../content/types';
import { fill, t } from '../i18n';
import type { QuoteData } from './validation';

export interface SummaryRow {
  label: string;
  value: string;
}
export interface Summary {
  rows: SummaryRow[];
  fare: { kind: 'reference' | 'custom'; lines: string[] };
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'`´-]/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

export function findRoute(content: SiteContent, departure: string, arrival: string) {
  const a = norm(departure);
  const b = norm(arrival);
  return content.fares.routes.find((r) => (norm(r.from) === a && norm(r.to) === b) || (norm(r.from) === b && norm(r.to) === a));
}

function inNight(time: string, start: string, end: string) {
  if (!time) return false;
  return start > end ? time >= start || time < end : time >= start && time < end;
}

export function buildSummary(data: QuoteData, content: SiteContent, lang: Lang, mode: SiteContent['mode'] = content.mode): Summary {
  const d = t(lang, mode);
  const q = d.quote;
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';
  const eur = (n: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const day = (date: string) => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
  const service = content.services.find((s) => s.id === data.service);
  const luggageLabels: Record<string, string> = { none: q.luggageNone, small: q.luggageSmall, one: q.luggageOne, two: q.luggageTwo, tbd: q.luggageTbd };
  const channelLabel = { email: q.email, phone: q.phone, whatsapp: q.whatsapp }[data.contactMethod];
  const tz = lang === 'fr' ? 'heure de Paris' : 'Paris time';

  const rows: SummaryRow[] = [];
  const push = (label: string, value: string | undefined | null) => value && rows.push({ label, value });
  push(q.service, service ? service.title[lang] : q.serviceNone);
  push(q.from, data.departure);
  push(service?.hourly ? q.toOptional : q.to, data.arrival);
  push(q.date, `${day(data.date)}, ${data.timeTbd ? q.timeTbd : `${data.time} (${tz})`}`);
  if (data.tripType === 'return') push(q.roundTrip, `${day(data.returnDate)}, ${data.returnTime} (${tz})`);
  if (data.duration) push(q.duration, `${data.duration} h`);
  push(q.program, data.program);
  push(q.passengers, String(data.passengers));
  push(q.luggage, [luggageLabels[data.luggage], data.luggageDetail].filter(Boolean).join(' · '));
  push(q.travelRef, data.travelRef);
  push(q.contactMethod, channelLabel);
  push(data.contactMethod === 'email' ? q.email : channelLabel, data.contactMethod === 'email' ? data.email : data.phone);
  push(q.message, data.details);

  const lines: string[] = [];
  const night = known(content.fares.night);
  const nightLine = night ? fill(q.fareNight, { start: night.start.replace(':00', ' h').replace(/^0/, ''), end: night.end.replace(':00', ' h').replace(/^0/, ''), rate: Math.round(night.rate * 100) }) : '';
  const route = !service?.hourly ? findRoute(content, data.departure, data.arrival) : undefined;
  const hourly = service?.hourly ? known(content.fares.hourly) : undefined;
  if (route) {
    lines.push(`${route.from} ↔ ${route.to} : ${eur(route.price.amount)} · ${d.fares.oneWay}`);
    if (data.tripType === 'return') lines.push(lang === 'fr' ? 'Aller-retour : addition des deux trajets.' : 'Return journey: both journeys are added.');
    if (night && (inNight(data.time, night.start, night.end) || (data.tripType === 'return' && inNight(data.returnTime, night.start, night.end)))) lines.push(nightLine);
  } else if (hourly) {
    lines.push(`${d.fares.hourly} : ${eur(hourly.pricePerHour)} ${d.fares.perHour} · ${fill(d.fares.minimum, { hours: hourly.minHours, total: eur(hourly.minTotal) })}`);
    if (night && inNight(data.time, night.start, night.end)) lines.push(nightLine);
  }
  return lines.length ? { rows, fare: { kind: 'reference', lines } } : { rows, fare: { kind: 'custom', lines: [q.fareCustom] } };
}
