import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InstallModal from '../components/InstallModal';
import ReloadPrompt from '../components/ReloadPrompt';
import { useGameStore } from '../store/gameStore';

// Mock the PWA register hook
const mockSetOfflineReady = vi.fn();
const mockSetNeedRefresh = vi.fn();
const mockRegistrationUpdate = vi.fn().mockResolvedValue(undefined);
const mockWaitingSW = {
	postMessage: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
};
const mockRegistration = {
	waiting: mockWaitingSW,
	update: mockRegistrationUpdate,
};

let mockOfflineReady = false;
let mockNeedRefresh = false;

vi.mock('virtual:pwa-register/react', () => ({
	useRegisterSW: (options: any) => {
		if (options?.onRegistered) options.onRegistered(mockRegistration as any);
		if (options?.onRegisterError) options.onRegisterError(new Error('test error'));

		return {
			offlineReady: [mockOfflineReady, mockSetOfflineReady],
			needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
			updateServiceWorker: vi.fn(),
		};
	},
}));

describe('PWA Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockOfflineReady = false;
		mockNeedRefresh = false;
		useGameStore.getState().setDeferredPrompt(null);
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: () => Promise.resolve({}) }));
		vi.mocked(window.location.reload).mockClear();
	});

	describe('ReloadPrompt Component', () => {
		it('should NOT render when no PWA events are active', () => {
			const { container } = render(React.createElement(ReloadPrompt));
			expect(container.firstChild).toBeNull();
		});

		it('should render offline ready message', () => {
			mockOfflineReady = true;
			render(React.createElement(ReloadPrompt));

			expect(screen.getByText(/App Ready Offline|App lista offline/i)).toBeDefined();
			expect(screen.getByText(/without internet|sin conexión/i)).toBeDefined();
		});

		it('should render new version message with reload button', () => {
			mockNeedRefresh = true;
			render(React.createElement(ReloadPrompt));

			expect(screen.getByText(/New Version Available|Nueva versión disponible/i)).toBeDefined();
			expect(screen.getByRole('button', { name: /update|actualizar/i })).toBeDefined();
		});

		it('should send SKIP_WAITING to waiting SW when update button is clicked', () => {
			mockNeedRefresh = true;
			render(React.createElement(ReloadPrompt));

			const updateBtn = screen.getByRole('button', { name: /update|actualizar/i });
			fireEvent.click(updateBtn);

			expect(mockWaitingSW.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
		});

		it('should call close functions when close button is clicked', () => {
			mockOfflineReady = true;
			render(React.createElement(ReloadPrompt));

			const closeBtn = screen.getByRole('button', { name: /close|cerrar/i });
			fireEvent.click(closeBtn);

			expect(mockSetOfflineReady).toHaveBeenCalledWith(false);
			expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
		});

		it('should display version transition when fetch succeeds', async () => {
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

		it('should display fallback message when fetch fails', async () => {
			mockNeedRefresh = true;
			vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
			render(React.createElement(ReloadPrompt));
			await screen.findByText(/A new update is available|Hay una actualización/i);
		});

		it('should NOT fetch version.json when only offlineReady is true', () => {
			mockOfflineReady = true;
			const mockFetch = vi.fn();
			vi.stubGlobal('fetch', mockFetch);
			render(React.createElement(ReloadPrompt));
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it('should call serviceWorker.getRegistration().update() when document becomes visible', async () => {
			vi.stubGlobal('navigator', {
				...navigator,
				serviceWorker: {
					getRegistration: vi.fn().mockResolvedValue({ update: mockRegistrationUpdate }),
				},
			});
			render(React.createElement(ReloadPrompt));
			Object.defineProperty(document, 'hidden', { value: false, writable: true });
			document.dispatchEvent(new Event('visibilitychange'));
			await vi.waitFor(() => expect(mockRegistrationUpdate).toHaveBeenCalled());
		});
	});

	describe('InstallModal & beforeinstallprompt', () => {
		it('should render when isOpen and deferredPrompt exists', () => {
			const mockPrompt = {
				prompt: vi.fn(),
				userChoice: Promise.resolve({ outcome: 'dismissed' }),
			} as unknown as BeforeInstallPromptEvent;
			useGameStore.getState().setDeferredPrompt(mockPrompt);

			render(React.createElement(InstallModal, { isOpen: true, onClose: vi.fn() }));

			expect(screen.getByText(/Install SUDOKUPADO|Instalar SUDOKUPADO/i)).toBeDefined();
		});

		it('should NOT render when deferredPrompt is missing', () => {
			useGameStore.getState().setDeferredPrompt(null);
			const { container } = render(
				React.createElement(InstallModal, { isOpen: true, onClose: vi.fn() }),
			);

			expect(container.firstChild).toBeNull();
		});

		it('should trigger prompt and clean up on install click', async () => {
			const mockPrompt = {
				prompt: vi.fn(),
				userChoice: Promise.resolve({ outcome: 'accepted' }),
			} as unknown as BeforeInstallPromptEvent;
			useGameStore.getState().setDeferredPrompt(mockPrompt);
			const onClose = vi.fn();

			render(React.createElement(InstallModal, { isOpen: true, onClose }));

			const installBtn = screen.getByRole('button', { name: /install|instalar/i });

			await act(async () => {
				fireEvent.click(installBtn);
			});

			expect(mockPrompt.prompt).toHaveBeenCalled();
			expect(useGameStore.getState().deferredPrompt).toBeNull();
			expect(onClose).toHaveBeenCalled();
		});

		it('should handle dismissal of install prompt', async () => {
			const mockPrompt = {
				prompt: vi.fn(),
				userChoice: Promise.resolve({ outcome: 'dismissed' }),
			} as unknown as BeforeInstallPromptEvent;
			useGameStore.getState().setDeferredPrompt(mockPrompt);
			const onClose = vi.fn();

			render(React.createElement(InstallModal, { isOpen: true, onClose }));

			const installBtn = screen.getByRole('button', { name: /install|instalar/i });

			await act(async () => {
				fireEvent.click(installBtn);
			});

			expect(mockPrompt.prompt).toHaveBeenCalled();
			expect(useGameStore.getState().deferredPrompt).toBeNull();
			expect(onClose).toHaveBeenCalled();
		});
	});

	describe('Global PWA events', () => {
		it('should store deferredPrompt when beforeinstallprompt fires', () => {
			const event = new Event('beforeinstallprompt') as unknown as BeforeInstallPromptEvent;
			// mock prompt to avoid runtime error if called
			(event as any).prompt = vi.fn();
			(event as any).userChoice = Promise.resolve({ outcome: 'accepted' });

			// Since main.tsx handles this, and main.tsx is not executed in these tests automatically
			// unless we import it (which has side effects like ReactDOM.render).
			// We can manually test the store setter.
			useGameStore.getState().setDeferredPrompt(event);
			expect(useGameStore.getState().deferredPrompt).toBe(event);
		});
	});
});
