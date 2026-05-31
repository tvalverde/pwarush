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

test.describe('Game actions', () => {
	test('pause toggle freezes the board and clicking the overlay resumes it', async ({
		page,
		seedAndGoto,
	}) => {
		await resumeIntoGame(page, seedAndGoto);
		await page.getByTestId('pause-toggle').click();
		const pausedOverlay = page.getByText(/game paused/i);
		await expect(pausedOverlay).toBeVisible();
		await pausedOverlay.click();
		await expect(pausedOverlay).toBeHidden();
	});

	test('erase clears the value of a player-entered cell', async ({ page, seedAndGoto }) => {
		await resumeIntoGame(page, seedAndGoto);
		const target = page.getByTestId('cell-0-2');
		await target.click();
		await page
			.getByRole('button', { name: nearWinPuzzle.solution[0][2].toString(), exact: true })
			.first()
			.click();
		await expect(
			target.getByText(nearWinPuzzle.solution[0][2].toString(), { exact: true }),
		).toBeVisible();
		await page.getByTestId('action-erase').click();
		await expect(
			target.getByText(nearWinPuzzle.solution[0][2].toString(), { exact: true }),
		).toBeHidden();
	});

	test('restart shows the confirm dialog and cancel keeps the run alive', async ({
		page,
		seedAndGoto,
	}) => {
		await resumeIntoGame(page, seedAndGoto);
		await page.getByTestId('action-restart').click();
		await expect(page.getByTestId('confirm-dialog')).toBeVisible();
		await page.getByRole('button', { name: /continue playing/i }).click();
		await expect(page.getByTestId('confirm-dialog')).toBeHidden();
		await expect(page.getByTestId('cell-0-0')).toBeVisible();
	});
});
