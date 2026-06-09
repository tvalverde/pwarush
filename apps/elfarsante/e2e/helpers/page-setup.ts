import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base } from '@playwright/test';
import { buildSeedScript, type SeedOptions } from './seed';

const helpersDir = dirname(fileURLToPath(import.meta.url));
const animationsCss = readFileSync(resolve(helpersDir, 'disable-animations.css'), 'utf8');

const BASE_PATH = '/pwarush/elfarsante/';

export interface ElFarsanteFixtures {
	seedAndGoto: (path?: string, seedOptions?: SeedOptions) => Promise<void>;
}

export const test = base.extend<ElFarsanteFixtures>({
	seedAndGoto: async ({ page }, use) => {
		// The service worker (devOptions) raises the offline-ready toast at an
		// arbitrary point of the test; dismiss it whenever it blocks an action.
		await page.addLocatorHandler(
			page.locator('.fixed').filter({ hasText: 'SISTEMA PWA' }).getByRole('button', {
				name: 'CERRAR',
			}),
			async (closeButton) => {
				await closeButton.click();
			},
		);

		// Force reduced-motion so Framer Motion settles deterministically.
		await page.addInitScript(() => {
			Object.defineProperty(window, 'matchMedia', {
				configurable: true,
				value: (query: string) => ({
					matches: query.includes('prefers-reduced-motion'),
					media: query,
					onchange: null,
					addListener: () => {},
					removeListener: () => {},
					addEventListener: () => {},
					removeEventListener: () => {},
					dispatchEvent: () => false,
				}),
			});
		});

		const visit = async (path = BASE_PATH, seedOptions: SeedOptions = {}) => {
			// Seed localStorage before the SPA boots so the providers hydrate from it.
			// Default the language to 'es': specs assert Spanish texts, while the
			// container browser would otherwise resolve to navigator.language (en).
			await page.addInitScript(buildSeedScript({ lang: 'es', ...seedOptions }));
			await page.goto(path);
			await page.addStyleTag({ content: animationsCss });
		};
		await use(visit);
	},
});

export { expect } from '@playwright/test';
