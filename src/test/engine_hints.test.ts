import { describe, expect, it } from 'vitest';
import { translations } from '../utils/translations';
import { engine } from '../workers/sudokuWorker';

describe('SudokuEngine: getLogicalHint', () => {
	it('should identify a Naked Single', () => {
		// A grid where (0,0) only has one possible candidate (1)
		const grid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
		grid[0][1] = 2;
		grid[0][2] = 3;
		grid[0][3] = 4;
		grid[0][4] = 5;
		grid[0][5] = 6;
		grid[0][6] = 7;
		grid[0][7] = 8;
		grid[0][8] = 9;

		const solution = Array(9)
			.fill(null)
			.map(() => Array(9).fill(1));

		const hint = engine.getLogicalHint(grid, solution);
		expect(hint.type).toBe('naked_single');
		expect(hint.value).toBe(1);
		expect(hint.r).toBe(0);
		expect(hint.c).toBe(0);
	});

	it('should identify a Hidden Single in a row', () => {
		const grid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));

		// Block columns 1-8 for number 1 in row 0, using rows that don't interfere with block 0 or col 0
		grid[4][1] = 1;
		grid[4][2] = 1;
		grid[1][3] = 1;
		grid[1][4] = 1;
		grid[1][5] = 1;
		grid[1][6] = 1;
		grid[1][7] = 1;
		grid[1][8] = 1;

		// Now in row 0, columns 1-8 are blocked for number 1.
		// So (0,0) is the only place for 1 in row 0.

		const solution = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
		solution[0][0] = 1;

		const hint = engine.getLogicalHint(grid, solution);
		expect(hint.value).toBe(1);
		expect(hint.r).toBe(0);
		expect(hint.c).toBe(0);
		expect(hint.type).toBe('hidden_single_row');
	});

	it('should provide a fallback if no logical hint is found', () => {
		const grid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
		const solution = Array(9)
			.fill(null)
			.map(() => Array(9).fill(5));

		const hint = engine.getLogicalHint(grid, solution);
		expect(hint).toBeDefined();
		expect(hint.value).toBe(5);
	});

	it('should have _why explanation keys for all hint types in both languages', () => {
		const types = [
			'naked_single',
			'hidden_single_row',
			'hidden_single_col',
			'hidden_single_block',
			'fallback',
		] as const;
		for (const type of types) {
			const whyKey = `${type}_why` as keyof typeof translations.en.hints;
			expect(translations.en.hints[whyKey]).toBeDefined();
			expect(translations.es.hints[whyKey]).toBeDefined();
		}
	});
});
