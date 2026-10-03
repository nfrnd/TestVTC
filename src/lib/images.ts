// Bundled photographs (hashed file names, long-term cache). Content files refer
// to them as `asset:<key>` so business data stays free of build imports.
import driver from '../assets/azurea/driver.webp?url';
import driver720 from '../assets/azurea/driver-720.webp?url';
import profile from '../assets/azurea/vehicle-profile.webp?url';
import profile960 from '../assets/azurea/vehicle-profile-960.webp?url';
import interior from '../assets/azurea/interior.webp?url';
import interior960 from '../assets/azurea/interior-960.webp?url';

export interface Img {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

const library: Record<string, Img> = {
  driver: { src: driver720, srcset: `${driver720} 720w, ${driver} 1122w`, width: 1122, height: 1402 },
  'vehicle-profile': { src: profile960, srcset: `${profile960} 960w, ${profile} 1536w`, width: 1536, height: 1024 },
  interior: { src: interior960, srcset: `${interior960} 960w, ${interior} 1536w`, width: 1536, height: 1024 },
};

/** Resolves `asset:<key>` to a bundled image, or a public path to a plain image. */
export function resolveImage(ref: string): Img | null {
  if (ref.startsWith('asset:')) return library[ref.slice(6)] ?? null;
  return ref ? { src: ref, srcset: '', width: 1200, height: 1500 } : null;
}
