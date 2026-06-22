import { afterEach, describe, expect, it, vi } from 'vitest';
import { HAPTIC_PATTERNS, tap, vibrate } from '../utils/haptics';

const stubVibrate = (impl: () => boolean = () => true) => {
	const fn = vi.fn(impl);
	Object.defineProperty(navigator, 'vibrate', { value: fn, configurable: true });
	return fn;
};

const clearVibrate = () => {
	Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
};

describe('haptics vocabulary', () => {
	afterEach(() => {
		clearVibrate();
		vi.restoreAllMocks();
	});

	it('exposes a pattern for every named event, escalating to a strong victory burst', () => {
		expect(HAPTIC_PATTERNS.tap).toBe(10);
		expect(HAPTIC_PATTERNS.wrong).toBe(200);
		expect(HAPTIC_PATTERNS.victory).toEqual([60, 40, 60, 40, 120]);
		expect(HAPTIC_PATTERNS.sparkCollected).toEqual([40, 30, 60]);
	});

	it('forwards the named pattern to the Vibration API', () => {
		const fn = stubVibrate();
		vibrate('sparkCandidate');
		expect(fn).toHaveBeenCalledWith([15, 40, 15]);
		tap();
		expect(fn).toHaveBeenLastCalledWith(10);
	});

	it('is a safe no-op when the Vibration API is unavailable', () => {
		clearVibrate();
		expect(() => {
			vibrate('victory');
			tap();
		}).not.toThrow();
	});

	it('never lets a throwing Vibration API break the game', () => {
		stubVibrate(() => {
			throw new Error('blocked');
		});
		expect(() => vibrate('wrong')).not.toThrow();
	});
});
