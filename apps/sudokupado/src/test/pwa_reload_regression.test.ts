import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReloadPrompt, { RELOAD_FALLBACK_MS } from '../components/ReloadPrompt';

const mockSetOfflineReady = vi.fn();
const mockSetNeedRefresh = vi.fn();
const mockWaitingSW = {
	postMessage: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
};
const mockRegistration: {
	waiting: typeof mockWaitingSW | null;
	update: ReturnType<typeof vi.fn>;
} = {
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

describe('Regression: SW update reload contract', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockNeedRefresh = false;
		mockRegistration.waiting = mockWaitingSW;
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({}) }));
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

		it('schedules a fallback reload after RELOAD_FALLBACK_MS for user agents where controllerchange never fires (e.g. iOS standalone)', () => {
			vi.useFakeTimers();
			try {
				mockNeedRefresh = true;

				render(React.createElement(ReloadPrompt));
				const updateBtn = screen.getByRole('button', { name: /update|actualizar/i });
				fireEvent.click(updateBtn);

				expect(window.location.reload).not.toHaveBeenCalled();

				vi.advanceTimersByTime(RELOAD_FALLBACK_MS - 1);
				expect(window.location.reload).not.toHaveBeenCalled();

				vi.advanceTimersByTime(1);
				expect(window.location.reload).toHaveBeenCalledTimes(1);
			} finally {
				vi.useRealTimers();
			}
		});

		it('reloads immediately when there is no waiting SW (nothing to skip)', () => {
			mockRegistration.waiting = null;
			mockNeedRefresh = true;

			render(React.createElement(ReloadPrompt));
			const updateBtn = screen.getByRole('button', { name: /update|actualizar/i });
			fireEvent.click(updateBtn);

			expect(mockWaitingSW.postMessage).not.toHaveBeenCalled();
			expect(window.location.reload).toHaveBeenCalledTimes(1);
		});
	});
});
