import type { L10n, Lang } from '../content/types';
import { fr, type Dict } from './fr';
import { en } from './en';

export const dicts: Record<Lang, Dict> = { fr, en };
export const t = (lang: Lang): Dict => dicts[lang];
export const loc = (v: L10n, lang: Lang) => v[lang];
export const htmlLang: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' };
export type { Dict };
