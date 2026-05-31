import { describe, expect, it, vi } from 'vitest';
import { engine, workerHandler } from '../workers/sudokuWorker';

describe('SudokuEngine - Full Coverage Advanced Techniques', () => {
	const getEmptyCandidates = (): number[][][] =>
		Array(9)
			.fill(null)
			.map(() =>
				Array(9)
					.fill(null)
					.map(() => []),
			);

	it('should cover X-Wing logic', () => {
		const candidates = getEmptyCandidates();
		const n = 1;
		// Row 0 and Row 2 have candidate 1 at columns 0 and 5
		candidates[0][0] = [n];
		candidates[0][5] = [n];
		candidates[2][0] = [n];
		candidates[2][5] = [n];

		// Row 4 has candidate 1 at column 0 (should be removed)
		candidates[4][0] = [n, 2];

		const changed = (engine as any).applyXWing(candidates);
		expect(changed).toBe(true);
		expect(candidates[4][0]).not.toContain(n);
	});

	it('should cover Swordfish logic', () => {
		const candidates = getEmptyCandidates();
		const n = 1;
		// Rows 0, 2, 4 have candidate 1 at columns 0, 3, 6 (Swordfish pattern)
		candidates[0][0] = [n];
		candidates[0][3] = [n];
		candidates[2][3] = [n];
		candidates[2][6] = [n];
		candidates[4][0] = [n];
		candidates[4][6] = [n];

		// Row 6 has candidate 1 at column 3 (should be removed)
		candidates[6][3] = [n, 2];

		const changed = (engine as any).applySwordfish(candidates);
		expect(changed).toBe(true);
		expect(candidates[6][3]).not.toContain(n);
	});

	it('should cover Jellyfish logic', () => {
		const candidates = getEmptyCandidates();
		const n = 1;
		// Rows 0, 1, 2, 3 with columns 0, 1, 2, 3
		for (let i = 0; i < 4; i++) {
			candidates[i][i] = [n];
			candidates[i][(i + 1) % 4] = [n];
		}

		// Row 5 has candidate 1 at column 0 (should be removed)
		candidates[5][0] = [n, 2];

		const changed = (engine as any).applyJellyfish(candidates);
		expect(changed).toBe(true);
		expect(candidates[5][0]).not.toContain(n);
	});

	it('should cover XY-Wing logic', () => {
		const candidates = getEmptyCandidates();
		// Pivot at (0,0) with candidates 1,2
		candidates[0][0] = [1, 2];
		// Wing 1 at (0,5) with 1,3 (sees 0,0)
		candidates[0][5] = [1, 3];
		// Wing 2 at (5,0) with 2,3 (sees 0,0)
		candidates[5][0] = [2, 3];

		// Target at (5,5) with 3 (sees both wings)
		candidates[5][5] = [3, 4];

		const changed = (engine as any).applyXYWing(candidates);
		expect(changed).toBe(true);
		expect(candidates[5][5]).not.toContain(3);
	});

	it('should cover Hidden Singles in all units', () => {
		const candidates = getEmptyCandidates();
		const grid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));

		// Hidden Single in Row 0: digit 5 only at Col 8
		candidates[0][8] = [5];
		// (Other cells in Row 0 don't have 5)

		let changed = (engine as any).applyHiddenSingles(grid, candidates);
		expect(changed).toBe(true);
		expect(grid[0][8]).toBe(5);

		// Hidden Single in Col 1: digit 6 only at Row 8
		const grid2 = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
		const candidates2 = getEmptyCandidates();
		candidates2[8][1] = [6];
		changed = (engine as any).applyHiddenSingles(grid2, candidates2);
		expect(changed).toBe(true);
		expect(grid2[8][1]).toBe(6);

		// Hidden Single in Block 2: digit 7 only at (0,7)
		const grid3 = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
		const candidates3 = getEmptyCandidates();
		candidates3[0][7] = [7];
		changed = (engine as any).applyHiddenSingles(grid3, candidates3);
		expect(changed).toBe(true);
		expect(grid3[0][7]).toBe(7);
	});

	it('should cover Pointing in columns', () => {
		const candidates = getEmptyCandidates();
		// Block 0 has '1' only in Col 0
		candidates[0][0] = [1];
		candidates[1][0] = [1];
		// Col 0, Row 5 has '1' (should be removed)
		candidates[5][0] = [1, 2];

		const changed = (engine as any).applyPointing(candidates);
		expect(changed).toBe(true);
		expect(candidates[5][0]).not.toContain(1);
	});

	it('should cover Naked Pairs in all units', () => {
		const candidates = getEmptyCandidates();
		// Row 0
		candidates[0][0] = [1, 2];
		candidates[0][1] = [1, 2];
		candidates[0][2] = [1, 2, 3];
		expect((engine as any).applyPairs(candidates)).toBe(true);
		expect(candidates[0][2]).toEqual([3]);

		// Col 1
		const c2 = getEmptyCandidates();
		c2[0][1] = [4, 5];
		c2[1][1] = [4, 5];
		c2[2][1] = [4, 5, 6];
		expect((engine as any).applyPairs(c2)).toBe(true);
		expect(c2[2][1]).toEqual([6]);

		// Block 2
		const c3 = getEmptyCandidates();
		c3[0][6] = [7, 8];
		c3[0][7] = [7, 8];
		c3[0][8] = [7, 8, 9];
		expect((engine as any).applyPairs(c3)).toBe(true);
		expect(c3[0][8]).toEqual([9]);
	});

	it('should classify expert difficulty', () => {
		const grid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(1));
		const spy = vi.spyOn(engine as any, 'applyXWing').mockReturnValueOnce(true);
		const diff = engine.analyzeDifficulty(grid);
		expect(diff).toBe('expert');
		spy.mockRestore();
	});

	it('should classify intermediate difficulty', () => {
		const grid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(1));
		const spy = vi.spyOn(engine as any, 'applyPointing').mockReturnValueOnce(true);
		const diff = engine.analyzeDifficulty(grid);
		expect(diff).toBe('intermediate');
		spy.mockRestore();
	});

	it('should classify master difficulty if Swordfish used', () => {
		const grid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(1));
		const spy = vi.spyOn(engine as any, 'applySwordfish').mockReturnValueOnce(true);
		const diff = engine.analyzeDifficulty(grid);
		expect(diff).toBe('master');
		spy.mockRestore();
	});

	it('should classify master difficulty if Jellyfish used', () => {
		const grid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(1));
		const spy = vi.spyOn(engine as any, 'applyJellyfish').mockReturnValueOnce(true);
		const diff = engine.analyzeDifficulty(grid);
		expect(diff).toBe('master');
		spy.mockRestore();
	});

	it('should cover Pointing in rows', () => {
		const candidates = getEmptyCandidates();
		// Block 0 has '1' only in Row 0
		candidates[0][0] = [1];
		candidates[0][1] = [1];
		// Row 0, Col 5 has '1' (should be removed)
		candidates[0][5] = [1, 2];

		const changed = (engine as any).applyPointing(candidates);
		expect(changed).toBe(true);
		expect(candidates[0][5]).not.toContain(1);
	});

	it('should classify expert difficulty', () => {
		const grid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(1));
		const spy = vi.spyOn(engine as any, 'applyXWing').mockReturnValueOnce(true);
		const diff = engine.analyzeDifficulty(grid);
		expect(diff).toBe('expert');
		spy.mockRestore();
	});

	it('should ignore unknown worker message types', () => {
		const postMessageSpy = vi.fn();
		(globalThis as any).self = {
			postMessage: postMessageSpy,
		};
		const event = {
			data: { type: 'UNKNOWN' },
		} as MessageEvent;
		workerHandler(event);
		expect(postMessageSpy).not.toHaveBeenCalled();
	});
});
