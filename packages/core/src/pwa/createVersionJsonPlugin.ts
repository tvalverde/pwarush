import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

export function createVersionJsonPlugin(): Plugin {
	let root = process.cwd();
	let outDir = 'dist';

	return {
		name: 'generate-version-json',
		configResolved(config) {
			root = config.root;
			outDir = config.build.outDir;
		},
		closeBundle() {
			writeFileSync(
				resolve(root, outDir, 'version.json'),
				JSON.stringify({ version: process.env.npm_package_version ?? '0.0.0' }),
			);
		},
	};
}
