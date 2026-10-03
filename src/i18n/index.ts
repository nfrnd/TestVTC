import type { BusinessMode, L10n, Lang } from '../content/types';
import { BUSINESS_MODE } from '../content';
import { fr, type Dict } from './fr';
import { en } from './en';
import { demoEn, demoFr, type DictOverride } from './demo';

function merge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return (over ?? base) as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && b && typeof b === 'object' ? merge(b, v) : v;
  }
  return out as T;
}

const dicts: Record<BusinessMode, Record<Lang, Dict>> = {
  live: { fr, en },
  demo: { fr: merge(fr, demoFr as DictOverride), en: merge(en, demoEn as DictOverride) },
};

/** Interface copy for a language; the business mode defaults to this build's mode. */
export const t = (lang: Lang, mode: BusinessMode = BUSINESS_MODE): Dict => dicts[mode][lang];
export const loc = (v: L10n, lang: Lang) => v[lang];
export const htmlLang: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' };
/** Field-specific message when one exists, otherwise the generic message for the code. */
export const errorMessage = (d: Dict, field: string, code: string): string =>
  d.fieldErrors?.[field]?.[code] ?? (d.errors as Record<string, string>)[code] ?? d.errors.invalid;
/** Replaces {placeholders} in a template. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
export type { Dict };
