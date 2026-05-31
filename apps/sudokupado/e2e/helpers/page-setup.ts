import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base } from '@playwright/test';
import { type SeedOptions, seedAndNavigate } from './seed';

const helpersDir = dirname(fileURLToPath(import.meta.url));
const animationsCss = readFileSync(resolve(helpersDir, 'disable-animations.css'), 'utf8');

export interface SudokupadoFixtures {
	seedAndGoto: (path?: string, seedOptions?: SeedOptions) => Promise<void>;
}

export const test = base.extend<SudokupadoFixtures>({
	seedAndGoto: async ({ page }, use) => {
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

		const visit = async (path = '/pwarush/sudokupado/', seedOptions: SeedOptions = {}) => {
			await seedAndNavigate(page, path, seedOptions);
			await page.addStyleTag({ content: animationsCss });
		};
		await use(visit);
	},
});

export { expect } from '@playwright/test';
