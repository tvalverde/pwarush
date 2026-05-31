import type { Difficulty } from '../../src/types';

export interface PuzzleFixture {
	initialGrid: number[][];
	solution: number[][];
	difficulty: Difficulty;
}

const wikipediaInitial: number[][] = [
	[5, 3, 0, 0, 7, 0, 0, 0, 0],
	[6, 0, 0, 1, 9, 5, 0, 0, 0],
	[0, 9, 8, 0, 0, 0, 0, 6, 0],
	[8, 0, 0, 0, 6, 0, 0, 0, 3],
	[4, 0, 0, 8, 0, 3, 0, 0, 1],
	[7, 0, 0, 0, 2, 0, 0, 0, 6],
	[0, 6, 0, 0, 0, 0, 2, 8, 0],
	[0, 0, 0, 4, 1, 9, 0, 0, 5],
	[0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const wikipediaSolution: number[][] = [
	[5, 3, 4, 6, 7, 8, 9, 1, 2],
	[6, 7, 2, 1, 9, 5, 3, 4, 8],
	[1, 9, 8, 3, 4, 2, 5, 6, 7],
	[8, 5, 9, 7, 6, 1, 4, 2, 3],
	[4, 2, 6, 8, 5, 3, 7, 9, 1],
	[7, 1, 3, 9, 2, 4, 8, 5, 6],
	[9, 6, 1, 5, 3, 7, 2, 8, 4],
	[2, 8, 7, 4, 1, 9, 6, 3, 5],
	[3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const cloneGrid = (grid: number[][]): number[][] => grid.map((row) => [...row]);

const asDifficulty = (difficulty: Difficulty): PuzzleFixture => ({
	initialGrid: cloneGrid(wikipediaInitial),
	solution: cloneGrid(wikipediaSolution),
	difficulty,
});

export const beginnerPuzzleA: PuzzleFixture = asDifficulty('beginner');
export const intermediatePuzzleA: PuzzleFixture = asDifficulty('intermediate');
export const expertPuzzleA: PuzzleFixture = asDifficulty('expert');
export const masterPuzzleA: PuzzleFixture = asDifficulty('master');

export const nearWinPuzzle: PuzzleFixture = (() => {
	const grid = cloneGrid(wikipediaSolution);
	grid[8][8] = 0;
	return {
		initialGrid: cloneGrid(wikipediaInitial),
		solution: cloneGrid(wikipediaSolution),
		difficulty: 'beginner',
		grid,
	} as PuzzleFixture & { grid: number[][] };
})();

export const nearGameOverPuzzle: PuzzleFixture = (() => ({
	initialGrid: cloneGrid(wikipediaInitial),
	solution: cloneGrid(wikipediaSolution),
	difficulty: 'beginner',
}))();

export const hintReadyPuzzle: PuzzleFixture = (() => {
	const grid = cloneGrid(wikipediaInitial);
	return {
		initialGrid: cloneGrid(wikipediaInitial),
		solution: cloneGrid(wikipediaSolution),
		difficulty: 'beginner',
		grid,
	} as PuzzleFixture & { grid: number[][] };
})();

export const notesPuzzle: PuzzleFixture = (() => {
	const notes: number[][][] = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));
	notes[0][2] = [4];
	notes[1][1] = [2, 7];
	notes[2][0] = [1, 2];
	return {
		initialGrid: cloneGrid(wikipediaInitial),
		solution: cloneGrid(wikipediaSolution),
		difficulty: 'beginner',
		notes,
	} as PuzzleFixture & { notes: number[][][] };
})();

export const allBasePuzzles: PuzzleFixture[] = [
	beginnerPuzzleA,
	intermediatePuzzleA,
	expertPuzzleA,
	masterPuzzleA,
];
