import { expect, test } from '../helpers/page-setup';

test.describe('PWA basics', () => {
	test('document declares the PWA meta tags', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
		expect(themeColor).toBe('#ffffff');
		const appleTitle = await page
			.locator('meta[name="apple-mobile-web-app-title"]')
			.getAttribute('content');
		expect(appleTitle).toBe('Sudokupado');
		const appleCapable = await page
			.locator('meta[name="apple-mobile-web-app-capable"]')
			.getAttribute('content');
		expect(appleCapable).toBe('yes');
	});

	test('document layout uses 100svh for viewport sizing', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		const hasSvh = await page.evaluate(() => {
			const layoutEl = document.querySelector('[class*="100svh"], [class*="h-svh"]');
			if (layoutEl) return true;
			const body = document.body;
			const styles = window.getComputedStyle(body);
			return styles.minHeight.includes('vh') || styles.height.includes('vh');
		});
		expect(hasSvh).toBe(true);
	});
});
