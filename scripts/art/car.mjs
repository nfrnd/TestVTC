// Tesla Model 3 side profile, facing left, authored as vector art.
// All coordinates are in millimetres (x from the front bumper, h above the
// ground) and converted to SVG pixels at 1 px = 3 mm, so the proportions follow
// the real car: length ~4.7 m, wheelbase 2875 mm, height ~1.44 m.
// The profile is deliberately generic between the 2017-2023 car and the 2024+
// "Highland" refresh (same silhouette); see docs/ASSETS.md.

const S = 1 / 3; // px per mm
const X0 = 30; // left margin in px
const G = 520; // ground line in px
export const CAR_VIEWBOX = { w: Math.round(X0 * 2 + 4694 * S), h: 580 };
export const WHEELS = [840, 3715]; // wheel centres (mm from the front)
const TIRE_R = 340;
const RIM_R = 248;

const px = (x) => +(X0 + x * S).toFixed(1);
const py = (h) => +(G - h * S).toFixed(1);
const P = ([x, h]) => `${px(x)} ${py(h)}`;

// Catmull-Rom through points -> cubic Béziers (open curve, excluding the move).
function smooth(points, t = 0.5) {
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + ((p2[0] - p0[0]) * t) / 3, p1[1] + ((p2[1] - p0[1]) * t) / 3];
    const c2 = [p2[0] - ((p3[0] - p1[0]) * t) / 3, p2[1] - ((p3[1] - p1[1]) * t) / 3];
    d += ` C ${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d;
}

const ARCH_R = 400;
const ARCH_H = 250; // arch opening ends below the hub, as on the real car
const ARCH_DX = Math.sqrt(ARCH_R ** 2 - (340 - ARCH_H) ** 2);

// Upper contour: from the front arch, round the nose, over the roof, down the tail.
const upper = [
  [450, ARCH_H], [330, 200], [190, 190], [96, 236], [36, 340], [16, 440], [26, 520], [80, 600],
  [210, 672], [460, 742], [820, 808], [1330, 930], [1760, 1195], [2160, 1396],
  [2560, 1443], [3000, 1430], [3420, 1354], [3860, 1196], [4250, 1066], [4520, 1042],
  [4642, 1046], [4690, 994], [4694, 900], [4676, 760], [4632, 610], [4556, 480],
  [4440, 402], [4290, 300], [4105, ARCH_H],
];

function bodyPath() {
  const [fx, rx] = WHEELS;
  let d = `M ${P(upper[0])}` + smooth(upper, 0.55);
  // rear arch, over the top, right to left
  d += ` A ${ARCH_R * S} ${ARCH_R * S} 0 1 0 ${P([rx - ARCH_DX, ARCH_H])}`;
  d += ` C ${P([rx - ARCH_DX - 10, 215])} ${P([rx - ARCH_DX - 30, 196])} ${P([rx - ARCH_DX - 90, 194])}`;
  d += ` L ${P([fx + ARCH_DX + 80, 190])}`;
  d += ` C ${P([fx + ARCH_DX + 25, 192])} ${P([fx + ARCH_DX + 8, 212])} ${P([fx + ARCH_DX, ARCH_H])}`;
  d += ` A ${ARCH_R * S} ${ARCH_R * S} 0 1 0 ${P([fx - ARCH_DX, ARCH_H])} Z`;
  return d;
}

const roofLine = upper.slice(10, 20); // windscreen to decklid, used for rim light
const glass = [
  [1500, 1006], [1820, 1180], [2170, 1346], [2600, 1392], [3100, 1370], [3480, 1292],
  [3800, 1172], [3992, 1086],
];

function glassPath() {
  let d = `M ${P(glass[0])}` + smooth(glass, 0.6);
  d += ` C ${P([3600, 1072])} ${P([2400, 1040])} ${P([1500, 1006])} Z`;
  return d;
}

function wheel(cx, id, env) {
  const x = px(cx);
  const y = py(TIRE_R);
  const R = TIRE_R * S;
  const r = RIM_R * S;
  const spokes = [];
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 * Math.PI) / 180;
    const a1 = a - 0.2, a3 = a + 0.42;
    const pt = (ang, rad) => `${(Math.cos(ang) * rad).toFixed(1)} ${(Math.sin(ang) * rad).toFixed(1)}`;
    // a turbine-like blade: wide at the rim, narrow at the hub, swept
    spokes.push(
      `<path d="M ${pt(a - 0.08, r * 0.24)} L ${pt(a1, r * 0.93)} Q ${pt(a + 0.12, r * 0.99)} ${pt(a3, r * 0.93)} L ${pt(a + 0.16, r * 0.24)} Z" fill="url(#spoke-${id})"/>`
    );
  }
  return `
  <g class="wheel" style="transform-origin:${x}px ${y}px">
    <circle cx="${x}" cy="${y}" r="${R}" fill="url(#tire-${id})"/>
    <circle cx="${x}" cy="${y}" r="${(R * 0.93).toFixed(1)}" fill="none" stroke="${env.sidewall}" stroke-width="1.2" opacity=".55"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#rim-${id})"/>
    <g transform="translate(${x} ${y})">${spokes.join('')}
      <circle r="${(r * 0.97).toFixed(1)}" fill="none" stroke="${env.rimEdge}" stroke-width="1.6" opacity=".7"/>
      <circle r="${(r * 0.2).toFixed(1)}" fill="${env.hub}"/>
      <circle r="${(r * 0.08).toFixed(1)}" fill="${env.hubDot}"/>
    </g>
  </g>`;
}

export const ENVS = {
  // dusk on the Croisette: glow behind and to the right, dark road below
  dusk: {
    bodyTop: '#1a262b', bodyMid: '#0c1316', bodyLow: '#0a1013', bodyRoad: '#18252a',
    shoulder: '#8fa3a6', shoulderOpacity: 0.55, rim: '#a8b8b8', rimOpacity: 0.55,
    glassTop: '#6d7f82', glassMid: '#1b282d', glassLow: '#0b1215', glassStreak: '#c6d2d0',
    line: '#04080a', lineLight: '#2a383d', well: '#030607',
    tireIn: '#121719', tireOut: '#07090a', sidewall: '#2b3337',
    rimA: '#3b464a', rimB: '#161d20', spokeA: '#56656a', spokeB: '#1d2629', rimEdge: '#6f7f83',
    hub: '#0d1214', hubDot: '#2f3a3e', head: '#eef6f4', headGlow: 0.85, tail: '#b8473f',
    shadow: '#020405', shadowOpacity: 0.9, mirror: '#121b1f', skyReflect: 0.16,
  },
  // daylight studio for the light section: bright surroundings reflected
  studio: {
    bodyTop: '#2a3438', bodyMid: '#11181b', bodyLow: '#141c1f', bodyRoad: '#57666a',
    shoulder: '#e3eae8', shoulderOpacity: 0.7, rim: '#ffffff', rimOpacity: 0.5,
    glassTop: '#c5d1d0', glassMid: '#3b4a4f', glassLow: '#121a1d', glassStreak: '#ffffff',
    line: '#05090b', lineLight: '#4b5a5f', well: '#05080a',
    tireIn: '#1a1f21', tireOut: '#0a0c0d', sidewall: '#3a4246',
    rimA: '#5b676b', rimB: '#1f272a', spokeA: '#8a989c', spokeB: '#2a3438', rimEdge: '#a3b0b3',
    hub: '#141a1d', hubDot: '#47545a', head: '#f7fbfa', headGlow: 0.25, tail: '#a23d36',
    shadow: '#1c2a2e', shadowOpacity: 0.55, mirror: '#1b2428', skyReflect: 0.22,
  },
};

export function carSvg(envName = 'dusk', { id = envName, lights = envName === 'dusk' } = {}) {
  const e = ENVS[envName];
  const [fx, rx] = WHEELS;
  const shoulder = [[420, 742], [900, 812], [1500, 925], [2200, 985], [3000, 1010], [3700, 1008], [4300, 992], [4560, 975]];
  const lowBand = [[520, 420], [1300, 330], [3300, 340], [4380, 440]];
  // reflected horizon: glossy black paint shows the sky above a sharp line, the ground below
  const horizon = `M ${P([300, 700])} C ${P([1200, 760])} ${P([2600, 790])} ${P([4690, 760])} L ${P([4690, 1000])} L ${P([300, 1000])} Z`;
  const head = `M ${P([96, 606])} C ${P([220, 664])} ${P([400, 712])} ${P([590, 744])} L ${P([586, 722])} C ${P([410, 698])} ${P([240, 650])} ${P([118, 590])} Z`;
  const tail = `M ${P([4440, 958])} C ${P([4560, 966])} ${P([4650, 972])} ${P([4690, 978])} L ${P([4692, 930])} C ${P([4620, 926])} ${P([4540, 920])} ${P([4450, 916])} Z`;
  const mirror = `M ${P([1480, 1026])} C ${P([1515, 1092])} ${P([1595, 1124])} ${P([1705, 1118])} C ${P([1745, 1114])} ${P([1752, 1068])} ${P([1725, 1042])} C ${P([1655, 1026])} ${P([1555, 1018])} ${P([1480, 1026])} Z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CAR_VIEWBOX.w} ${CAR_VIEWBOX.h}" class="car-art" role="img" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="body-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${e.bodyTop}"/><stop offset=".42" stop-color="${e.bodyMid}"/>
      <stop offset=".78" stop-color="${e.bodyLow}"/><stop offset="1" stop-color="${e.bodyRoad}"/>
    </linearGradient>
    <linearGradient id="glass-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${e.glassTop}"/><stop offset=".45" stop-color="${e.glassMid}"/><stop offset="1" stop-color="${e.glassLow}"/>
    </linearGradient>
    <linearGradient id="shoulder-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${e.shoulder}" stop-opacity="0"/><stop offset=".25" stop-color="${e.shoulder}" stop-opacity="${e.shoulderOpacity}"/>
      <stop offset=".7" stop-color="${e.shoulder}" stop-opacity="${e.shoulderOpacity * 0.8}"/><stop offset="1" stop-color="${e.shoulder}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rimlight-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${e.rim}" stop-opacity="0"/><stop offset=".45" stop-color="${e.rim}" stop-opacity="${e.rimOpacity}"/><stop offset="1" stop-color="${e.rim}" stop-opacity="${e.rimOpacity * 0.6}"/>
    </linearGradient>
    <linearGradient id="sky-${id}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${e.shoulder}" stop-opacity="${e.skyReflect}"/><stop offset=".35" stop-color="${e.shoulder}" stop-opacity="${e.skyReflect * 0.35}"/><stop offset="1" stop-color="${e.shoulder}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="tire-${id}"><stop offset=".7" stop-color="${e.tireIn}"/><stop offset="1" stop-color="${e.tireOut}"/></radialGradient>
    <radialGradient id="rim-${id}" cx=".35" cy=".3"><stop offset="0" stop-color="${e.rimA}"/><stop offset="1" stop-color="${e.rimB}"/></radialGradient>
    <linearGradient id="spoke-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${e.spokeA}"/><stop offset="1" stop-color="${e.spokeB}"/></linearGradient>
    <radialGradient id="shadow-${id}"><stop offset="0" stop-color="${e.shadow}" stop-opacity="${e.shadowOpacity}"/><stop offset=".6" stop-color="${e.shadow}" stop-opacity="${e.shadowOpacity * 0.45}"/><stop offset="1" stop-color="${e.shadow}" stop-opacity="0"/></radialGradient>
    <filter id="soft-${id}" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="glow-${id}" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>
    <clipPath id="clip-body-${id}"><path d="${bodyPath()}"/></clipPath>
    <clipPath id="clip-well-${id}"><rect x="0" y="0" width="${CAR_VIEWBOX.w}" height="${py(200)}"/></clipPath>
  </defs>
  <ellipse cx="${px(2350)}" cy="${G + 4}" rx="${(2700 * S).toFixed(1)}" ry="20" fill="url(#shadow-${id})"/>
  <ellipse cx="${px(fx)}" cy="${G + 1}" rx="${(330 * S).toFixed(1)}" ry="6" fill="${e.shadow}" opacity=".9"/>
  <ellipse cx="${px(rx)}" cy="${G + 1}" rx="${(330 * S).toFixed(1)}" ry="6" fill="${e.shadow}" opacity=".9"/>
  ${lights ? `<ellipse cx="${px(-420)}" cy="${G - 4}" rx="150" ry="11" fill="${e.head}" opacity=".16" filter="url(#glow-${id})"/>` : ''}
  <g clip-path="url(#clip-well-${id})">
    <circle cx="${px(fx)}" cy="${py(340)}" r="${(ARCH_R * S - 1).toFixed(1)}" fill="${e.well}"/>
    <circle cx="${px(rx)}" cy="${py(340)}" r="${(ARCH_R * S - 1).toFixed(1)}" fill="${e.well}"/>
  </g>
  ${wheel(fx, id, e)}
  ${wheel(rx, id, e)}
  <path d="${bodyPath()}" fill="url(#body-${id})"/>
  <g clip-path="url(#clip-body-${id})">
    <path d="${horizon}" fill="url(#sky-${id})"/>
    <path d="M ${P(lowBand[0])}${smooth(lowBand)}" fill="none" stroke="${e.bodyRoad}" stroke-width="16" opacity=".55" filter="url(#soft-${id})"/>
    <path d="M ${P(shoulder[0])}${smooth(shoulder)}" fill="none" stroke="url(#shoulder-${id})" stroke-width="7" filter="url(#soft-${id})"/>
    <path d="M ${P(shoulder[0])}${smooth(shoulder)}" fill="none" stroke="url(#shoulder-${id})" stroke-width="1.4" opacity=".9"/>
    <path d="M ${P([60, 560])} C ${P([150, 650])} ${P([600, 760])} ${P([1330, 935])}" fill="none" stroke="${e.shoulder}" stroke-width="5" opacity="${e.shoulderOpacity * 0.6}" filter="url(#soft-${id})"/>
    <path d="M ${P([40, 300])} C ${P([20, 380])} ${P([24, 470])} ${P([70, 560])}" fill="none" stroke="${e.shoulder}" stroke-width="6" opacity="${e.shoulderOpacity * 0.35}" filter="url(#soft-${id})"/>
    <path d="M ${P([4684, 960])} C ${P([4690, 820])} ${P([4660, 660])} ${P([4600, 540])}" fill="none" stroke="${e.shoulder}" stroke-width="6" opacity="${e.shoulderOpacity * 0.4}" filter="url(#soft-${id})"/>
    <path d="M ${P([4250, 470])} C ${P([4420, 480])} ${P([4560, 500])} ${P([4640, 560])}" fill="none" stroke="${e.lineLight}" stroke-width="1.2" opacity=".7"/>
    <path d="${glassPath()}" fill="url(#glass-${id})"/>
    <path d="M ${P([2050, 1300])} L ${P([2380, 1370])} L ${P([2150, 1040])} L ${P([1880, 1030])} Z" fill="${e.glassStreak}" opacity=".08"/>
    <path d="M ${P([2900, 1375])} L ${P([3060, 1372])} L ${P([2850, 1052])} L ${P([2700, 1048])} Z" fill="${e.glassStreak}" opacity=".06"/>
    <path d="M ${P([2735, 1388])} L ${P([2770, 1388])} L ${P([2760, 1046])} L ${P([2725, 1046])} Z" fill="${e.line}" opacity=".85"/>
    <path d="M ${P([1470, 990])} C ${P([1462, 800])} ${P([1440, 520])} ${P([1410, 200])}" fill="none" stroke="${e.line}" stroke-width="1.6"/>
    <path d="M ${P([1475, 990])} C ${P([1467, 800])} ${P([1445, 520])} ${P([1415, 200])}" fill="none" stroke="${e.lineLight}" stroke-width=".8" opacity=".6"/>
    <path d="M ${P([2752, 1046])} L ${P([2770, 200])}" fill="none" stroke="${e.line}" stroke-width="1.6"/>
    <path d="M ${P([3600, 1094])} C ${P([3590, 930])} ${P([3560, 830])} ${P([3450, 735])}" fill="none" stroke="${e.line}" stroke-width="1.6"/>
    <path d="M ${P([2060, 928])} L ${P([2290, 934])}" stroke="${e.line}" stroke-width="3" stroke-linecap="round"/>
    <path d="M ${P([2062, 940])} L ${P([2288, 946])}" stroke="${e.lineLight}" stroke-width="1" stroke-linecap="round" opacity=".7"/>
    <path d="M ${P([3090, 950])} L ${P([3300, 954])}" stroke="${e.line}" stroke-width="3" stroke-linecap="round"/>
    <path d="M ${P([3092, 962])} L ${P([3298, 966])}" stroke="${e.lineLight}" stroke-width="1" stroke-linecap="round" opacity=".7"/>
    <path d="M ${P([1270, 205])} L ${P([3280, 212])}" stroke="${e.lineLight}" stroke-width="1" opacity=".5"/>
  </g>
  <path d="M ${P(roofLine[0])}${smooth(roofLine, 0.55)}" fill="none" stroke="url(#rimlight-${id})" stroke-width="1.6"/>
  <path d="M ${P([fx + ARCH_DX, ARCH_H])} A ${ARCH_R * S} ${ARCH_R * S} 0 1 0 ${P([fx - ARCH_DX, ARCH_H])}" fill="none" stroke="${e.lineLight}" stroke-width="1.2" opacity=".8"/>
  <path d="M ${P([rx + ARCH_DX, ARCH_H])} A ${ARCH_R * S} ${ARCH_R * S} 0 1 0 ${P([rx - ARCH_DX, ARCH_H])}" fill="none" stroke="${e.lineLight}" stroke-width="1.2" opacity=".8"/>
  <path d="${mirror}" fill="${e.mirror}"/>
  <path d="M ${P([1535, 1088])} C ${P([1595, 1114])} ${P([1675, 1116])} ${P([1725, 1106])}" fill="none" stroke="${e.shoulder}" stroke-width="1" opacity=".5"/>
  ${lights ? `<path d="${head}" fill="${e.head}" opacity="${e.headGlow}" filter="url(#glow-${id})"/>` : ''}
  <path d="${head}" fill="${e.head}" opacity=".95" clip-path="url(#clip-body-${id})"/>
  ${lights ? `<path d="${tail}" fill="${e.tail}" opacity=".7" filter="url(#glow-${id})"/>` : ''}
  <path d="${tail}" fill="${e.tail}"/>
</svg>`;
}

export const carGeometry = {
  viewBox: CAR_VIEWBOX,
  wheelCentresPx: WHEELS.map((x) => ({ x: px(x), y: py(TIRE_R) })),
  tireRadiusPx: TIRE_R * S,
  groundPx: G,
};
