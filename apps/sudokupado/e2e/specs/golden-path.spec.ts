import type { Difficulty } from '../../src/types';
import { nearWinPuzzle } from '../fixtures/puzzles';
import { expect, test } from '../helpers/page-setup';

const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];

test.describe('Golden path: app shell', () => {
	test('main menu renders title and core controls', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await expect(page.getByRole('heading', { name: 'SUDOKUPADO' })).toBeVisible();
		await expect(page.getByTestId('start-game-button')).toBeVisible();
		for (const diff of difficulties) {
			await expect(page.getByTestId(`difficulty-${diff}`)).toBeVisible();
		}
	});
});

test.describe('Golden path: difficulty selection', () => {
	for (const diff of difficulties) {
		test(`selecting ${diff} difficulty marks it as active`, async ({ page, seedAndGoto }) => {
			await seedAndGoto();
			const button = page.getByTestId(`difficulty-${diff}`);
			await button.click();
			await expect(button).toHaveClass(/bg-primary-text/);
		});
	}
});

test.describe('Golden path: completing a near-finished puzzle', () => {
	test('placing the final cell triggers the victory transition', async ({ page, seedAndGoto }) => {
		const playableGrid = nearWinPuzzle.solution.map((row) => [...row]);
		const lastEmpty = { r: 8, c: 8 };
		playableGrid[lastEmpty.r][lastEmpty.c] = 0;

		const emptyNotes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

		await seedAndGoto('/pwarush/sudokupado/', {
			gameState: {
				grid: playableGrid,
				initialGrid: nearWinPuzzle.initialGrid,
				solution: nearWinPuzzle.solution,
				notes: emptyNotes,
				timeElapsed: 60,
				mistakes: 0,
				hintsUsed: 0,
				isPaused: false,
				difficulty: 'beginner',
			},
		});

		await page.getByTestId('resume-saved-game').click();

		const lastCell = page.getByTestId(`cell-${lastEmpty.r}-${lastEmpty.c}`);
		await expect(lastCell).toBeVisible();
		await lastCell.click();

		const winningValue = nearWinPuzzle.solution[lastEmpty.r][lastEmpty.c];
		await page
			.getByRole('button', { name: String(winningValue), exact: true })
			.first()
			.click();

		await expect
			.poll(
				async () => {
					return await page.evaluate(() => {
						const stored = localStorage.getItem('sudokupado-game-storage');
						return stored;
					});
				},
				{ timeout: 8000 },
			)
			.toBeTruthy();
	});
});
