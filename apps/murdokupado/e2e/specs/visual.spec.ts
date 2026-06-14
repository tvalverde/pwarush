import { expect, test } from '@playwright/test';
import { open, placeSolution, readActiveCase, startCase } from '../helpers/game';

test.describe('Visual regression', () => {
	test('main menu', async ({ page }) => {
		await open(page);
		await expect(page.getByTestId('start-game-button')).toBeVisible();
		await expect(page).toHaveScreenshot('menu.png');
	});

	test('board mid-game', async ({ page }) => {
		await open(page, { seed: 1 });
		await startCase(page, 'beginner');
		const info = await readActiveCase(page);
		await placeSolution(page, info, 1);
		await expect(page.getByTestId('case-board')).toHaveScreenshot('board-mid.png');
	});

	test('case-solved overlay', async ({ page }) => {
		await open(page, { seed: 1 });
		await startCase(page, 'beginner');
		const info = await readActiveCase(page);
		await placeSolution(page, info);
		const overlay = page.getByTestId('case-solved-overlay');
		await expect(overlay).toBeVisible();
		await expect(overlay).toHaveScreenshot('case-solved-overlay.png');
	});

	test('result reveal', async ({ page }) => {
		await open(page, { seed: 1 });
		await startCase(page, 'beginner');
		const info = await readActiveCase(page);
		await placeSolution(page, info);
		await page.getByTestId('reveal-continue').click();
		await expect(page.getByTestId('result-screen')).toBeVisible();
		// The elapsed-time value is wall-clock dependent; mask it for stability.
		await expect(page).toHaveScreenshot('result.png', {
			mask: [page.getByTestId('result-time')],
		});
	});
});
