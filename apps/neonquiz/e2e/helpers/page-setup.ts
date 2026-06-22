import { test as base } from '@playwright/test';

/**
 * Shared neonquiz e2e test fixture. The PWA service worker (vite-plugin-pwa devOptions) raises the
 * "offline ready" update banner at an arbitrary point during a run; that banner overlays the UI and
 * intercepts pointer events. Auto-dismiss it whenever it would block an action so specs stay
 * deterministic. Mirrors the sudokupado/elfarsante e2e setup.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		await page.addLocatorHandler(
			page.locator('.z-100').getByRole('button', { name: 'CERRAR' }),
			async (closeButton) => {
				await closeButton.click();
			},
		);
		await use(page);
	},
});

export { expect } from '@playwright/test';
