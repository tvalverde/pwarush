import { expect, test } from '../helpers/page-setup';

test('the Hall of Fame opens from the lobby', async ({ page }) => {
	await page.goto('/pwarush/neonquiz/');
	await page.getByTestId('open-history').click();
	await expect(page.getByTestId('history-screen')).toBeVisible();
});

test('settings expose the vibration toggle', async ({ page }) => {
	await page.goto('/pwarush/neonquiz/');
	await page.getByTestId('open-settings').click();
	await expect(page.getByTestId('toggle-haptics')).toBeVisible();
});
