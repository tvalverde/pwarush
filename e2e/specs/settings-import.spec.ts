import { buildInvalidBackup, buildValidBackup } from '../fixtures/backup';
import { expect, test } from '../helpers/page-setup';

test.describe.configure({ mode: 'serial' });

const readPlayerNames = (page: import('@playwright/test').Page) =>
	page.evaluate(async () => {
		const db = (
			window as unknown as {
				__db: { players: { toArray: () => Promise<{ name: string }[]> } };
			}
		).__db;
		const players = await db.players.toArray();
		return players.map((p) => p.name);
	});

test.describe('Settings import', () => {
	test('importing a valid backup confirms, reloads and persists the players', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto();
		const backup = buildValidBackup({ playerName: 'Imported Player' });
		const buffer = Buffer.from(JSON.stringify(backup), 'utf-8');

		await page.getByTestId('open-settings').click();
		await page.getByTestId('settings-import-input').setInputFiles({
			name: 'backup.json',
			mimeType: 'application/json',
			buffer,
		});
		await expect(page.getByTestId('confirm-dialog')).toBeVisible();

		const loadPromise = page.waitForEvent('load', { timeout: 10_000 });
		await page.getByRole('button', { name: /import & reload/i }).click();
		await loadPromise;

		await expect
			.poll(() => readPlayerNames(page), { timeout: 10_000 })
			.toEqual(['Imported Player']);
	});

	test('importing an invalid backup surfaces the failure toast', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		const buffer = Buffer.from(JSON.stringify(buildInvalidBackup()), 'utf-8');

		await page.getByTestId('open-settings').click();
		await page.getByTestId('settings-import-input').setInputFiles({
			name: 'bad.json',
			mimeType: 'application/json',
			buffer,
		});
		await page.getByRole('button', { name: /import & reload/i }).click();
		await expect(page.getByText(/import failed/i)).toBeVisible();
	});
});
