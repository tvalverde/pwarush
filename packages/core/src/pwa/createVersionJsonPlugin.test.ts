import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createVersionJsonPlugin } from './createVersionJsonPlugin';

describe('createVersionJsonPlugin', () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), 'pwarush-version-'));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	it('exposes the generate-version-json plugin', () => {
		expect(createVersionJsonPlugin().name).toBe('generate-version-json');
	});

	it('writes version.json into the resolved build outDir on closeBundle', () => {
		const plugin = createVersionJsonPlugin();

		const configResolved = plugin.configResolved as (config: unknown) => void;
		configResolved({ root, build: { outDir: '.' } });

		const closeBundle = plugin.closeBundle as () => void;
		closeBundle.call({});

		const written = JSON.parse(readFileSync(join(root, 'version.json'), 'utf-8'));
		expect(written).toHaveProperty('version');
	});
});
