import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BoardOverlay from './BoardOverlay';

describe('BoardOverlay', () => {
	it('renders children and centers an absolutely-positioned layer', () => {
		render(
			<BoardOverlay data-testid="overlay">
				<span>Solved</span>
			</BoardOverlay>,
		);
		const overlay = screen.getByTestId('overlay');
		expect(overlay).toHaveTextContent('Solved');
		expect(overlay.className).toContain('absolute');
		expect(overlay.className).toContain('inset-0');
		expect(overlay.className).toContain('items-center');
		expect(overlay.className).toContain('justify-center');
	});

	it('is interactive by default (no pointer-events suppression)', () => {
		render(<BoardOverlay data-testid="overlay">x</BoardOverlay>);
		expect(screen.getByTestId('overlay').className).not.toContain('pointer-events-none');
	});

	it('ignores pointer events when not interactive', () => {
		render(
			<BoardOverlay data-testid="overlay" interactive={false}>
				x
			</BoardOverlay>,
		);
		expect(screen.getByTestId('overlay').className).toContain('pointer-events-none');
	});

	it('merges app-specific className for surface styling', () => {
		render(
			<BoardOverlay data-testid="overlay" className="z-40 bg-surface/85 backdrop-blur-sm">
				x
			</BoardOverlay>,
		);
		const overlay = screen.getByTestId('overlay');
		expect(overlay.className).toContain('z-40');
		expect(overlay.className).toContain('bg-surface/85');
		expect(overlay.className).toContain('backdrop-blur-sm');
	});
});
