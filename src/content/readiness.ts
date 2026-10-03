// Lists what is still unknown in the LIVE content. Used by the production guard
// (build fails on critical gaps), by `npm run content:report`, and by REVIEW.md.
import { liveContent } from './business';
import type { Field, SiteContent } from './types';

export interface Gap {
  path: string;
  note: string;
  critical: boolean;
}

function walk(obj: unknown, path: string, out: Gap[]) {
  if (!obj || typeof obj !== 'object') return;
  const f = obj as Field<unknown> & Record<string, unknown>;
  if ('known' in f && typeof f.known === 'boolean') {
    if (!f.known) out.push({ path, note: f.note, critical: Boolean(f.critical) });
    return;
  }
  for (const [k, v] of Object.entries(obj)) walk(v, path ? `${path}.${k}` : k, out);
}

export function contentGaps(c: SiteContent = liveContent): Gap[] {
  const out: Gap[] = [];
  walk(c.business, 'business', out);
  walk(c.vehicle, 'vehicle', out);
  for (const s of c.services) {
    if (s.status !== 'confirmed') out.push({ path: `services.${s.id}`, note: `Prestation « ${s.title.fr} » à confirmer (ou à retirer)`, critical: true });
    walk({ price: s.price, conditions: s.conditions }, `services.${s.id}`, out);
  }
  for (const p of c.pricingConditions) walk(p.value, `pricingConditions.${p.id}`, out);
  for (const q of c.faq) if (q.status !== 'documented') out.push({ path: `faq.${q.id}`, note: `Réponse FAQ « ${q.q.fr} » à documenter`, critical: false });
  return out;
}

/** Everything that prevents a real publication. A fictional dataset always fails. */
export function liveReadinessProblems(siteUrl: string, c: SiteContent = liveContent): string[] {
  const problems = contentGaps(c)
    .filter((g) => g.critical)
    .map((g) => `${g.path} : ${g.note}`);
  if (c.fictional || c.mode !== 'live' || c.demo) problems.unshift('Le contenu est fictif (jeu de démonstration) : il ne peut pas être publié comme une activité réelle.');
  if (/localhost|127\.0\.0\.1|\.example(\/|$)/.test(siteUrl)) problems.unshift(`SITE_URL doit être le vrai domaine (actuel : ${siteUrl})`);
  return problems;
}
