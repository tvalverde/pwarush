import { expect, test } from '../helpers/page-setup';

test('lobby to first answered question (pass-and-play loop)', async ({ page }) => {
	await page.goto('/pwarush/neonquiz/');

	// Build a two-player roster.
	await page.getByTestId('player-name-input').fill('Ada');
	await page.getByTestId('add-player').click();
	await page.getByTestId('player-name-input').fill('Bob');
	await page.getByTestId('add-player').click();
	await expect(page.getByTestId('player-row-1')).toBeVisible();

	// Start the game and clear the anti-cheat transition screen.
	await page.getByTestId('start-game').click();
	await expect(page.getByTestId('turn-transition')).toBeVisible();
	await page.getByTestId('confirm-transition').click();

	// Roll and take the first legal move; landing opens a KID question.
	await page.getByTestId('roll-dice').click();
	await page.locator('[data-testid^="move-"]').first().click();
	await expect(page.getByTestId('question-overlay')).toBeVisible();

	// Answer correctly (read the index from the store) so the loop continues.
	const correctIndex = await page.evaluate(() => {
		const store = (window as unknown as { __useGameStore: any }).__useGameStore;
		return store.getState().activeQuestion.correctAnswerIndex as number;
	});
	await page.getByTestId(`answer-${correctIndex}`).click();
	await expect(page.getByTestId('continue-feedback')).toBeVisible();
});
