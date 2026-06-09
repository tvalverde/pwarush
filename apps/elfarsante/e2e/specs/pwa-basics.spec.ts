import { expect, test } from '@playwright/test';

test.describe('PWA basics', () => {
	test('app shell loads', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: /EL FARSANTE/i })).toBeVisible();
	});

	test('document declares the PWA meta tags', async ({ page }) => {
		await page.goto('/');
		const appleCapable = await page
			.locator('meta[name="apple-mobile-web-app-capable"]')
			.getAttribute('content');
		expect(appleCapable).toBe('yes');
	});

	test('manifest is reachable and valid', async ({ page }) => {
		const response = await page.request.get('/pwarush/elfarsante/manifest.webmanifest');
		expect(response.status()).toBe(200);
		const manifest = await response.json();
		expect(manifest.name).toBe('El Farsante');
		expect(manifest.scope).toBe('/pwarush/elfarsante/');
		expect(manifest.start_url).toBe('/pwarush/elfarsante/');
	});

	test('service worker registers with correct scope', async ({ page }) => {
		await page.goto('/');
		const swScope = await page.evaluate(async () => {
			const reg = await navigator.serviceWorker.ready;
			return reg.scope;
		});
		expect(swScope).toContain('/pwarush/elfarsante/');
	});
});
