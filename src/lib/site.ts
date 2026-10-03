import { PUBLIC_SITE_ENV, PUBLIC_SITE_URL } from 'astro:env/client';
import { business, isDemo } from '../content';
import { known, type Lang } from '../content/types';
import { t } from '../i18n';

export { isDemo };
/** "À confirmer" annotations: live business, preview build only. Never in the demo. */
export const isPreview = !isDemo && PUBLIC_SITE_ENV !== 'production';
/** Only a live production build is indexable. The demo is always noindex. */
export const indexable = !isDemo && PUBLIC_SITE_ENV === 'production';
export const siteUrl = PUBLIC_SITE_URL.replace(/\/$/, '');
export const absolute = (path: string) => `${siteUrl}${path}`;

/** Trading name once confirmed, otherwise a neutral descriptor (never an invented brand in live). */
export const brandName = (lang: Lang) => known(business.name) ?? t(lang).brandFallback;
export const phone = () => known(business.phone);
export const whatsapp = () => known(business.whatsapp);
