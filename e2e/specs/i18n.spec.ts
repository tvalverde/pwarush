import { expect, test } from '../helpers/page-setup';

test.describe('i18n language toggle', () => {
	test('switching to Castellano updates labels and persists across reload', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto();

		await page.getByTestId('nav-rules').click();
		await expect(page.getByRole('heading', { name: /^rules$/i })).toBeVisible();
		await page.getByTestId('nav-main').click();

		await page.getByTestId('open-settings').click();
		await page.getByTestId('language-toggle-es').click();
		await page.getByTestId('settings-close').click();

		await page.getByTestId('nav-rules').click();
		await expect(page.getByRole('heading', { name: /^ayuda$/i })).toBeVisible();

		await page.reload();
		await page.getByTestId('nav-rules').click();
		await expect(page.getByRole('heading', { name: /^ayuda$/i })).toBeVisible();
	});
});
