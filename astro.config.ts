import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';
import { readinessIntegration } from './src/content/readiness-integration';

// Build-time switches (see README "Configurations").
//   SITE_ENV      preview (default, noindex + "à confirmer" annotations) | production
//   SITE_URL      canonical origin, e.g. https://www.example.fr (required in production)
//   DEPLOY_TARGET node (default, standalone server) | netlify
const SITE_ENV = process.env.SITE_ENV === 'production' ? 'production' : 'preview';
const SITE_URL = process.env.SITE_URL || 'http://localhost:4321';
const DEPLOY_TARGET = process.env.DEPLOY_TARGET === 'netlify' ? 'netlify' : 'node';

const adapter =
  DEPLOY_TARGET === 'netlify'
    ? (await import('@astrojs/netlify')).default()
    : node({ mode: 'standalone' });

export default defineConfig({
  site: SITE_URL,
  // Pages are prerendered. Only src/pages/api/demandes.ts opts out (prerender = false).
  output: 'static',
  adapter,
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  // Blocks cross-site form POSTs to on-demand routes (Astro default, stated explicitly).
  security: { checkOrigin: true },
  devToolbar: { enabled: false },
  integrations: [readinessIntegration({ siteEnv: SITE_ENV, siteUrl: SITE_URL })],
  env: {
    schema: {
      PUBLIC_SITE_ENV: envField.enum({ context: 'client', access: 'public', values: ['preview', 'production'], default: SITE_ENV }),
      PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public', default: SITE_URL }),
      // Server-only. Read at runtime by the request endpoint; never sent to the browser.
      EMAIL_TRANSPORT: envField.enum({ context: 'server', access: 'secret', values: ['resend', 'test', 'fail'], optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      MAIL_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
      MAIL_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
      ALLOWED_ORIGINS: envField.string({ context: 'server', access: 'secret', optional: true }),
      TRUST_PROXY: envField.boolean({ context: 'server', access: 'secret', optional: true }),
      RATE_LIMIT_MAX: envField.number({ context: 'server', access: 'secret', optional: true }),
      RATE_LIMIT_WINDOW_S: envField.number({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
