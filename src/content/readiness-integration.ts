import type { AstroIntegration } from 'astro';
import { contentGaps } from './readiness';

// Production guard: a production build refuses to complete while critical
// business facts are unknown or the canonical URL is still local.
export function readinessIntegration({ siteEnv, siteUrl }: { siteEnv: string; siteUrl: string }): AstroIntegration {
  return {
    name: 'vtc-readiness',
    hooks: {
      'astro:build:start': ({ logger }) => {
        const gaps = contentGaps();
        const critical = gaps.filter((g) => g.critical);
        logger.info(`Mode ${siteEnv}. Données à confirmer : ${gaps.length} (dont ${critical.length} bloquantes pour la production).`);
        if (siteEnv !== 'production') return;
        const problems = critical.map((g) => `${g.path} : ${g.note}`);
        if (/localhost|127\.0\.0\.1/.test(siteUrl)) problems.unshift(`SITE_URL doit être le vrai domaine (actuel : ${siteUrl})`);
        if (problems.length) {
          throw new Error(`Build de production refusé. À compléter dans src/content/business.ts ou l'environnement :\n - ${problems.join('\n - ')}`);
        }
      },
    },
  };
}
