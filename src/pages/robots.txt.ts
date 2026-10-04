import type { APIRoute } from 'astro';
import { absolute, indexable, isDemo } from '../lib/site';

// Three modes, one rule: only a LIVE PRODUCTION build is indexable.
//  - demo (always) and live preview: every page carries <meta name="robots" content="noindex, nofollow">.
//    That meta is what keeps them out of search results, so crawling is NOT blocked here:
//    a robots.txt "Disallow" would stop crawlers from ever reading the noindex, and a
//    disallowed URL can still be listed (without its content) if something links to it.
//    No sitemap is announced for these builds.
//  - live production: crawlable, sitemap announced.
// /api/ is never useful to a crawler.
const notIndexable = `# ${isDemo ? 'Fictional demonstration' : 'Preview build'}: not meant for search engines.
# Every page sends <meta name="robots" content="noindex, nofollow">; crawling stays allowed
# so crawlers can read it. No sitemap is announced.
User-agent: *
Allow: /
Disallow: /api/
`;
const production = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${absolute('/sitemap.xml')}
`;

export const GET: APIRoute = () =>
  new Response(indexable ? production : notIndexable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
