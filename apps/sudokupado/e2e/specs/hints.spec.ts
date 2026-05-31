import { nearWinPuzzle } from '../fixtures/puzzles';
import { expect, test } from '../helpers/page-setup';

const emptyNotes = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

test.describe('Hints', () => {
	test('requesting a hint opens the explanation panel', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', {
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

		const hintButton = page.getByTestId('action-hint');
		await expect(hintButton).toBeVisible();
		await expect(hintButton).toBeEnabled();
		await hintButton.click();

		await expect(page.getByRole('button', { name: /apply hint/i })).toBeVisible({ timeout: 8000 });
		await expect(page.getByRole('button', { name: /i got it/i })).toBeVisible();
	});

	test('hint button is disabled when max hints is zero', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			zustand: { maxHints: 0 },
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
		await expect(page.getByTestId('action-hint')).toBeDisabled();
	});
});
