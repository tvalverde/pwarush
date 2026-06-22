import { describe, expect, it } from 'vitest';
import { activeElapsedMs } from '../utils/time';

describe('activeElapsedMs', () => {
	it('is zero when no match has started', () => {
		expect(activeElapsedMs(null, 0, null, 1000)).toBe(0);
	});

	it('counts wall time minus banked pauses', () => {
		expect(activeElapsedMs(0, 2000, null, 10000)).toBe(8000);
	});

	it('freezes while a pause is in progress', () => {
		expect(activeElapsedMs(0, 0, 6000, 6000)).toBe(6000);
		expect(activeElapsedMs(0, 0, 6000, 9000)).toBe(6000); // identical as `now` advances
	});

	it('never goes negative', () => {
		expect(activeElapsedMs(0, 99999, null, 1000)).toBe(0);
	});
});
