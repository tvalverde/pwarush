import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BoardBackdrop from '../components/board/BoardBackdrop';

describe('BoardBackdrop', () => {
	it('renders a full-bleed deep-space layer that covers the whole arena (slice)', () => {
		const { container } = render(<BoardBackdrop />);
		const svg = container.querySelector('svg');
		expect(svg).not.toBeNull();
		// `slice` makes the square artwork cover any aspect ratio instead of being letterboxed.
		expect(svg?.getAttribute('preserveAspectRatio')).toBe('xMidYMid slice');
		expect(svg?.classList.contains('absolute')).toBe(true);
		// The space vignette and a starfield are present.
		expect(container.querySelector('rect[fill="url(#nq-space)"]')).not.toBeNull();
		expect(container.querySelectorAll('.nq-starfield circle').length).toBeGreaterThan(0);
	});
});
