import { buildHistoryEntries } from '../fixtures/history';
import { expect, test } from '../helpers/page-setup';

test.describe('Trophies screen with populated history', () => {
	test('all filter renders every entry sorted by score', async ({ page, seedAndGoto }) => {
		const history = buildHistoryEntries(5, { startScore: 6000, scoreStep: 250 });
		await seedAndGoto('/sudokupado/', { history });
		await page.getByTestId('nav-trophies').click();

		const entries = page.locator('article');
		await expect(entries).toHaveCount(5);
		const firstScore = await entries
			.first()
			.locator('span.font-hanken.text-2xl')
			.first()
			.textContent();
		expect(firstScore).toContain('6000');
	});

	test('filtering by beginner hides other difficulties', async ({ page, seedAndGoto }) => {
		const beginnerEntries = buildHistoryEntries(2, {
			difficulty: 'beginner',
			startScore: 4000,
		});
		const expertEntries = buildHistoryEntries(2, {
			difficulty: 'expert',
			startScore: 3000,
			startTimestamp: 1_700_500_000_000,
		});
		await seedAndGoto('/sudokupado/', { history: [...beginnerEntries, ...expertEntries] });

		await page.getByTestId('nav-trophies').click();
		await expect(page.locator('article')).toHaveCount(4);

		await page.getByRole('button', { name: /^beginner$/i }).click();
		await expect(page.locator('article')).toHaveCount(2);
	});

	test('show-all toggle reveals entries beyond the first 50', async ({ page, seedAndGoto }) => {
		const history = buildHistoryEntries(55, { startScore: 8000, scoreStep: 50 });
		await seedAndGoto('/sudokupado/', { history });
		await page.getByTestId('nav-trophies').click();

		await expect(page.locator('article')).toHaveCount(50);
		await page.getByRole('button', { name: /show all history/i }).click();
		await expect(page.locator('article')).toHaveCount(55);
	});
});
