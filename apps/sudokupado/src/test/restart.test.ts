import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Regression: Restart Game Functionality', () => {
	beforeEach(() => {
		localStorage.clear();
		useGameStore.getState().clearSavedGame();
	});

	it('should reset the grid, mistakes, and time when restartGame is called', () => {
		const { initGame, setCellValue, incrementTime, restartGame } = useGameStore.getState();

		const initial = [
			[0, 0],
			[0, 0],
		];
		const solution = [
			[1, 2],
			[3, 4],
		];

		// 1. Start a game
		initGame(initial, solution, 'beginner');

		// 2. Make some progress and mistakes
		setCellValue(0, 0, 1); // Correct
		setCellValue(0, 1, 9); // Incorrect (+1 mistake)
		incrementTime(); // +1 second

		let state = useGameStore.getState();
		expect(state.grid[0][0]).toBe(1);
		expect(state.mistakes).toBe(1);
		expect(state.timeElapsed).toBe(1);

		// 3. Restart
		restartGame();

		// 4. Verify everything is back to initial
		state = useGameStore.getState();
		expect(state.grid[0][0]).toBe(0); // Back to empty (initialGrid)
		expect(state.mistakes).toBe(0);
		expect(state.timeElapsed).toBe(0);
		expect(state.hintsUsed).toBe(0);
	});
});
