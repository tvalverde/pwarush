// One-off raster icon generator for Neon Quiz. Renders the source SVGs in public/ into the
// PNG/ICO assets referenced by the manifest and index.html. Run from the app root:
//   node scripts/generate-icons.mjs
// Requires @resvg/resvg-js and png-to-ico (installed transiently for the build).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '../public');

const render = (svgFile, size) => {
	const svg = readFileSync(resolve(pub, svgFile), 'utf8');
	const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
	return resvg.render().asPng();
};

const writePng = (svgFile, size, out) => {
	writeFileSync(resolve(pub, out), render(svgFile, size));
	console.log(`✓ ${out} (${size}px from ${svgFile})`);
};

writePng('icon.svg', 192, 'pwa-192x192.png');
writePng('icon.svg', 512, 'pwa-512x512.png');
writePng('icon.svg', 180, 'apple-touch-icon.png');
writePng('icon-maskable.svg', 512, 'pwa-maskable-512x512.png');

const ico = await pngToIco([render('icon.svg', 32), render('icon.svg', 48)]);
writeFileSync(resolve(pub, 'favicon.ico'), ico);
console.log('✓ favicon.ico (32+48 from icon.svg)');
