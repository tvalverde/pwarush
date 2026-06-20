import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TurnTransitionScreen from '../components/TurnTransitionScreen';
import { useGameStore } from '../store/gameStore';
import { playerAccent } from '../utils/players';

// Regression: in-game player icons (turn transition, HUD, handoff, victory) used a fixed
// cyan/gold colour instead of the player's accent, so they didn't match the lobby/board.
describe('player icon colour consistency', () => {
	it('renders the turn-transition glyph in the current player accent, not a fixed colour', () => {
		const s = useGameStore.getState();
		s.resetGame();
		s.loadBank([]);
		s.startGame([
			{ name: 'Ada', shape: 'TRIANGLE', level: 'KID' },
			{ name: 'Bob', shape: 'SQUARE', level: 'KID' },
		]);
		useGameStore.setState({ currentPlayerIndex: 1, phase: 'TURN_TRANSITION' });

		const { getByTestId } = render(<TurnTransitionScreen />);
		const html = getByTestId('turn-transition').innerHTML;
		expect(html).toContain(playerAccent(1));
		expect(html).not.toContain('var(--color-primary)');
	});
});
