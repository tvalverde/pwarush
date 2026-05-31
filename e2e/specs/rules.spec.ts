import { expect, test } from '../helpers/page-setup';

test.describe('Rules screen', () => {
	test('navigation to rules renders the canonical sections', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('nav-rules').click();
		await expect(page.getByRole('heading', { name: /^rules$/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /basic rules/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /advanced techniques/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: /scoring system/i })).toBeVisible();
	});

	test('back button returns to main menu', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('nav-rules').click();
		await page.getByTestId('rules-back').click();
		await expect(page.getByTestId('start-game-button')).toBeVisible();
	});
});
