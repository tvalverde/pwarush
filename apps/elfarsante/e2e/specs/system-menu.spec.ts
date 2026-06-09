import { expect, test } from '../helpers/page-setup';

/*
  The system menu lives behind the header gear/menu button and renders inside a
  NeonModal (role="dialog"). It exposes language switching, instructions, sync,
  and destructive actions. There is currently no SFX toggle in this menu.
*/
test.describe('System menu', () => {
	test('opens the system menu modal', async ({ page, seedAndGoto }) => {
		await seedAndGoto();

		await page.getByRole('button', { name: 'menu' }).click();

		const dialog = page.getByRole('dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('heading', { name: 'SISTEMA' })).toBeVisible();
	});

	test('switches language to English and persists it', async ({ page, seedAndGoto }) => {
		await seedAndGoto();

		await page.getByRole('button', { name: 'menu' }).click();
		const dialog = page.getByRole('dialog');

		// Default 'es' shows the "Idioma" label.
		await expect(dialog.getByText('Idioma', { exact: true })).toBeVisible();

		await dialog.getByRole('button', { name: 'en', exact: true }).click();

		// The same label is now rendered in English.
		await expect(dialog.getByText('Language', { exact: true })).toBeVisible();

		// Preference is persisted under the dedicated localStorage key.
		await expect
			.poll(() => page.evaluate(() => localStorage.getItem('elfarsante_lang')))
			.toBe('en');
	});
});
