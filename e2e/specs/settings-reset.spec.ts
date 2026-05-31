import { buildHistoryEntries } from '../fixtures/history';
import { expect, test } from '../helpers/page-setup';

test.describe.configure({ mode: 'serial' });

const readCounts = (page: import('@playwright/test').Page) =>
	page.evaluate(async () => {
		const db = (
			window as unknown as {
				__db: {
					players: { count: () => Promise<number> };
					preferences: { count: () => Promise<number> };
					history: { count: () => Promise<number> };
					gameState: { count: () => Promise<number> };
				};
			}
		).__db;
		return {
			players: await db.players.count(),
			preferences: await db.preferences.count(),
			history: await db.history.count(),
			gameState: await db.gameState.count(),
		};
	});

test.describe('Settings reset', () => {
	test('confirming Clear All Data wipes every table and reloads', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/sudokupado/', {
			history: buildHistoryEntries(3, { difficulty: 'beginner' }),
		});

		const initialCounts = await readCounts(page);
		expect(initialCounts.players).toBeGreaterThan(0);
		expect(initialCounts.history).toBe(3);

		await page.getByTestId('open-settings').click();
		await page.getByRole('button', { name: /clear all data/i }).click();
		await expect(page.getByTestId('confirm-dialog')).toBeVisible();

		const loadPromise = page.waitForEvent('load', { timeout: 10_000 });
		await page.getByRole('button', { name: /delete everything/i }).click();
		await loadPromise;

		await expect
			.poll(() => readCounts(page), { timeout: 10_000 })
			.toEqual({
				players: 0,
				preferences: 0,
				history: 0,
				gameState: 0,
			});
	});
});
