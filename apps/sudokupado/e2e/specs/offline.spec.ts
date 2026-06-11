import { nearWinPuzzle } from '../fixtures/puzzles';
import { DEXIE_DB_NAME } from '../fixtures/state';
import { expect, test } from '../helpers/page-setup';

const emptyNotes = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

// Editable cells: empty in the wikipedia initial grid used by nearWinPuzzle.
// Two cells stay blank so filling the target one does NOT finish the puzzle
// (victory would clear the saved game and defeat the autosave assertion).
const targetCell = { r: 0, c: 2 };
const spareCell = { r: 1, c: 1 };

const readSavedGrid = (page: import('@playwright/test').Page) =>
	page.evaluate(async (dbName) => {
		return await new Promise<number[][] | null>((resolve, reject) => {
			const request = indexedDB.open(dbName);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const db = request.result;
				const getAll = db.transaction('gameState', 'readonly').objectStore('gameState').getAll();
				getAll.onsuccess = () => {
					db.close();
					resolve(getAll.result.length > 0 ? getAll.result[0].grid : null);
				};
				getAll.onerror = () => reject(getAll.error);
			};
		});
	}, DEXIE_DB_NAME);

test.describe('Offline/online transition', () => {
	test('gameplay and autosave keep working offline, and progress survives reconnection', async ({
		page,
		context,
		seedAndGoto,
	}) => {
		const playableGrid = nearWinPuzzle.solution.map((row) => [...row]);
		playableGrid[targetCell.r][targetCell.c] = 0;
		playableGrid[spareCell.r][spareCell.c] = 0;

		await seedAndGoto('/pwarush/sudokupado/', {
			gameState: {
				grid: playableGrid,
				initialGrid: nearWinPuzzle.initialGrid,
				solution: nearWinPuzzle.solution,
				notes: emptyNotes(),
				timeElapsed: 30,
				mistakes: 0,
				hintsUsed: 0,
				isPaused: false,
				difficulty: 'beginner',
			},
		});

		await page.getByTestId('resume-saved-game').click();
		const cell = page.getByTestId(`cell-${targetCell.r}-${targetCell.c}`);
		await expect(cell).toBeVisible();

		await context.setOffline(true);

		const value = nearWinPuzzle.solution[targetCell.r][targetCell.c];
		await cell.click();
		await page
			.getByRole('button', { name: String(value), exact: true })
			.first()
			.click();
		await expect(cell).toContainText(String(value));

		// The autosave throttle is 3s; poll IndexedDB to prove persistence works without network.
		await expect
			.poll(async () => (await readSavedGrid(page))?.[targetCell.r]?.[targetCell.c], {
				timeout: 10_000,
			})
			.toBe(value);

		await context.setOffline(false);
		await page.reload();

		await expect(page.getByTestId('resume-saved-game')).toBeVisible();
		await page.getByTestId('resume-saved-game').click();
		await expect(cell).toContainText(String(value));
	});
});
