import { describe, expect, it } from 'vitest';
import { hasUserInput, isMistakeLimitReached } from '../utils/gameState';

const emptyGrid = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
const emptyNotes = () =>
	Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [] as number[]));

describe('hasUserInput', () => {
	it('returns false when the grid matches the initial grid and there are no notes', () => {
		const grid = emptyGrid();
		grid[0][0] = 5;
		const initialGrid = grid.map((row) => [...row]);

		expect(hasUserInput(grid, initialGrid, emptyNotes())).toBe(false);
	});

	it('returns true when a cell differs from the initial grid', () => {
		const initialGrid = emptyGrid();
		const grid = emptyGrid();
		grid[4][7] = 3;

		expect(hasUserInput(grid, initialGrid, emptyNotes())).toBe(true);
	});

	it('returns true when the grid is untouched but a note exists', () => {
		const grid = emptyGrid();
		const initialGrid = emptyGrid();
		const notes = emptyNotes();
		notes[8][8] = [1, 2];

		expect(hasUserInput(grid, initialGrid, notes)).toBe(true);
	});

	it('returns true when the user erased a pre-filled user value back to empty', () => {
		const initialGrid = emptyGrid();
		initialGrid[2][2] = 9;
		const grid = emptyGrid();

		expect(hasUserInput(grid, initialGrid, emptyNotes())).toBe(true);
	});
});

describe('isMistakeLimitReached', () => {
	it('never reaches the limit in unlimited mode (-1)', () => {
		expect(isMistakeLimitReached(0, -1)).toBe(false);
		expect(isMistakeLimitReached(999, -1)).toBe(false);
	});

	it('reaches the limit on the first mistake in zen mode (0)', () => {
		expect(isMistakeLimitReached(0, 0)).toBe(false);
		expect(isMistakeLimitReached(1, 0)).toBe(true);
	});

	it('reaches the limit only at the configured threshold', () => {
		expect(isMistakeLimitReached(2, 3)).toBe(false);
		expect(isMistakeLimitReached(3, 3)).toBe(true);
		expect(isMistakeLimitReached(4, 3)).toBe(true);
	});
});
