import type { Lang } from '../content/types';

// Equivalent pages across languages. The language switcher and hreflang use this table.
export const routes = {
  home: { fr: '/', en: '/en/' },
  rates: { fr: '/tarifs/', en: '/en/rates/' },
  quote: { fr: '/devis/', en: '/en/quote/' },
  contact: { fr: '/contact/', en: '/en/contact/' },
  legal: { fr: '/mentions-legales/', en: '/en/legal-notice/' },
  privacy: { fr: '/confidentialite/', en: '/en/privacy/' },
  quoteSent: { fr: '/devis/transmis/', en: '/en/quote/sent/' },
  quoteSimulated: { fr: '/devis/simulation/', en: '/en/quote/simulated/' },
  contactSent: { fr: '/contact/transmis/', en: '/en/contact/sent/' },
  contactSimulated: { fr: '/contact/simulation/', en: '/en/contact/simulated/' },
} as const satisfies Record<string, Record<Lang, string>>;

export type RouteKey = keyof typeof routes;

/** Pages listed in the sitemap (result pages are noindex). */
export const indexable: RouteKey[] = ['home', 'rates', 'quote', 'contact', 'legal', 'privacy'];

export const href = (key: RouteKey, lang: Lang) => routes[key][lang];
export const otherLang = (lang: Lang): Lang => (lang === 'fr' ? 'en' : 'fr');
export const quoteHref = (lang: Lang, serviceId?: string) =>
  serviceId ? `${routes.quote[lang]}?prestation=${encodeURIComponent(serviceId)}` : routes.quote[lang];
