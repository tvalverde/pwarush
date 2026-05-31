import { expect, test } from '../helpers/page-setup';

test.describe('Settings: preferences persistence', () => {
	test('changing max mistakes persists across reloads', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('max-mistakes-5').click();
		await expect(page.getByTestId('max-mistakes-5')).toHaveClass(/bg-primary-text/);

		await page.reload();
		await expect(page.getByTestId('max-mistakes-5')).toHaveClass(/bg-primary-text/);
	});

	test('selecting infinite mistakes mode persists', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('max-mistakes--1').click();
		await expect(page.getByTestId('max-mistakes--1')).toHaveClass(/bg-primary-text/);

		await page.reload();
		await expect(page.getByTestId('max-mistakes--1')).toHaveClass(/bg-primary-text/);
	});

	test('changing max hints to zero persists', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await page.getByTestId('max-hints-0').click();
		await expect(page.getByTestId('max-hints-0')).toHaveClass(/bg-primary-text/);

		await page.reload();
		await expect(page.getByTestId('max-hints-0')).toHaveClass(/bg-primary-text/);
	});
});
