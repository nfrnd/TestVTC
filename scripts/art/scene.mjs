// Hero scene planes: dusk over the bay of Cannes looking west, with the Esterel
// massif on the horizon and the Suquet hill (old town, tower) above the harbour.
// Each plane is a separate transparent SVG so it can move independently and be
// swapped for a real photographic plate later (see docs/ASSETS.md).

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Rugged ridge line: layered value noise, deterministic.
function ridge({ w, base, amp, seed, step = 14, octaves = [[1, 220], [0.45, 70], [0.18, 22]], lift = () => 0 }) {
  const r = rng(seed);
  const layers = octaves.map(([a, len]) => {
    const n = Math.ceil(w / len) + 2;
    const v = Array.from({ length: n }, () => r());
    return (x) => {
      const t = x / len, i = Math.floor(t), f = t - i;
      const s = f * f * (3 - 2 * f);
      return a * (v[i] * (1 - s) + v[i + 1] * s);
    };
  });
  const pts = [];
  for (let x = -step; x <= w + step; x += step) {
    const y = base - amp * layers.reduce((acc, fn) => acc + fn(Math.max(0, x)), 0) - lift(x);
    pts.push([x, +y.toFixed(1)]);
  }
  return pts;
}
const poly = (pts, bottom, w) =>
  `M ${pts[0][0]} ${bottom} ` + pts.map(([x, y]) => `L ${x} ${y}`).join(' ') + ` L ${w + 20} ${bottom} Z`;

const C = {
  skyTop: '#0d161a', skyMid: '#1a2830', skyLow: '#485a5f', haze: '#a39f93',
  glowCore: '#e8d8bd', glowMid: '#a49c8e',
  ridgeFar: '#3a4a50', ridgeMid: '#2b3a40', ridgeNear: '#1f2c32',
  sea: '#162329', seaDeep: '#0f191e', shimmer: '#cdbfa8', shimmerCool: '#8ea3a4',
  hill: '#111b20', hillEdge: '#2a3a40', light: '#e4d2ae',
};

export const LAYOUTS = {
  desktop: { w: 1920, h: 1080, horizon: 640, glow: [1480, 640], suquet: { x: 1010, w: 400, top: 548 }, ridgeAmp: 1, seaBottom: 1080 },
  mobile: { w: 900, h: 1600, horizon: 1050, glow: [640, 1050], suquet: { x: 30, w: 360, top: 958 }, ridgeAmp: 0.85, seaBottom: 1600 },
};

export function backSvg(kind = 'desktop') {
  const L = LAYOUTS[kind];
  const { w, h, horizon } = L;
  const [gx, gy] = L.glow;
  const far = ridge({ w, base: horizon + 2, amp: 120 * L.ridgeAmp, seed: 7, lift: (x) => 40 * Math.exp(-(((x - w * 0.18) / (w * 0.22)) ** 2)) });
  const mid = ridge({ w, base: horizon + 2, amp: 95 * L.ridgeAmp, seed: 19, octaves: [[1, 160], [0.5, 50], [0.2, 16]], lift: (x) => 30 * Math.exp(-(((x - w * 0.42) / (w * 0.2)) ** 2)) - 25 });
  const near = ridge({ w, base: horizon + 2, amp: 55 * L.ridgeAmp, seed: 31, octaves: [[1, 120], [0.4, 40], [0.15, 12]], lift: (x) => -20 + 10 * Math.sin(x / 90) });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.skyTop}"/><stop offset="${(horizon * 0.55) / h}" stop-color="${C.skyMid}"/>
      <stop offset="${(horizon * 0.92) / h}" stop-color="${C.skyLow}"/><stop offset="${horizon / h}" stop-color="${C.haze}"/>
      <stop offset="1" stop-color="${C.seaDeep}"/>
    </linearGradient>
    <radialGradient id="glow" cx="${gx}" cy="${gy}" r="${w * 0.5}" gradientUnits="userSpaceOnUse" gradientTransform="translate(${gx} ${gy}) scale(1 .42) translate(${-gx} ${-gy})">
      <stop offset="0" stop-color="${C.glowCore}" stop-opacity="1"/><stop offset=".16" stop-color="${C.glowMid}" stop-opacity=".78"/>
      <stop offset=".5" stop-color="${C.glowMid}" stop-opacity=".22"/><stop offset="1" stop-color="${C.glowMid}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.haze}" stop-opacity="0"/><stop offset="1" stop-color="${C.haze}" stop-opacity=".35"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  <rect width="${w}" height="${horizon + 40}" fill="url(#glow)"/>
  <path d="${poly(far, horizon + 4, w)}" fill="${C.ridgeFar}"/>
  <path d="${poly(far, horizon + 4, w)}" fill="url(#fade)"/>
  <path d="${poly(mid, horizon + 4, w)}" fill="${C.ridgeMid}"/>
  <path d="${poly(near, horizon + 4, w)}" fill="${C.ridgeNear}"/>
