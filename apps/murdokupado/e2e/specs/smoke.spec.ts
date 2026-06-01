import { expect, test } from '@playwright/test';

test('app shell loads', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /MURDOKUSADO/i })).toBeVisible();
});

test('manifest is reachable and valid', async ({ page }) => {
	const response = await page.request.get('/pwarush/murdokusado/manifest.webmanifest');
	expect(response.status()).toBe(200);
	const manifest = await response.json();
	expect(manifest.name).toBe('MURDOKUSADO');
	expect(manifest.scope).toBe('/pwarush/murdokusado/');
	expect(manifest.start_url).toBe('/pwarush/murdokusado/');
});

test('service worker registers with correct scope', async ({ page }) => {
	await page.goto('/');
	const swScope = await page.evaluate(async () => {
		const reg = await navigator.serviceWorker.ready;
		return reg.scope;
	});
	expect(swScope).toContain('/pwarush/murdokusado/');
});
