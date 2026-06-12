import { expect, test } from '../helpers/page-setup';

declare global {
	interface Window {
		__fullscreenWhileMenuVisible: boolean | null;
		__sawSuspenseFallback: boolean;
	}
}

test.describe('Regression: starting a game keeps the loading on the menu screen', () => {
	test('fullscreen is requested before leaving the menu and the suspense fallback never replaces it', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto();
		await expect(page.getByTestId('start-game-button')).toBeVisible();

		await page.evaluate(() => {
			window.__fullscreenWhileMenuVisible = null;
			window.__sawSuspenseFallback = false;

			document.addEventListener(
				'fullscreenchange',
				() => {
					if (window.__fullscreenWhileMenuVisible === null) {
						window.__fullscreenWhileMenuVisible =
							document.querySelector('[data-testid="start-game-button"]') !== null &&
							document.querySelector('[data-testid="pause-toggle"]') === null;
					}
				},
				{ once: true },
			);

			const observer = new MutationObserver(() => {
				if (document.querySelector('[data-testid="start-game-button"]')) return;
				if (document.querySelector('[data-testid="pause-toggle"]')) {
					observer.disconnect();
					return;
				}
				window.__sawSuspenseFallback = true;
			});
			observer.observe(document.body, { childList: true, subtree: true });
		});

		await page.getByTestId('difficulty-master').click();
		await page.getByTestId('start-game-button').click();
		await expect(page.getByTestId('pause-toggle')).toBeVisible({ timeout: 60_000 });

		expect(await page.evaluate(() => window.__fullscreenWhileMenuVisible)).toBe(true);
		expect(await page.evaluate(() => window.__sawSuspenseFallback)).toBe(false);
		expect(await page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
	});
});
