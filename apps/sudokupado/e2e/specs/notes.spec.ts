import { nearWinPuzzle } from '../fixtures/puzzles';
import { expect, test } from '../helpers/page-setup';

const emptyNotes = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

const resumeIntoGame = async (
	page: import('@playwright/test').Page,
	seedAndGoto: (
		path?: string,
		options?: Parameters<typeof import('../helpers/seed').seedAndNavigate>[2],
	) => Promise<void>,
) => {
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
	await expect(page.getByTestId('cell-0-0')).toBeVisible();
};

test.describe('Notes mode', () => {
	test('toggling notes mode highlights the button', async ({ page, seedAndGoto }) => {
		await resumeIntoGame(page, seedAndGoto);
		const notesButton = page.getByTestId('action-notes');
		await notesButton.click();
		await expect(notesButton).toHaveClass(/bg-primary-text/);
		await notesButton.click();
		await expect(notesButton).not.toHaveClass(/bg-primary-text/);
	});

	test('placing a candidate note renders inside the selected cell', async ({
		page,
		seedAndGoto,
	}) => {
		await resumeIntoGame(page, seedAndGoto);
		const emptyCell = page.getByTestId('cell-0-2');
		await emptyCell.click();
		await page.getByTestId('action-notes').click();
		await page.getByRole('button', { name: '4', exact: true }).first().click();
		await expect(emptyCell.getByText('4', { exact: true })).toBeVisible();
	});
});
