import type { APIRoute } from 'astro';
import { absolute, isPreview } from '../lib/site';

// Preview builds are never indexable; production points to the sitemap.
export const GET: APIRoute = () =>
  new Response(isPreview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${absolute('/sitemap.xml')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
