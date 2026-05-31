import { nearWinPuzzle } from '../fixtures/puzzles';
import { expect, test } from '../helpers/page-setup';

const emptyNotes = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

test.describe('Lifecycle hooks', () => {
	test('visibilitychange triggers persistence and reload restores the saved game', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			gameState: {
				grid: nearWinPuzzle.initialGrid,
				initialGrid: nearWinPuzzle.initialGrid,
				solution: nearWinPuzzle.solution,
				notes: emptyNotes(),
				timeElapsed: 5,
				mistakes: 0,
				hintsUsed: 0,
				isPaused: false,
				difficulty: 'beginner',
			},
		});
		await page.getByTestId('resume-saved-game').click();
		await expect(page.getByTestId('cell-0-0')).toBeVisible();

		await page.evaluate(() => {
			Object.defineProperty(document, 'visibilityState', {
				configurable: true,
				get: () => 'hidden',
			});
			document.dispatchEvent(new Event('visibilitychange'));
		});

		await page.waitForFunction(
			() =>
				new Promise<boolean>((resolve) => {
					const req = indexedDB.open('SudokupadoDB');
					req.onsuccess = () => {
						const db = req.result;
						if (!db.objectStoreNames.contains('gameState')) {
							db.close();
							resolve(false);
							return;
						}
						const tx = db.transaction(['gameState'], 'readonly');
						const store = tx.objectStore('gameState');
						const countRequest = store.count();
						countRequest.onsuccess = () => {
							db.close();
							resolve(countRequest.result > 0);
						};
						countRequest.onerror = () => {
							db.close();
							resolve(false);
						};
					};
					req.onerror = () => resolve(false);
				}),
			null,
			{ timeout: 10_000 },
		);

		await page.reload();
		await expect(page.getByTestId('resume-saved-game')).toBeVisible();
	});
});
