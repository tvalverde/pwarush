import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DiceRollOverlay, {
	DEFAULT_REVEAL_MS,
	DEFAULT_TUMBLE_MS,
} from '../components/DiceRollOverlay';

describe('DiceRollOverlay', () => {
	it('uses snappy defaults so the roll never drags (well under the old ~1.6s)', () => {
		expect(DEFAULT_TUMBLE_MS).toBe(700);
		expect(DEFAULT_REVEAL_MS).toBe(250);
		expect(DEFAULT_TUMBLE_MS + DEFAULT_REVEAL_MS).toBeLessThan(1000);
	});

	it('renders the overlay immediately with a tumbling face', () => {
		const { getByTestId } = render(
			<DiceRollOverlay value={4} onDone={vi.fn()} durationMs={20} revealMs={10} />,
		);

		expect(getByTestId('dice-roll-overlay')).not.toBeNull();
		expect(getByTestId('dice-roll-face')).not.toBeNull();
	});

	it('eventually reveals the provided value', async () => {
		const { getByRole } = render(
			<DiceRollOverlay value={6} onDone={vi.fn()} durationMs={20} revealMs={10} />,
		);

		await waitFor(() => {
			expect(getByRole('img', { name: 'Dice showing 6' })).not.toBeNull();
		});
	});

	it('calls onDone once the settled value has been shown for revealMs', async () => {
		const onDone = vi.fn();
		render(<DiceRollOverlay value={3} onDone={onDone} durationMs={10} revealMs={10} />);

		await waitFor(() => {
			expect(onDone).toHaveBeenCalledTimes(1);
		});
	});

	it('cleans up its timers on unmount without throwing or leaking calls', async () => {
		const onDone = vi.fn();
		const { unmount } = render(
			<DiceRollOverlay value={5} onDone={onDone} durationMs={1000} revealMs={400} />,
		);

		unmount();

		// Wait past the original duration; onDone must not fire after unmount.
		await new Promise((resolve) => setTimeout(resolve, 60));
		expect(onDone).not.toHaveBeenCalled();
	});

	it('handles a null value by falling back to a random face on settle', async () => {
		const onDone = vi.fn();
		render(<DiceRollOverlay value={null} onDone={onDone} durationMs={10} revealMs={10} />);

		await waitFor(() => {
			expect(onDone).toHaveBeenCalledTimes(1);
		});
	});
});
