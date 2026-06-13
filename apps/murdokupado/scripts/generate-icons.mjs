/**
 * Rasterises the Murdokupado app mark (public/icon.svg + icon-maskable.svg) into
 * the PWA PNG set and a favicon. Run inside the pinned Playwright container, which
 * ships Chromium (a pixel-accurate SVG renderer), e.g.:
 *
 *   make-style podman run ... mcr.microsoft.com/playwright:<ver> \
 *     node apps/murdokupado/scripts/generate-icons.mjs
 *
 * Edit the SVGs, re-run this, and commit the regenerated assets.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../public');

async function renderPng(browser, svgFile, size) {
	const svg = readFileSync(resolve(pub, svgFile), 'utf8');
	const page = await browser.newPage({
		viewport: { width: size, height: size },
		deviceScaleFactor: 1,
	});
	const html = `<!doctype html><html><head><style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`;
	await page.setContent(html, { waitUntil: 'networkidle' });
	const buffer = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
	await page.close();
	return buffer;
}

// Minimal ICO wrapping a single PNG-compressed image (supported by all modern browsers).
function pngToIco(png) {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(1, 4);
	const entry = Buffer.alloc(16);
	entry.writeUInt8(64, 0);
	entry.writeUInt8(64, 1);
	entry.writeUInt16LE(1, 4);
	entry.writeUInt16LE(32, 6);
	entry.writeUInt32LE(png.length, 8);
	entry.writeUInt32LE(22, 12);
	return Buffer.concat([header, entry, png]);
}

const browser = await chromium.launch();
try {
	const targets = [
		['icon.svg', 192, 'pwa-192x192.png'],
		['icon.svg', 512, 'pwa-512x512.png'],
		['icon-maskable.svg', 512, 'pwa-maskable-512x512.png'],
		['icon.svg', 180, 'apple-touch-icon.png'],
	];
	for (const [svg, size, out] of targets) {
		writeFileSync(resolve(pub, out), await renderPng(browser, svg, size));
		console.log('wrote', out, `${size}x${size}`);
	}
	writeFileSync(resolve(pub, 'favicon.ico'), pngToIco(await renderPng(browser, 'icon.svg', 64)));
	console.log('wrote favicon.ico 64x64');
} finally {
	await browser.close();
}
