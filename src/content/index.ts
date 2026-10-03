// Selects the business content for this build.
//   BUSINESS_MODE=demo (default): fictional AZURÉA PRIVÉ scenario (./demo.ts)
//   BUSINESS_MODE=live: the real business (./business.ts), guarded before publication
// The mode is fixed at build time (astro.config.ts / vitest.config.ts define it).
import { demoContent } from './demo';
import { liveContent } from './business';
import type { BusinessMode, SiteContent } from './types';
import { passengerLimitOf } from './types';

declare const __BUSINESS_MODE__: BusinessMode;

export const BUSINESS_MODE: BusinessMode = typeof __BUSINESS_MODE__ !== 'undefined' && __BUSINESS_MODE__ === 'live' ? 'live' : 'demo';
export const isDemo = BUSINESS_MODE === 'demo';

export const contentFor = (mode: BusinessMode): SiteContent => (mode === 'live' ? liveContent : demoContent);
export const content: SiteContent = contentFor(BUSINESS_MODE);

export const { business, vehicle, vehicleFacts, services, fares, pricingConditions, faq, demo } = content;
export const passengerLimit = () => passengerLimitOf(content);
export { known } from './types';
