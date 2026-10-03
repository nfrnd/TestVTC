import type { APIRoute } from 'astro';
import { indexable, routes } from '../i18n/routes';
import { absolute } from '../lib/site';

// Hand-written so translated slugs (/tarifs <-> /en/rates) are paired as alternates.
export const GET: APIRoute = () => {
  const urls = indexable.flatMap((key) =>
    (['fr', 'en'] as const).map((lang) => {
      const alts = (['fr', 'en'] as const)
        .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${absolute(routes[key][l])}"/>`)
        .join('');
      return `<url><loc>${absolute(routes[key][lang])}</loc>${alts}<xhtml:link rel="alternate" hreflang="x-default" href="${absolute(routes[key].fr)}"/></url>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
