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

let mockOfflineReady = false;
let mockNeedRefresh = false;

vi.mock('virtual:pwa-register/react', () => ({
	useRegisterSW: (options: {
		onRegistered?: (r: unknown) => void;
		onRegisterError?: (error: unknown) => void;
	}) => {
		if (options?.onRegistered) options.onRegistered(mockRegistration);
		return {
			offlineReady: [mockOfflineReady, mockSetOfflineReady],
			needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
			updateServiceWorker: vi.fn(),
		};
	},
}));

describe('ReloadPrompt', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOfflineReady = false;
		mockNeedRefresh = false;
		mockRegistration.waiting = mockWaitingSW;
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({}) }));
		vi.mocked(window.location.reload).mockClear();
	});

	it('does not render when no PWA events are active', () => {
		const { container } = render(React.createElement(ReloadPrompt));
		expect(container.firstChild).toBeNull();
	});

	it('renders the offline ready message', () => {
		mockOfflineReady = true;
		render(React.createElement(ReloadPrompt));

		expect(screen.getByText(/App lista offline/i)).toBeDefined();
		expect(screen.getByText(/sin conexión/i)).toBeDefined();
	});

	it('renders the new version message with an update button', () => {
		mockNeedRefresh = true;
		render(React.createElement(ReloadPrompt));

		expect(screen.getByText(/Nueva versión disponible/i)).toBeDefined();
		expect(screen.getByRole('button', { name: /actualizar/i })).toBeDefined();
	});

	it('sends SKIP_WAITING to the waiting service worker when the update button is clicked', () => {
		mockNeedRefresh = true;
		render(React.createElement(ReloadPrompt));

		const updateBtn = screen.getByRole('button', { name: /actualizar/i });
		fireEvent.click(updateBtn);

		expect(mockWaitingSW.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
		expect(window.location.reload).not.toHaveBeenCalled();
	});

	it('calls the close setters when the close button is clicked', () => {
		mockOfflineReady = true;
		render(React.createElement(ReloadPrompt));

		const closeBtn = screen.getByRole('button', { name: /cerrar/i });
		fireEvent.click(closeBtn);

		expect(mockSetOfflineReady).toHaveBeenCalledWith(false);
		expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
	});

	it('displays the version transition when the version.json fetch succeeds', async () => {
		mockNeedRefresh = true;
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: () => Promise.resolve({ version: '9.9.9' }),
			}),
		);
		render(React.createElement(ReloadPrompt));
		await screen.findByText(/→ 9\.9\.9/);
		expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
			`${import.meta.env.BASE_URL}version.json`,
		);
	});

	it('displays the fallback message when the version.json fetch fails', async () => {
		mockNeedRefresh = true;
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
		render(React.createElement(ReloadPrompt));
		await screen.findByText(/Hay una actualización disponible/i);
	});

	it('does not fetch version.json when only offlineReady is true', () => {
		mockOfflineReady = true;
		const mockFetch = vi.fn();
		vi.stubGlobal('fetch', mockFetch);
		render(React.createElement(ReloadPrompt));
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('calls serviceWorker.getRegistration().update() when the document becomes visible', async () => {
		vi.stubGlobal('navigator', {
			...navigator,
			serviceWorker: {
				getRegistration: vi.fn().mockResolvedValue({ update: mockRegistration.update }),
			},
		});
		render(React.createElement(ReloadPrompt));
		Object.defineProperty(document, 'hidden', { value: false, writable: true });
		document.dispatchEvent(new Event('visibilitychange'));
		await vi.waitFor(() => expect(mockRegistration.update).toHaveBeenCalled());
	});

	describe('handleUpdate', () => {
		it('does not register a statechange listener on the waiting SW (reload is owned by controllerchange)', () => {
			mockNeedRefresh = true;

			render(React.createElement(ReloadPrompt));
			const updateBtn = screen.getByRole('button', { name: /actualizar/i });
			fireEvent.click(updateBtn);

			expect(mockWaitingSW.addEventListener).not.toHaveBeenCalled();
		});

		it('schedules a fallback reload after RELOAD_FALLBACK_MS for user agents where controllerchange never fires (e.g. iOS standalone)', () => {
			vi.useFakeTimers();
			try {
				mockNeedRefresh = true;

				render(React.createElement(ReloadPrompt));
				const updateBtn = screen.getByRole('button', { name: /actualizar/i });
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
			const updateBtn = screen.getByRole('button', { name: /actualizar/i });
			fireEvent.click(updateBtn);

			expect(mockWaitingSW.postMessage).not.toHaveBeenCalled();
			expect(window.location.reload).toHaveBeenCalledTimes(1);
		});
	});
});
