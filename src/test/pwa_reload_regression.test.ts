import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReloadPrompt from '../components/ReloadPrompt';
import { installSWUpdateListener } from '../utils/swUpdateListener';

const mockSetOfflineReady = vi.fn();
const mockSetNeedRefresh = vi.fn();
const mockWaitingSW = {
	postMessage: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
};
const mockRegistration = {
	waiting: mockWaitingSW,
	update: vi.fn().mockResolvedValue(undefined),
};

let mockNeedRefresh = false;

vi.mock('virtual:pwa-register/react', () => ({
	useRegisterSW: (options: { onRegistered?: (r: unknown) => void }) => {
		if (options?.onRegistered) options.onRegistered(mockRegistration);
		return {
			offlineReady: [false, mockSetOfflineReady],
			needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
			updateServiceWorker: vi.fn(),
		};
	},
}));

const createServiceWorkerMock = (controller: unknown) => {
	const target = new EventTarget() as EventTarget & {
		controller: unknown;
		register: ReturnType<typeof vi.fn>;
		getRegistration: ReturnType<typeof vi.fn>;
	};
	target.controller = controller;
	target.register = vi.fn();
	target.getRegistration = vi.fn().mockResolvedValue(undefined);
	return target;
};

const stubServiceWorker = (sw: unknown) => {
	Object.defineProperty(navigator, 'serviceWorker', {
		value: sw,
		configurable: true,
		writable: true,
	});
};

describe('Regression: SW update reload contract', () => {
	const originalServiceWorkerDescriptor = Object.getOwnPropertyDescriptor(
		Object.getPrototypeOf(navigator),
		'serviceWorker',
	);

	beforeEach(() => {
		vi.clearAllMocks();
		mockNeedRefresh = false;
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({}) }));
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

	describe('handleUpdate', () => {
		it('sends SKIP_WAITING and does NOT reload synchronously when clicking Update', () => {
			mockNeedRefresh = true;

			render(React.createElement(ReloadPrompt));
			const updateBtn = screen.getByRole('button', { name: /update|actualizar/i });
			fireEvent.click(updateBtn);

			expect(mockWaitingSW.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
			expect(window.location.reload).not.toHaveBeenCalled();
		});

		it('does NOT register a statechange listener on the waiting SW (reload is owned by controllerchange)', () => {
			mockNeedRefresh = true;

			render(React.createElement(ReloadPrompt));
			const updateBtn = screen.getByRole('button', { name: /update|actualizar/i });
			fireEvent.click(updateBtn);

			expect(mockWaitingSW.addEventListener).not.toHaveBeenCalled();
		});
	});

	describe('installSWUpdateListener', () => {
		it('reloads exactly once when controllerchange fires after the page already had a SW controller', () => {
			const sw = createServiceWorkerMock({ scriptURL: 'old' });
			stubServiceWorker(sw);

			installSWUpdateListener();

			sw.dispatchEvent(new Event('controllerchange'));
			sw.dispatchEvent(new Event('controllerchange'));

			expect(window.location.reload).toHaveBeenCalledTimes(1);
		});

		it('does NOT reload on first install (no previous controller)', () => {
			const sw = createServiceWorkerMock(null);
			stubServiceWorker(sw);

			installSWUpdateListener();

			sw.dispatchEvent(new Event('controllerchange'));

			expect(window.location.reload).not.toHaveBeenCalled();
		});

		it('is a no-op when serviceWorker is not available', () => {
			stubServiceWorker(undefined);

			expect(() => installSWUpdateListener()).not.toThrow();
			expect(window.location.reload).not.toHaveBeenCalled();
		});
	});
});
