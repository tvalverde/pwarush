import { nearWinPuzzle } from '../fixtures/puzzles';
import { expect, test } from '../helpers/page-setup';

const emptyNotes = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

test.describe('Visual regression', () => {
	test('main menu without saved game', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await expect(page.getByTestId('start-game-button')).toBeVisible();
		await expect(page).toHaveScreenshot('main-menu-empty.png', { fullPage: true });
	});

	test('main menu with saved game card', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/sudokupado/', {
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
		await expect(page.getByTestId('resume-saved-game')).toBeVisible();
		await expect(page).toHaveScreenshot('main-menu-with-saved-game.png', { fullPage: true });
	});

	test('game screen with seeded puzzle', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/sudokupado/', {
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
		await expect(page.getByTestId('cell-0-0')).toBeVisible();
		await expect(page).toHaveScreenshot('game-screen-seeded.png', { fullPage: true });
	});
});
