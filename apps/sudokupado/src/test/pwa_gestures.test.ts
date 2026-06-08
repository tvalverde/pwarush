import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = join(__dirname, '..', '..');

describe('Regression: PWA Gesture Lockdown', () => {
	it('viewport meta disables pinch zoom (user-scalable=no, maximum-scale=1)', () => {
		const html = readFileSync(join(PROJECT_ROOT, 'index.html'), 'utf-8');
		const viewportTag = html.match(/<meta\s+name="viewport"[^>]*>/i)?.[0] ?? '';

		expect(viewportTag).toContain('user-scalable=no');
		expect(viewportTag).toContain('maximum-scale=1');
		expect(viewportTag).toContain('minimum-scale=1');
	});
});
