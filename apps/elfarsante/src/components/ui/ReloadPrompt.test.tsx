import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReloadPrompt } from './ReloadPrompt';

// Mock the virtual module
vi.mock('virtual:pwa-register/react', () => {
	return {
		useRegisterSW: vi.fn(() => ({
			offlineReady: [false, vi.fn()],
			needRefresh: [false, vi.fn()],
			updateServiceWorker: vi.fn(),
		})),
	};
});

import { useRegisterSW } from 'virtual:pwa-register/react';

describe('ReloadPrompt', () => {
	it('renders nothing when not offline ready and no refresh needed', () => {
		const { container } = render(<ReloadPrompt />);
		expect(container.firstChild).toBeNull();
	});

	it('renders offline ready message', () => {
		const setOfflineReady = vi.fn();
		vi.mocked(useRegisterSW).mockReturnValue({
			offlineReady: [true, setOfflineReady],
			needRefresh: [false, vi.fn()],
			updateServiceWorker: vi.fn(),
		});

		render(<ReloadPrompt />);
		expect(screen.getByText(/Aplicación lista para funcionar sin conexión/i)).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /CERRAR/i }));
		expect(setOfflineReady).toHaveBeenCalledWith(false);
	});

	it('renders refresh needed message and triggers update', () => {
		const setNeedRefresh = vi.fn();
		const updateServiceWorker = vi.fn();
		vi.mocked(useRegisterSW).mockReturnValue({
			offlineReady: [false, vi.fn()],
			needRefresh: [true, setNeedRefresh],
			updateServiceWorker,
		});

		render(<ReloadPrompt />);
		expect(screen.getByText(/Nueva versión disponible/i)).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: /ACTUALIZAR/i }));
		expect(updateServiceWorker).toHaveBeenCalledWith(true);

		fireEvent.click(screen.getByRole('button', { name: /CERRAR/i }));
		expect(setNeedRefresh).toHaveBeenCalledWith(false);
	});
});