</svg>`;
}

function suquet(L) {
  const { x, w, top } = L.suquet;
  const base = L.horizon + 6;
  const r = rng(5);
  // hill silhouette rising to a crest on the right third
  const crest = x + w * 0.62;
  const hill = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const px = x + t * w;
    const bump = Math.exp(-(((px - crest) / (w * 0.32)) ** 2));
    hill.push([px, +(base - (base - top) * bump - 6 * r()).toFixed(1)]);
  }
  // stepped houses along the slope
  const houses = [];
  for (let i = 0; i < 26; i++) {
    const hx = x + 10 + r() * (w - 30);
    const bump = Math.exp(-(((hx - crest) / (w * 0.32)) ** 2));
    const hy = base - (base - top) * bump;
    const hw = 10 + r() * 22, hh = 8 + r() * 16;
    houses.push(`<rect x="${hx.toFixed(1)}" y="${(hy - hh + 4).toFixed(1)}" width="${hw.toFixed(1)}" height="${(hh + 6).toFixed(1)}" fill="${C.hill}"/>`);
  }
  const lights = [];
  for (let i = 0; i < 34; i++) {
    const lx = x + 12 + r() * (w - 24);
    const bump = Math.exp(-(((lx - crest) / (w * 0.32)) ** 2));
    const ly = base - (base - top) * bump * r() + 4;
    if (ly > base - 2) continue;
    lights.push(`<rect x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="2.4" height="2.4" fill="${C.light}" opacity="${(0.35 + r() * 0.55).toFixed(2)}"/>`);
  }
  // the medieval tower (square, slightly tapered) and the church bell tower
  const tx = crest - 8, tw = 26, th = 96;
  const ty = top - th + 10;
  const tower = `<path d="M ${tx} ${top + 12} L ${tx + 2} ${ty + 8} L ${tx - 1} ${ty + 8} L ${tx - 1} ${ty} L ${tx + tw + 1} ${ty} L ${tx + tw + 1} ${ty + 8} L ${tx + tw - 2} ${ty + 8} L ${tx + tw} ${top + 12} Z" fill="${C.hill}"/>
    <rect x="${tx + 9}" y="${ty + 18}" width="7" height="12" fill="${C.light}" opacity=".5"/>`;
  const bx = crest - 64;
  const bell = `<path d="M ${bx} ${top + 14} L ${bx} ${top - 48} L ${bx + 7} ${top - 66} L ${bx + 14} ${top - 48} L ${bx + 14} ${top + 14} Z" fill="${C.hill}"/>`;
  const church = `<rect x="${bx - 46}" y="${top - 18}" width="70" height="40" fill="${C.hill}"/><path d="M ${bx - 50} ${top - 16} L ${bx - 11} ${top - 38} L ${bx + 28} ${top - 16} Z" fill="${C.hill}"/>`;
  // harbour masts at the foot of the hill
  const masts = [];
  for (let i = 0; i < 14; i++) {
    const mx = x + w * 0.9 + i * 13 + r() * 6;
    const mh = 30 + r() * 46;
    masts.push(`<line x1="${mx.toFixed(1)}" y1="${base}" x2="${mx.toFixed(1)}" y2="${(base - mh).toFixed(1)}" stroke="${C.hillEdge}" stroke-width="1.1"/>`);
  }
  return `<g>${masts.join('')}${bell}${church}${tower}<path d="M ${x - 20} ${base + 2} ${hill.map(([a, b]) => `L ${a} ${b}`).join(' ')} L ${x + w + 30} ${base + 2} Z" fill="${C.hill}"/>${houses.join('')}${lights.join('')}
  <rect x="${x - 20}" y="${base - 3}" width="${w + 260}" height="5" fill="${C.hill}"/></g>`;
}

function coast(L) {
  const r = rng(3);
  const base = L.horizon + 6;
  const end = L.suquet.x + 40;
  let d = `M -20 ${base + 2} L -20 ${base - 10}`;
  for (let x = 0; x <= end; x += 18) d += ` L ${x} ${(base - 8 - r() * 7 - (x / end) * 6).toFixed(1)}`;
  d += ` L ${end} ${base + 2} Z`;
  const lights = [];
  for (let i = 0; i < Math.round(end / 14); i++) {
    const x = r() * end;
    lights.push(`<rect x="${x.toFixed(1)}" y="${(base - 4 - r() * 8).toFixed(1)}" width="2" height="2" fill="${C.light}" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`);
  }
  return `<path d="${d}" fill="${C.hill}"/>${lights.join('')}`;
}

export function midSvg(kind = 'desktop') {
  const L = LAYOUTS[kind];
  const { w, h, horizon } = L;
  const [gx] = L.glow;
  const r = rng(11);
  const shimmer = [];
  for (let i = 0; i < 70; i++) {
    const y = horizon + 10 + (r() ** 1.6) * (h - horizon) * 0.55;
    const spread = 40 + (y - horizon) * 0.9;
    const x = gx + (r() - 0.5) * spread * 2;
    const len = 18 + r() * 60 * (1 + (y - horizon) / 300);
    shimmer.push(`<rect x="${(x - len / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${len.toFixed(1)}" height="${(1.2 + r() * 1.6).toFixed(1)}" rx="1" fill="${C.shimmer}" opacity="${(0.18 + r() * 0.5 * Math.max(0.2, 1 - (y - horizon) / 300)).toFixed(2)}"/>`);
  }
  const ripples = [];
  for (let i = 0; i < 46; i++) {
    const y = horizon + 14 + r() * (h - horizon) * 0.6;
    const x = r() * w;
    const len = 30 + r() * 120;
    ripples.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${len.toFixed(1)}" height="1" fill="${C.shimmerCool}" opacity="${(0.05 + r() * 0.1).toFixed(2)}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice">
  <defs>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.sea}"/><stop offset=".35" stop-color="${C.seaDeep}"/><stop offset="1" stop-color="#0b1317"/>
    </linearGradient>
    <linearGradient id="seaGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.glowMid}" stop-opacity=".22"/><stop offset="1" stop-color="${C.glowMid}" stop-opacity="0"/></linearGradient>
  </defs>
  <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#sea)"/>
  <rect y="${horizon}" width="${w}" height="${(h - horizon) * 0.35}" fill="url(#seaGlow)"/>
  <rect y="${horizon}" width="${w}" height="1.5" fill="${C.glowCore}" opacity=".35"/>
  ${ripples.join('')}
  ${shimmer.join('')}
  ${coast(L)}
  ${suquet(L)}
</svg>`;
}

