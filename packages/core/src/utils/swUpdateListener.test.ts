import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installSWUpdateListener } from './swUpdateListener';

const createServiceWorkerMock = (controller: unknown) => {
	const target = new EventTarget() as EventTarget & { controller: unknown };
	target.controller = controller;
	return target;
};

const stubServiceWorker = (sw: unknown) => {
	Object.defineProperty(navigator, 'serviceWorker', {
		value: sw,
		configurable: true,
		writable: true,
	});
};

describe('installSWUpdateListener', () => {
	const reloadMock = vi.fn();
	const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(
		Object.getPrototypeOf(navigator),
		'serviceWorker',
	);

	beforeEach(() => {
		reloadMock.mockClear();
		Object.defineProperty(window, 'location', {
			value: { reload: reloadMock },
			configurable: true,
			writable: true,
		});
	});

	afterEach(() => {
		if (originalServiceWorkerDescriptor) {
			Object.defineProperty(
				Object.getPrototypeOf(navigator),
				'serviceWorker',
				originalServiceWorkerDescriptor,
			);
		}
	});

	it('reloads exactly once when controllerchange fires after the page already had a SW controller', () => {
		const sw = createServiceWorkerMock({ scriptURL: 'old' });
		stubServiceWorker(sw);

		installSWUpdateListener();

		sw.dispatchEvent(new Event('controllerchange'));
		sw.dispatchEvent(new Event('controllerchange'));

		expect(reloadMock).toHaveBeenCalledTimes(1);
	});

	it('does NOT reload on first install (no previous controller)', () => {
		const sw = createServiceWorkerMock(null);
		stubServiceWorker(sw);

		installSWUpdateListener();

		sw.dispatchEvent(new Event('controllerchange'));

		expect(reloadMock).not.toHaveBeenCalled();
	});

	it('is a no-op when serviceWorker is not available', () => {
		stubServiceWorker(undefined);

		expect(() => installSWUpdateListener()).not.toThrow();
		expect(reloadMock).not.toHaveBeenCalled();
	});
});
