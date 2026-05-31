import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('GameStore Logic & Regression', () => {
	beforeEach(() => {
		// Reset store before each test
		const { clearSavedGame, setLastGameResult, setActivePlayer, setSelectedCell } =
			useGameStore.getState();
		clearSavedGame();
		setLastGameResult(null);
		setActivePlayer(null);
		setSelectedCell(0, null);
	});

	it('should initialize game correctly and set screen to game', () => {
		const { initGame } = useGameStore.getState();
		const initial = [[1]];
		const solution = [[1]];

		initGame(initial, solution, 'beginner');

		const state = useGameStore.getState();
		expect(state.activeScreen).toBe('game');
		expect(state.grid[0][0]).toBe(1);
		expect(state.selectedDifficulty).toBe('beginner');
	});

	it('should handle correct value input and auto-clean notes', () => {
		const { initGame, setCellValue, toggleNote } = useGameStore.getState();
		const initial = [
			[0, 0],
			[0, 0],
		];
		const solution = [
			[1, 2],
			[3, 4],
		];

		initGame(initial, solution, 'beginner');

		// Add a note that should be cleaned
		toggleNote(0, 1, 1);
		expect(useGameStore.getState().notes[0][1]).toContain(1);

		// Set correct value at (0, 0)
		const result = setCellValue(0, 0, 1);

		expect(result.isCorrect).toBe(true);
		expect(useGameStore.getState().grid[0][0]).toBe(1);
		// Note at (0, 1) should be cleaned because value 1 was set in same row
		expect(useGameStore.getState().notes[0][1]).not.toContain(1);
	});

	it('should increment mistakes on incorrect input (Regression)', () => {
		const { initGame, setCellValue } = useGameStore.getState();
		const initial = [[0]];
		const solution = [[1]];

		initGame(initial, solution, 'beginner');
		const result = setCellValue(0, 0, 2);

		expect(result.isCorrect).toBe(false);
		expect(useGameStore.getState().mistakes).toBe(1);
	});

	it('should handle victory sequence', () => {
		const { initGame, setCellValue } = useGameStore.getState();
		const initial = [[0]];
		const solution = [[1]];

		initGame(initial, solution, 'beginner');
		const result = setCellValue(0, 0, 1);

		expect(result.isFinished).toBe(true);
	});

	it('sets hasActiveGame to true on initGame, false on clearSavedGame', () => {
		const { initGame, clearSavedGame } = useGameStore.getState();
		const initial = [[1]];
		const solution = [[1]];

		initGame(initial, solution, 'beginner');
		expect(useGameStore.getState().hasActiveGame).toBe(true);

		clearSavedGame();
		expect(useGameStore.getState().hasActiveGame).toBe(false);
	});

	it('sets hasActiveGame to true on resumeGame', () => {
		const { resumeGame } = useGameStore.getState();
		const savedState = {
			playerId: 0,
			grid: [[1]],
			initialGrid: [[0]],
			solution: [[1]],
			notes: Array(9)
				.fill(null)
				.map(() =>
					Array(9)
						.fill(null)
						.map(() => [] as number[]),
				) as number[][][],
			mistakes: 0,
			hintsUsed: 0,
			timeElapsed: 30,
			isPaused: false,
			difficulty: 'beginner' as const,
		};

		resumeGame(savedState);
		expect(useGameStore.getState().hasActiveGame).toBe(true);
	});

	it('should correctly resume a saved game (Regression for white screen bug)', () => {
		const { resumeGame } = useGameStore.getState();
		const savedState = {
			playerId: 1,
			grid: [[1]],
			initialGrid: [[1]],
			solution: [[1]],
			notes: Array(9)
				.fill(null)
				.map(() =>
					Array(9)
						.fill(null)
						.map(() => []),
				) as number[][][],
			mistakes: 0,
			hintsUsed: 0,
			timeElapsed: 10,
			isPaused: true,
			difficulty: 'expert' as const,
		};

		resumeGame(savedState);

		const state = useGameStore.getState();
		expect(state.activeScreen).toBe('game');
		expect(state.selectedDifficulty).toBe('expert');
		expect(state.grid[0][0]).toBe(1);
	});
});
