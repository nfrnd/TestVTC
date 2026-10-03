// Every business fact is either confirmed (with its value) or explicitly unknown.
// Components must go through `known()` and render nothing (production) or a
// visible "à confirmer" annotation (preview) for unknown values. Never put a
// plausible-looking placeholder value in a confirmed() call.

export type Lang = 'fr' | 'en';
export type L10n = Record<Lang, string>;

export interface Confirmed<T> {
  readonly known: true;
  readonly value: T;
}
export interface Unknown {
  readonly known: false;
  /** What is missing, for Noa and the annotation shown in preview builds. */
  readonly note: string;
  /** Blocks a production build while unknown. */
  readonly critical?: boolean;
}
export type Field<T> = Confirmed<T> | Unknown;

export const confirmed = <T>(value: T): Confirmed<T> => ({ known: true, value });
export const unknown = (note: string, opts: { critical?: boolean } = {}): Unknown => ({ known: false, note, ...opts });

export function known<T>(f: Field<T>): T | undefined {
  return f.known ? f.value : undefined;
}

export type PriceKind = 'forfait' | 'indicatif' | 'a-partir-de';
export interface Price {
  amount: number; // euros TTC
  kind: PriceKind;
}

export type RouteMotif = 'transfer' | 'local' | 'business' | 'event' | 'hourly';

export interface Service {
  id: string;
  motif: RouteMotif;
  /** Until the driver confirms the service is offered, it stays 'to-confirm'. */
  status: 'confirmed' | 'to-confirm';
  title: L10n;
  short: L10n;
  summary: L10n;
  price: Field<Price>;
  /** Inclusions/conditions specific to this offer, only when confirmed. */
  conditions: Field<L10n[]>;
}

export interface FaqItem {
  id: string;
  /** 'documented' answers rely only on facts in this file or on how the site works. */
  status: 'documented' | 'to-document';
  q: L10n;
  a: L10n;
}
