import { expect, test } from '../helpers/page-setup';

test('a KID wildcard (50/50) reduces the visible options to two', async ({ page }) => {
	await page.goto('/pwarush/neonquiz/');
	await page.getByTestId('player-name-input').fill('Ada');
	await page.getByTestId('add-player').click();
	await page.getByTestId('player-name-input').fill('Bob');
	await page.getByTestId('add-player').click();
	await page.getByTestId('start-game').click();
	await page.getByTestId('confirm-transition').click();
	await page.getByTestId('roll-dice').click();
	await page.locator('[data-testid^="move-"]').first().click();
	await expect(page.getByTestId('question-overlay')).toBeVisible();

	await expect(page.locator('[data-testid^="answer-"]')).toHaveCount(4);
	await page.getByTestId('wildcard-5050').click();
	await expect(page.locator('[data-testid^="answer-"]')).toHaveCount(2);
});

test('the Review screen opens from the lobby', async ({ page }) => {
	await page.goto('/pwarush/neonquiz/');
	await page.getByTestId('open-flashcards').click();
	await expect(page.getByTestId('flashcards-screen')).toBeVisible();
});
