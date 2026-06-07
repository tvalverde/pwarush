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

const readSelectedCell = (page: import('@playwright/test').Page) =>
	page.evaluate(() => {
		const store = (
			window as unknown as {
				__useGameStore: {
					getState: () => { selectedCell: { r: number; c: number } | null; isNoteMode: boolean };
				};
			}
		).__useGameStore;
		return store.getState().selectedCell;
	});

const readIsNoteMode = (page: import('@playwright/test').Page) =>
	page.evaluate(() => {
		const store = (
			window as unknown as {
				__useGameStore: { getState: () => { isNoteMode: boolean } };
			}
		).__useGameStore;
		return store.getState().isNoteMode;
	});

test.describe('Keyboard shortcuts', () => {
	test('arrow keys without selection focus center cell, then navigate to (0,0)', async ({
		page,
		seedAndGoto,
	}) => {
		await resumeIntoGame(page, seedAndGoto);
		await page.evaluate(() => {
			const store = (
				window as unknown as {
					__useGameStore: { setState: (partial: Record<string, unknown>) => void };
				}
			).__useGameStore;
			store.setState({ selectedCell: null });
		});

		await page.keyboard.press('ArrowDown');
		await expect.poll(() => readSelectedCell(page)).toEqual({ r: 4, c: 4 });

		for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp');
		for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowLeft');

		await expect.poll(() => readSelectedCell(page)).toEqual({ r: 0, c: 0 });
	});

	test('pressing N toggles notes mode, Space toggles it back off', async ({
		page,
		seedAndGoto,
	}) => {
		await resumeIntoGame(page, seedAndGoto);
		await page.locator('body').click();

		await page.keyboard.press('n');
		await expect.poll(() => readIsNoteMode(page)).toBe(true);
		await expect(page.getByTestId('action-notes')).toHaveClass(/bg-primary(?!-)/);

		await page.keyboard.press(' ');
		await expect.poll(() => readIsNoteMode(page)).toBe(false);
	});

	test('number keys place values on player-entered cells', async ({ page, seedAndGoto }) => {
		await resumeIntoGame(page, seedAndGoto);
		await page.locator('body').click();
		await page.getByTestId('cell-0-2').click();
		const winningValue = nearWinPuzzle.solution[0][2];
		await page.keyboard.press(String(winningValue));
		await expect(
			page.getByTestId('cell-0-2').getByText(String(winningValue), { exact: true }),
		).toBeVisible();
	});
});
