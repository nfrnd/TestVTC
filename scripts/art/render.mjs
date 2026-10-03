// Render an SVG/HTML snippet to PNG with headless Chromium, for inspection and raster exports.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const CHROME = process.env.SCROLLCRAFT_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export async function renderHtml(html, out, { width = 1600, height = 900, omitBackground = false, scale = 1 } = {}) {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: out, omitBackground });
  await browser.close();
}
if (process.argv[2]) {
  const [file, out, w, h, bg] = process.argv.slice(2);
  const svg = readFileSync(file, 'utf8');
  await renderHtml(`<body style="margin:0;background:${bg || '#1c292f'}"><div style="width:${w}px;height:${h}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`, out, { width: +w, height: +h });
}
