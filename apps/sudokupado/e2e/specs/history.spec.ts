import { expect, test } from '../helpers/page-setup';

test.describe('History / Trophies screen', () => {
	test('navigating to trophies shows the empty state when no games exist', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto();
		await page
			.getByRole('button')
			.filter({ has: page.locator('svg.lucide-trophy') })
			.click();
		await expect(page.getByRole('heading', { name: /trophy history/i })).toBeVisible();
	});
});
