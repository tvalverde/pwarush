import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FullscreenModule = typeof import('./fullscreen');

const loadFreshModule = async (): Promise<FullscreenModule> => {
	vi.resetModules();
	return import('./fullscreen');
};

describe('fullscreen utils: last-intent-wins serialization', () => {
	let requestFullscreenMock: ReturnType<typeof vi.fn>;
	let exitFullscreenMock: ReturnType<typeof vi.fn>;
	let fullscreenElement: Element | null;
	const originalUserAgent = navigator.userAgent;

	beforeEach(() => {
		fullscreenElement = null;
		requestFullscreenMock = vi.fn().mockImplementation(() => {
			fullscreenElement = document.documentElement;
			return Promise.resolve();
		});
		exitFullscreenMock = vi.fn().mockImplementation(() => {
			fullscreenElement = null;
			return Promise.resolve();
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			value: requestFullscreenMock,
			configurable: true,
			writable: true,
		});
		Object.defineProperty(document, 'exitFullscreen', {
			value: exitFullscreenMock,
			configurable: true,
			writable: true,
		});
		Object.defineProperty(document, 'fullscreenElement', {
			get: () => fullscreenElement,
			configurable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'userAgent', {
			value: originalUserAgent,
			configurable: true,
		});
	});

	it('skips a stale exit when an enter is requested afterwards (StrictMode remount burst)', async () => {
		const { exitAppFullscreen, requestAppFullscreen } = await loadFreshModule();

		requestAppFullscreen();
		exitAppFullscreen();
		await requestAppFullscreen();

		expect(exitFullscreenMock).not.toHaveBeenCalled();
		expect(requestFullscreenMock).toHaveBeenCalledTimes(1);
		expect(document.fullscreenElement).not.toBeNull();
	});

	it('executes a trailing exit and leaves fullscreen', async () => {
		const { exitAppFullscreen, requestAppFullscreen } = await loadFreshModule();

		await requestAppFullscreen();
		await exitAppFullscreen();

		expect(requestFullscreenMock).toHaveBeenCalledTimes(1);
		expect(exitFullscreenMock).toHaveBeenCalledTimes(1);
		expect(document.fullscreenElement).toBeNull();
	});

	it('does not re-request fullscreen when it is already active', async () => {
		const { requestAppFullscreen } = await loadFreshModule();

		requestAppFullscreen();
		await requestAppFullscreen();

		expect(requestFullscreenMock).toHaveBeenCalledTimes(1);
	});

	it('never requests fullscreen on iOS', async () => {
		Object.defineProperty(navigator, 'userAgent', {
			value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
			configurable: true,
		});
		const { requestAppFullscreen } = await loadFreshModule();

		await requestAppFullscreen();

		expect(requestFullscreenMock).not.toHaveBeenCalled();
	});
});
