import type { Page } from '@playwright/test';
import { buildHistoryEntries } from '../fixtures/history';
import { nearWinPuzzle } from '../fixtures/puzzles';
import { expect, test } from '../helpers/page-setup';

const emptyNotes = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

const seededGameState = {
	grid: nearWinPuzzle.initialGrid,
	initialGrid: nearWinPuzzle.initialGrid,
	solution: nearWinPuzzle.solution,
	notes: emptyNotes(),
	timeElapsed: 0,
	mistakes: 0,
	hintsUsed: 0,
	isPaused: false,
	difficulty: 'beginner' as const,
};

const installResultScreen = async (page: Page) => {
	await page.waitForFunction(() =>
		Boolean((window as unknown as { __useGameStore?: unknown }).__useGameStore),
	);
	await page.evaluate(() => {
		(
			window as unknown as { __useGameStore: { setState: (p: Record<string, unknown>) => void } }
		).__useGameStore.setState({
			activeScreen: 'result',
			lastGameResult: {
				score: 4800,
				timeElapsed: 125,
				mistakes: 1,
				hintsUsed: 2,
				difficulty: 'beginner',
			},
			selectedDifficulty: 'beginner',
		});
	});
};

test.describe('Visual regression', () => {
	test('main menu without saved game', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await expect(page.getByTestId('start-game-button')).toBeVisible();
		await expect(page).toHaveScreenshot('main-menu-empty.png', { fullPage: true });
	});

	test('main menu with saved game card', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', { gameState: seededGameState });
		await expect(page.getByTestId('resume-saved-game')).toBeVisible();
		await expect(page).toHaveScreenshot('main-menu-with-saved-game.png', { fullPage: true });
	});

	test('game screen with seeded puzzle', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', { gameState: seededGameState });
		await page.getByTestId('resume-saved-game').click();
		await expect(page.getByTestId('cell-0-0')).toBeVisible();
		await expect(page).toHaveScreenshot('game-screen-seeded.png', { fullPage: true });
	});

	test('settings dialog', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('open-settings').click();
		await expect(page.getByRole('heading', { name: /^settings$/i })).toBeVisible();
		await expect(page).toHaveScreenshot('settings-dialog.png', { fullPage: true });
	});

	test('clear-all-data danger dialog', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('open-settings').click();
		await page.getByRole('button', { name: /clear all data/i }).click();
		// Clip to the dialog itself: the settings screen behind the overlay can
		// sit at a non-deterministic scroll position, which is irrelevant here.
		const dialog = page.getByTestId('confirm-dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog).toHaveScreenshot('confirm-danger-dialog.png');
	});

	test('player menu', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('open-player-menu').click();
		await expect(page.getByTestId('player-create-button')).toBeVisible();
		await expect(page).toHaveScreenshot('player-menu.png', { fullPage: true });
	});

	test('rules screen', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('nav-rules').click();
		await expect(page.getByRole('heading', { name: /^rules$/i })).toBeVisible();
		await expect(page).toHaveScreenshot('rules-screen.png', { fullPage: true });
	});

	test('trophies screen with populated history', async ({ page, seedAndGoto }) => {
		const history = buildHistoryEntries(5, { startScore: 6000, scoreStep: 250 });
		await seedAndGoto('/pwarush/sudokupado/', { history });
		await page.getByTestId('nav-trophies').click();
		await expect(page.locator('article').first()).toBeVisible();
		await expect(page).toHaveScreenshot('trophies-populated.png', { fullPage: true });
	});

	test('result screen', async ({ page, seedAndGoto }) => {
		const history = buildHistoryEntries(5, {
			difficulty: 'beginner',
			startScore: 4800,
			scoreStep: 100,
		});
		await seedAndGoto('/pwarush/sudokupado/', { history });
		await installResultScreen(page);
		await expect(page.getByRole('heading', { name: /victory/i })).toBeVisible();
		await expect(page).toHaveScreenshot('result-screen.png', { fullPage: true });
	});
});
