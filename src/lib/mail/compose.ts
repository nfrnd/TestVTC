// Builds the email the driver receives. Plain text first (always readable),
// plus a minimal HTML version where every user value is escaped.
import type { ContactData, QuoteData } from '../validation';

export interface MailMessage {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Header-safe single line (no CR/LF), length-capped. */
function headerSafe(s: string, max = 90) {
  const one = s.replace(/[\r\n]+/g, ' ').trim();
  return one.length > max ? `${one.slice(0, max - 1)}…` : one;
}

function frDate(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

function render(title: string, rows: [string, string][], footer: string, replyTo?: string): Omit<MailMessage, 'subject'> {
  const filled = rows.filter(([, v]) => v);
  const width = Math.max(...filled.map(([k]) => k.length));
  const text = [title, '', ...filled.map(([k, v]) => `${k.padEnd(width)} : ${v.includes('\n') ? `\n  ${v.replace(/\n/g, '\n  ')}` : v}`), '', footer].join('\n');
  const html = `<!doctype html><html lang="fr"><body style="font-family:system-ui,sans-serif;color:#11191d;line-height:1.5">
<h1 style="font-size:18px">${escapeHtml(title)}</h1>
<table cellpadding="6" style="border-collapse:collapse">${filled
    .map(([k, v]) => `<tr><th align="left" valign="top" style="color:#44575b;font-weight:600;padding-right:16px">${escapeHtml(k)}</th><td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`)
    .join('')}</table>
<p style="color:#44575b;font-size:13px">${escapeHtml(footer)}</p></body></html>`;
  return { text, html, replyTo };
}

export function composeQuote(d: QuoteData, opts: { serviceTitle?: string; requestId: string; lang: string; simulated?: boolean }): MailMessage {
  const contactLine = d.contactMethod === 'email' ? `Email (${d.email})` : `Téléphone (${d.phone})`;
  const rows: [string, string][] = [
    ['Départ', d.departure],
    ['Arrivée', d.arrival],
    ['Date', frDate(d.date)],
    ['Heure', `${d.time} (heure de Paris, Europe/Paris)`],
    ['Passagers', String(d.passengers)],
    ['Prestation', opts.serviceTitle ?? 'Non précisée'],
    ['Nom', d.name],
    ['Réponse souhaitée', contactLine],
    ['Email', d.email],
    ['Téléphone', d.phone],
    ['Bagages', d.luggage],
    ['Vol / train', d.travelRef],
    ['Retour souhaité', d.returnTrip],
    ['Autre demande', d.details],
    ['Langue du site', opts.lang === 'en' ? 'Anglais' : 'Français'],
  ];
  return {
    subject: headerSafe(`${opts.simulated ? '[TEST] ' : ''}Demande de devis : ${d.date} ${d.time}, ${d.departure} vers ${d.arrival}`),
    ...render(
      'Nouvelle demande de devis',
      rows,
      `Demande envoyée depuis le site (réf. ${opts.requestId}). Aucun trajet n'est confirmé : contactez la personne pour préciser le tarif et la disponibilité.`,
      d.email || undefined,
    ),
  };
}

export function composeContact(d: ContactData, opts: { requestId: string; lang: string; simulated?: boolean }): MailMessage {
  const rows: [string, string][] = [
    ['Nom', d.name],
    ['Réponse souhaitée', d.contactMethod === 'email' ? `Email (${d.email})` : `Téléphone (${d.phone})`],
    ['Email', d.email],
    ['Téléphone', d.phone],
    ['Message', d.message],
    ['Langue du site', opts.lang === 'en' ? 'Anglais' : 'Français'],
  ];
  return {
    subject: headerSafe(`${opts.simulated ? '[TEST] ' : ''}Message de ${d.name}`),
    ...render('Nouveau message depuis le site', rows, `Message envoyé depuis la page Contact (réf. ${opts.requestId}).`, d.email || undefined),
  };
}
