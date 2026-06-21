import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MatchClock from '../components/MatchClock';
import { useGameStore } from '../store/gameStore';

describe('MatchClock', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders 00:00:00 when no match has started', () => {
		useGameStore.setState({ startedAt: null });

		const { getByTestId } = render(<MatchClock />);

		expect(getByTestId('match-clock')).toHaveTextContent('00:00:00');
	});

	it('formats the elapsed time since startedAt as HH:MM:SS', () => {
		const now = new Date('2026-01-01T10:00:00Z').getTime();
		vi.useFakeTimers();
		vi.setSystemTime(now);

		// 1h 02m 03s before "now".
		const startedAt = now - (1 * 3600 + 2 * 60 + 3) * 1000;
		useGameStore.setState({ startedAt });

		const { getByTestId } = render(<MatchClock />);

		expect(getByTestId('match-clock')).toHaveTextContent('01:02:03');
	});

	it('ticks forward every second while mounted', () => {
		const now = new Date('2026-01-01T10:00:00Z').getTime();
		vi.useFakeTimers();
		vi.setSystemTime(now);
		useGameStore.setState({ startedAt: now });

		const { getByTestId } = render(<MatchClock />);
		expect(getByTestId('match-clock')).toHaveTextContent('00:00:00');

		act(() => {
			vi.advanceTimersByTime(1000);
		});

		expect(getByTestId('match-clock')).toHaveTextContent('00:00:01');
	});
});
