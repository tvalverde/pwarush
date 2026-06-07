import { buildHistoryEntries } from '../fixtures/history';
import { expect, test } from '../helpers/page-setup';

interface SeedResultPayload {
	score: number;
	timeElapsed: number;
	mistakes: number;
	hintsUsed: number;
	difficulty: 'beginner' | 'intermediate' | 'expert' | 'master';
}

const installResultScreen = async (
	page: import('@playwright/test').Page,
	payload: SeedResultPayload,
) => {
	await page.waitForFunction(() =>
		Boolean((window as unknown as { __useGameStore?: unknown }).__useGameStore),
	);
	await page.evaluate((result) => {
		const store = (
			window as unknown as {
				__useGameStore: {
					setState: (partial: Record<string, unknown>) => void;
				};
			}
		).__useGameStore;
		store.setState({
			activeScreen: 'result',
			lastGameResult: result,
			selectedDifficulty: result.difficulty,
		});
	}, payload);
};

test.describe('Result screen', () => {
	test('renders the score summary and the top 5 leaderboard', async ({ page, seedAndGoto }) => {
		const history = buildHistoryEntries(5, {
			difficulty: 'beginner',
			startScore: 4800,
			scoreStep: 100,
		});
		await seedAndGoto('/pwarush/sudokupado/', { history });
		await installResultScreen(page, {
			score: 4800,
			timeElapsed: 125,
			mistakes: 1,
			hintsUsed: 2,
			difficulty: 'beginner',
		});

		await expect(page.getByRole('heading', { name: /victory/i })).toBeVisible();
		await expect(page.getByText('4800').first()).toBeVisible();
		await expect(
			page.locator('.bg-surface-container-lowest.border.border-outline-variant').first(),
		).toBeVisible();
		const leaderboardRows = page.locator(
			'section.flex.flex-col.gap-4 .flex.items-center.justify-between.p-4',
		);
		await expect(leaderboardRows).toHaveCount(5);
	});

	test('return home button navigates back to main menu', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			history: buildHistoryEntries(1, { difficulty: 'beginner' }),
		});
		await installResultScreen(page, {
			score: 3500,
			timeElapsed: 200,
			mistakes: 0,
			hintsUsed: 0,
			difficulty: 'beginner',
		});

		await page.getByTestId('result-return-home').click();
		await expect(page.getByTestId('start-game-button')).toBeVisible();
	});

	test('leaderboard button navigates to trophies', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			history: buildHistoryEntries(1, { difficulty: 'beginner' }),
		});
		await installResultScreen(page, {
			score: 3500,
			timeElapsed: 200,
			mistakes: 0,
			hintsUsed: 0,
			difficulty: 'beginner',
		});

		await page.getByTestId('result-leaderboard').click();
		await expect(page.getByRole('heading', { name: /trophy history/i })).toBeVisible();
	});

	test('new game button transitions back to the game screen', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			history: buildHistoryEntries(1, { difficulty: 'beginner' }),
		});
		await installResultScreen(page, {
			score: 3500,
			timeElapsed: 200,
			mistakes: 0,
			hintsUsed: 0,
			difficulty: 'beginner',
		});

		await page.getByTestId('result-new-game').click();
		await expect
			.poll(
				async () =>
					page.evaluate(() => {
						const store = (
							window as unknown as {
								__useGameStore: { getState: () => { activeScreen: string } };
							}
						).__useGameStore;
						return store.getState().activeScreen;
					}),
				{ timeout: 15_000 },
			)
			.toBe('game');
	});
});