// The promenade and road the car stands on. Drawn wide; sliced by the page.
export function roadSvg() {
  const w = 1920, h = 300;
  const r = rng(23);
  const lamps = [];
  for (let i = 0; i < 6; i++) {
    const x = 120 + i * 330 + r() * 60;
    lamps.push(`<ellipse cx="${x.toFixed(0)}" cy="${(150 + r() * 40).toFixed(0)}" rx="${(60 + r() * 50).toFixed(0)}" ry="6" fill="#d8c8a8" opacity="${(0.06 + r() * 0.06).toFixed(2)}" filter="url(#b)"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMin slice">
  <defs>
    <linearGradient id="asphalt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141d21"/><stop offset=".25" stop-color="#0e1518"/><stop offset="1" stop-color="#090e10"/></linearGradient>
    <linearGradient id="walk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a383d"/><stop offset="1" stop-color="#18232700"/></linearGradient>
    <filter id="b" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#asphalt)"/>
  <rect width="${w}" height="16" fill="#1b262b"/>
  <rect width="${w}" height="2" fill="#56686c" opacity=".7"/>
  <rect y="16" width="${w}" height="10" fill="url(#walk)"/>
  <rect y="26" width="${w}" height="1.5" fill="#000" opacity=".4"/>
  ${lamps.join('')}
  ${Array.from({ length: 14 }, (_, i) => `<rect x="${i * 150 + 30}" y="236" width="70" height="3" fill="#8b9a9b" opacity=".12"/>`).join('')}
</svg>`;
}

// Near foreground: palm fronds hanging into the top corner. Very dark, soft edge.
export function frondsSvg() {
  const w = 900, h = 700;
  const r = rng(41);
  const parts = [];
  const frond = (ox, oy, ang, len, curl, n) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = ang + curl * t * t;
      const prev = pts[i - 1] || [ox, oy];
      pts.push(i === 0 ? [ox, oy] : [prev[0] + Math.cos(a) * (len / n), prev[1] + Math.sin(a) * (len / n)]);
    }
    parts.push(`<path d="M ${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')}" stroke="#061013" stroke-width="7" fill="none" stroke-linecap="round"/>`);
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const t = i / pts.length;
      const a = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
      const L = (0.35 + Math.sin(Math.PI * Math.min(1, t * 1.1)) * 0.65) * (120 + r() * 40);
      for (const side of [-1, 1]) {
        const la = a + side * (1.05 + r() * 0.2);
        const ex = x + Math.cos(la) * L * 0.75;
        const ey = y + Math.sin(la) * L * 0.75 + L * 0.55; // gravity
        const cx = x + Math.cos(la) * L * 0.55;
        const cy = y + Math.sin(la) * L * 0.55 - 4;
        parts.push(`<path d="M ${x.toFixed(1)} ${y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="#071216" stroke-width="${(4.2 - t * 1.6).toFixed(1)}" fill="none" stroke-linecap="round"/>`);
      }
    }
  };
  frond(905, -10, Math.PI * 0.92, 620, 0.55, 26);
  frond(905, -20, Math.PI * 0.78, 520, 0.45, 22);
  frond(905, 0, Math.PI * 1.02, 520, 0.85, 22);
  frond(905, -30, Math.PI * 0.64, 380, 0.3, 16);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs><filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.4"/></filter></defs>
  <g filter="url(#soft)">${parts.join('')}</g>
</svg>`;
}
