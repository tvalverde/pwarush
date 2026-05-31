import { expect, test } from '../helpers/page-setup';

const readActiveScreen = (page: import('@playwright/test').Page) =>
	page.evaluate(() => {
		const store = (
			window as unknown as {
				__useGameStore: { getState: () => { activeScreen: string } };
			}
		).__useGameStore;
		return store.getState().activeScreen;
	});

test.describe('BottomNavBar navigation', () => {
	test('moves between main, trophies and rules in both directions', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto();
		expect(await readActiveScreen(page)).toBe('main');

		await page.getByTestId('nav-trophies').click();
		await expect(page.getByRole('heading', { name: /trophy history/i })).toBeVisible();
		expect(await readActiveScreen(page)).toBe('trophies');

		await page.getByTestId('nav-rules').click();
		await expect(page.getByRole('heading', { name: /^rules$/i })).toBeVisible();
		expect(await readActiveScreen(page)).toBe('rules');

		await page.getByTestId('nav-main').click();
		await expect(page.getByTestId('start-game-button')).toBeVisible();
		expect(await readActiveScreen(page)).toBe('main');
	});

	test('the active nav item receives the highlight color', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('nav-trophies').click();
		await expect(page.getByTestId('nav-trophies')).not.toHaveClass(/text-secondary/);
		await expect(page.getByTestId('nav-main')).toHaveClass(/text-secondary/);
	});
});
