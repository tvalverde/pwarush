import { describe, expect, it } from 'vitest';

describe('Regression: Keypad Completed Status', () => {
	it('should identify a completed number correctly', async () => {
		const gameStoreFile = await import('../store/gameStore');
		const { useGameStore } = gameStoreFile;

		const { initGame } = useGameStore.getState();

		// Manual setup to avoid localStorage mock issues in this specific environment
		const initial = Array(9)
			.fill(0)
			.map(() => Array(9).fill(0));
		const solution = Array(9)
			.fill(0)
			.map(() => Array(9).fill(1));

		initGame(initial, solution, 'beginner');

		// We check initial state
		expect(useGameStore.getState().isNumberCompleted(1)).toBe(false);
	});
});
