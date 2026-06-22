import { expect, test } from '../helpers/page-setup';

test('an ADULT player reads, reveals and self-grades the question', async ({ page }) => {
	await page.goto('/pwarush/neonquiz/');

	// Add an ADULT player and a second player.
	await page.getByTestId('player-name-input').fill('Ada');
	await page.getByTestId('level-ADULT').click();
	await page.getByTestId('add-player').click();
	await page.getByTestId('player-name-input').fill('Bob');
	await page.getByTestId('add-player').click();
	await page.getByTestId('start-game').click();

	await page.getByTestId('confirm-transition').click();
	await page.getByTestId('roll-dice').click();
	await page.locator('[data-testid^="move-"]').first().click();

	// ADULT flow: open-answer with a reveal, then self-grade.
	await expect(page.getByTestId('adult-question-overlay')).toBeVisible();
	await expect(page.getByTestId('adult-reveal')).toBeVisible();
	await page.getByTestId('adult-reveal').click();
	await expect(page.getByTestId('adult-correct')).toBeVisible();
	await page.getByTestId('adult-correct').click();
	await expect(page.getByTestId('continue-feedback')).toBeVisible();
});
