import { nearWinPuzzle } from '../fixtures/puzzles';
import { expect, test } from '../helpers/page-setup';

const emptyNotes = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

test.describe('Persistence', () => {
	test('seeded saved game is detected and resumes into the board', async ({
		page,
		seedAndGoto,
	}) => {
		const seededGrid = nearWinPuzzle.initialGrid;
		await seedAndGoto('/pwarush/sudokupado/', {
			gameState: {
				grid: seededGrid,
				initialGrid: seededGrid,
				solution: nearWinPuzzle.solution,
				notes: emptyNotes(),
				timeElapsed: 42,
				mistakes: 0,
				hintsUsed: 0,
				isPaused: false,
				difficulty: 'beginner',
			},
		});

		await expect(page.getByTestId('resume-saved-game')).toBeVisible();
		await page.getByTestId('resume-saved-game').click();
		await expect(page.getByTestId('cell-0-0')).toBeVisible();
	});

	test('reload after seeding still shows the resume card', async ({ page, seedAndGoto }) => {
		const seededGrid = nearWinPuzzle.initialGrid;
		await seedAndGoto('/pwarush/sudokupado/', {
			gameState: {
				grid: seededGrid,
				initialGrid: seededGrid,
				solution: nearWinPuzzle.solution,
				notes: emptyNotes(),
				timeElapsed: 99,
				mistakes: 1,
				hintsUsed: 0,
				isPaused: false,
				difficulty: 'beginner',
			},
		});

		await expect(page.getByTestId('resume-saved-game')).toBeVisible();
		await page.reload();
		await expect(page.getByTestId('resume-saved-game')).toBeVisible();
	});
});
