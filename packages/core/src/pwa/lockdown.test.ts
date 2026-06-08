import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Regression: shared PWA gesture lockdown CSS', () => {
	const css = readFileSync(join(__dirname, 'lockdown.css'), 'utf-8');

	it('disables iOS callout and global text selection', () => {
		expect(css).toMatch(/-webkit-touch-callout:\s*none/);
		expect(css).toMatch(/user-select:\s*none/);
		expect(css).toMatch(/-webkit-user-select:\s*none/);
	});

	it('disables overscroll and double-tap zoom', () => {
		expect(css).toMatch(/overscroll-behavior:\s*none/);
		expect(css).toMatch(/touch-action:\s*manipulation/);
	});
});
