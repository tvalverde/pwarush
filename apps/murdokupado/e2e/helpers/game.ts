import type { Page } from '@playwright/test';

const APP_BASE = '/pwarush/murdokupado/';

const ANIMATIONS_OFF =
	'*, *::before, *::after { transition: none !important; animation: none !important; }';

export interface ActiveCaseInfo {
	people: { id: string; name: string }[];
	solution: Record<string, { r: number; c: number }>;
	murdererId: string;
	victimId: string;
}

/**
 * Opens the app with animations and reduced-motion forced off (stable visual
 * snapshots). A numeric `seed` forces a deterministic generated case.
 */
export async function open(page: Page, opts: { seed?: number } = {}): Promise<void> {
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
	const query = opts.seed !== undefined ? `?seed=${opts.seed}` : '';
	await page.goto(`${APP_BASE}${query}`);
	await page.addStyleTag({ content: ANIMATIONS_OFF });
}

export async function startCase(page: Page, difficulty = 'beginner'): Promise<void> {
	await page.getByTestId(`difficulty-${difficulty}`).click();
	await page.getByTestId('start-game-button').click();
	await page.getByTestId('case-board').waitFor();
}

export async function readActiveCase(page: Page): Promise<ActiveCaseInfo> {
	return page.evaluate(() => {
		const store = (
			window as unknown as {
				__useGameStore: { getState: () => { activeCase: ActiveCaseInfo } };
			}
		).__useGameStore;
		const { activeCase } = store.getState();
		return {
			people: activeCase.people,
			solution: activeCase.solution,
			murdererId: activeCase.murdererId,
			victimId: activeCase.victimId,
		};
	});
}

/**
 * Taps each suspect onto their solution cell. `leaveOut` keeps the last N
 * suspects in the tray (use 1 for a stable mid-game board snapshot, 0 to win).
 */
export async function placeSolution(page: Page, info: ActiveCaseInfo, leaveOut = 0): Promise<void> {
	const count = info.people.length - leaveOut;
	for (let i = 0; i < count; i++) {
		const person = info.people[i];
		const cell = info.solution[person.id];
		await page.getByTestId(`suspect-${person.id}`).click();
		await page.getByTestId(`cell-${cell.r}-${cell.c}`).click();
	}
}
