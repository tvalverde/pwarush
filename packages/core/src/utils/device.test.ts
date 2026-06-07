import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isIOS, isStandalone } from './device';

describe('isIOS', () => {
	const originalUserAgent = navigator.userAgent;
	const originalMaxTouchPoints = navigator.maxTouchPoints;

	afterEach(() => {
		Object.defineProperty(navigator, 'userAgent', {
			value: originalUserAgent,
			configurable: true,
		});
		Object.defineProperty(navigator, 'maxTouchPoints', {
			value: originalMaxTouchPoints,
			configurable: true,
		});
	});

	it('returns true for iPhone user agent', () => {
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
			configurable: true,
		});
		expect(isIOS()).toBe(true);
	});

	it('returns true for iPad user agent', () => {
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
			configurable: true,
		});
		expect(isIOS()).toBe(true);
	});

	it('returns true for iPadOS 13+ (Mac UA with touch support)', () => {
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
			configurable: true,
		});
		Object.defineProperty(navigator, 'maxTouchPoints', {
			value: 5,
			configurable: true,
		});
		expect(isIOS()).toBe(true);
	});

	it('returns false for Mac desktop (Mac UA with no touch support)', () => {
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
			configurable: true,
		});
		Object.defineProperty(navigator, 'maxTouchPoints', {
			value: 0,
			configurable: true,
		});
		expect(isIOS()).toBe(false);
	});

	it('returns false for Android user agent', () => {
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
			configurable: true,
		});
		expect(isIOS()).toBe(false);
	});

	it('returns false for desktop Chrome user agent', () => {
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
			configurable: true,
		});
		expect(isIOS()).toBe(false);
	});
});

describe('isStandalone', () => {
	const defineMatchMedia = (matches: boolean) => {
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			configurable: true,
			value: (query: string) => ({
				matches: matches && query === '(display-mode: standalone)',
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			}),
		});
	};

	beforeEach(() => {
		defineMatchMedia(false);
		Object.defineProperty(navigator, 'standalone', { value: undefined, configurable: true });
	});

	it('returns false when not in standalone mode', () => {
		expect(isStandalone()).toBe(false);
	});

	it('returns true when display-mode is standalone', () => {
		defineMatchMedia(true);
		expect(isStandalone()).toBe(true);
	});

	it('returns true when navigator.standalone is true (iOS)', () => {
		Object.defineProperty(navigator, 'standalone', { value: true, configurable: true });
		expect(isStandalone()).toBe(true);
	});
});
