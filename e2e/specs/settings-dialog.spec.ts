import { expect, test } from '../helpers/page-setup';

test.describe('Settings dialog', () => {
	test('opens and closes via header button and close icon', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('open-settings').click();
		await expect(page.getByRole('heading', { name: /^settings$/i })).toBeVisible();
		await page.getByTestId('settings-close').click();
		await expect(page.getByRole('heading', { name: /^settings$/i })).toBeHidden();
	});

	test('Clear All Data shows the danger confirm dialog and cancel keeps state', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto();
		await page.getByTestId('open-settings').click();
		await page.getByRole('button', { name: /clear all data/i }).click();
		await expect(page.getByTestId('confirm-dialog')).toBeVisible();
		await page.getByRole('button', { name: /cancel/i }).click();
		await expect(page.getByTestId('confirm-dialog')).toBeHidden();
		await expect(page.getByRole('heading', { name: /^settings$/i })).toBeVisible();
	});

	test('export backup triggers a JSON download', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('open-settings').click();
		const [download] = await Promise.all([
			page.waitForEvent('download', { timeout: 10_000 }),
			page.getByRole('button', { name: /export backup/i }).click(),
		]);
		expect(download.suggestedFilename()).toMatch(/\.json$/i);
	});
});
