import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import RotateDeviceOverlay from './RotateDeviceOverlay';

const setViewport = (width: number, height: number) => {
	Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
	Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
};

const props = { title: 'Rotate your device', message: 'This game is portrait-only.' };

describe('RotateDeviceOverlay', () => {
	afterEach(() => {
		setViewport(1024, 768);
	});

	it('stays hidden in portrait', () => {
		setViewport(390, 844);
		const { container } = render(<RotateDeviceOverlay {...props} />);
		expect(container.firstChild).toBeNull();
	});

	it('shows the overlay in narrow landscape', () => {
		setViewport(800, 600);
		render(<RotateDeviceOverlay {...props} />);
		expect(screen.getByText('Rotate your device')).toBeInTheDocument();
		expect(screen.getByText('This game is portrait-only.')).toBeInTheDocument();
	});

	it('reacts to resize into landscape', () => {
		setViewport(390, 844);
		render(<RotateDeviceOverlay {...props} />);
		expect(screen.queryByText('Rotate your device')).toBeNull();

		setViewport(800, 600);
		act(() => {
			window.dispatchEvent(new Event('resize'));
		});
		expect(screen.getByText('Rotate your device')).toBeInTheDocument();
	});
});
