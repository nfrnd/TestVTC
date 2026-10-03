import { PUBLIC_SITE_ENV, PUBLIC_SITE_URL } from 'astro:env/client';
import { business } from '../content/business';
import { known, type Lang } from '../content/types';
import { t } from '../i18n';

export const isPreview = PUBLIC_SITE_ENV !== 'production';
export const siteUrl = PUBLIC_SITE_URL.replace(/\/$/, '');
export const absolute = (path: string) => `${siteUrl}${path}`;

/** Trading name once confirmed, otherwise a neutral descriptor (never an invented brand). */
export const brandName = (lang: Lang) => known(business.name) ?? t(lang).brandFallback;
export const phone = () => known(business.phone);
export const whatsapp = () => known(business.whatsapp);
