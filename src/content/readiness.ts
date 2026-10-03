// Lists what is still unknown. Used by the production guard (build fails on
// critical gaps), by `npm run content:report`, and by REVIEW.md.
import { business, faq, pricingConditions, services, vehicle } from './business';
import type { Field } from './types';

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

export function contentGaps(): Gap[] {
  const out: Gap[] = [];
  walk(business, 'business', out);
  walk(vehicle, 'vehicle', out);
  for (const s of services) {
    if (s.status !== 'confirmed') out.push({ path: `services.${s.id}`, note: `Prestation « ${s.title.fr} » à confirmer (ou à retirer)`, critical: true });
    walk({ price: s.price, conditions: s.conditions }, `services.${s.id}`, out);
  }
  for (const c of pricingConditions) walk(c.value, `pricingConditions.${c.id}`, out);
  for (const q of faq) if (q.status !== 'documented') out.push({ path: `faq.${q.id}`, note: `Réponse FAQ « ${q.q.fr} » à documenter`, critical: false });
  return out;
}
