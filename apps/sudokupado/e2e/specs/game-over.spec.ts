import { nearWinPuzzle } from '../fixtures/puzzles';
import { expect, test } from '../helpers/page-setup';

const emptyNotes = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

const findEmptyCell = (grid: number[][]): { r: number; c: number } => {
	for (let r = 0; r < 9; r++) {
		for (let c = 0; c < 9; c++) {
			if (grid[r][c] === 0) return { r, c };
		}
	}
	throw new Error('no empty cell');
};

test.describe('Game over conditions', () => {
	test('strict mode (0 mistakes) triggers game over on first incorrect entry', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			zustand: { maxMistakes: 0 },
			gameState: {
				grid: nearWinPuzzle.initialGrid,
				initialGrid: nearWinPuzzle.initialGrid,
				solution: nearWinPuzzle.solution,
				notes: emptyNotes(),
				timeElapsed: 0,
				mistakes: 0,
				hintsUsed: 0,
				isPaused: false,
				difficulty: 'beginner',
			},
		});
		await page.getByTestId('resume-saved-game').click();

		const target = findEmptyCell(nearWinPuzzle.initialGrid);
		await page.getByTestId(`cell-${target.r}-${target.c}`).click();

		const wrongValue =
			nearWinPuzzle.solution[target.r][target.c] === 1
				? 2
				: nearWinPuzzle.solution[target.r][target.c] - 1;
		await page
			.getByRole('button', { name: String(wrongValue), exact: true })
			.first()
			.click();

		await expect(page.getByTestId('confirm-dialog')).toBeVisible({ timeout: 5000 });
	});

	test('infinite mode (-1) keeps the game running after multiple mistakes', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			zustand: { maxMistakes: -1 },
			gameState: {
				grid: nearWinPuzzle.initialGrid,
				initialGrid: nearWinPuzzle.initialGrid,
				solution: nearWinPuzzle.solution,
				notes: emptyNotes(),
				timeElapsed: 0,
				mistakes: 0,
				hintsUsed: 0,
				isPaused: false,
				difficulty: 'beginner',
			},
		});
		await page.getByTestId('resume-saved-game').click();

		const target = findEmptyCell(nearWinPuzzle.initialGrid);
		const wrongValue =
			nearWinPuzzle.solution[target.r][target.c] === 1
				? 2
				: nearWinPuzzle.solution[target.r][target.c] - 1;

		await page.getByTestId(`cell-${target.r}-${target.c}`).click();
		await page
			.getByRole('button', { name: String(wrongValue), exact: true })
			.first()
			.click();

		await expect(page.getByTestId('confirm-dialog')).not.toBeVisible();
		await expect(page.getByTestId('cell-0-0')).toBeVisible();
	});
});
