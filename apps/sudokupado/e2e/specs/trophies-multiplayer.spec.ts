import { expect, test } from '../helpers/page-setup';

const entryFor = (playerId: number, score: number, date: number) => ({
	playerId,
	difficulty: 'beginner' as const,
	score,
	timeElapsed: 100,
	mistakes: 0,
	hintsUsed: 0,
	date,
});

test.describe('Trophies screen with multiple players', () => {
	test('renders entries from every player with their own name', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			extraPlayers: [
				{ id: 2, name: 'Alice', createdAt: 1_700_000_000_000, isDeleted: 0 },
				{ id: 3, name: 'Bob', createdAt: 1_700_100_000_000, isDeleted: 0 },
			],
		});

		await page.evaluate(async () => {
			const db = (
				window as unknown as {
					__db: { history: { bulkAdd: (rows: unknown[]) => Promise<unknown> } };
				}
			).__db;
			await db.history.bulkAdd([
				{
					playerId: 1,
					difficulty: 'beginner',
					score: 6000,
					timeElapsed: 100,
					mistakes: 0,
					hintsUsed: 0,
					date: 1_700_000_000_000,
				},
				{
					playerId: 1,
					difficulty: 'beginner',
					score: 5500,
					timeElapsed: 120,
					mistakes: 1,
					hintsUsed: 0,
					date: 1_700_100_000_000,
				},
				{
					playerId: 2,
					difficulty: 'beginner',
					score: 5000,
					timeElapsed: 140,
					mistakes: 0,
					hintsUsed: 1,
					date: 1_700_200_000_000,
				},
				{
					playerId: 2,
					difficulty: 'beginner',
					score: 4500,
					timeElapsed: 160,
					mistakes: 2,
					hintsUsed: 0,
					date: 1_700_300_000_000,
				},
				{
					playerId: 3,
					difficulty: 'beginner',
					score: 4000,
					timeElapsed: 180,
					mistakes: 1,
					hintsUsed: 1,
					date: 1_700_400_000_000,
				},
				{
					playerId: 3,
					difficulty: 'beginner',
					score: 3500,
					timeElapsed: 200,
					mistakes: 0,
					hintsUsed: 0,
					date: 1_700_500_000_000,
				},
			]);
		});

		await page.getByTestId('nav-trophies').click();
		await expect(page.locator('article')).toHaveCount(6);
		await expect(page.getByText('Guest E2E').first()).toBeVisible();
		await expect(page.getByText('Alice').first()).toBeVisible();
		await expect(page.getByText('Bob').first()).toBeVisible();
	});
});
