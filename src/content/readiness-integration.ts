import type { AstroIntegration } from 'astro';
import { contentGaps, liveReadinessProblems } from './readiness';

// Publication guard.
//  - demo: builds without any real business data, but can never be an indexable
//    "production" publication (SITE_ENV=production is refused).
//  - live + production: refuses to complete while critical facts are unknown,
//    while the canonical URL is local, or if the content is flagged fictional.
export function readinessIntegration({ businessMode, siteEnv, siteUrl }: { businessMode: string; siteEnv: string; siteUrl: string }): AstroIntegration {
  return {
    name: 'vtc-readiness',
    hooks: {
      'astro:build:start': ({ logger }) => {
        if (businessMode === 'demo') {
          logger.info('Mode métier : DÉMONSTRATION (AZURÉA PRIVÉ, fictif). noindex, contacts et demandes simulés.');
          if (siteEnv === 'production') {
            throw new Error('BUSINESS_MODE=demo ne peut pas être combiné avec SITE_ENV=production : une démonstration fictive reste non indexable. Utiliser SITE_ENV=preview (défaut) ou BUSINESS_MODE=live.');
          }
          return;
        }
        const gaps = contentGaps();
        const critical = gaps.filter((g) => g.critical);
        logger.info(`Mode métier : LIVE (${siteEnv}). Données à confirmer : ${gaps.length} (dont ${critical.length} bloquantes pour la production).`);
        if (siteEnv !== 'production') return;
        const problems = liveReadinessProblems(siteUrl);
        if (problems.length) {
          throw new Error(`Build de production refusé. À compléter dans src/content/business.ts ou l'environnement :\n - ${problems.join('\n - ')}`);
        }
      },
    },
  };
}
