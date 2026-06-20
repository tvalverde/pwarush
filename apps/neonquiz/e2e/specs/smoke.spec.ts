import { expect, test } from '@playwright/test';

test('app shell loads', async ({ page }) => {
	await page.goto('/pwarush/neonquiz/');
	await expect(page.getByRole('heading', { name: /NEON QUIZ/i })).toBeVisible();
});

test('manifest is reachable and valid', async ({ page }) => {
	const response = await page.request.get('/pwarush/neonquiz/manifest.webmanifest');
	expect(response.status()).toBe(200);
	const manifest = await response.json();
	expect(manifest.name).toBe('NEON QUIZ');
	expect(manifest.scope).toBe('/pwarush/neonquiz/');
	expect(manifest.start_url).toBe('/pwarush/neonquiz/');
});

test('service worker registers with correct scope', async ({ page }) => {
	await page.goto('/pwarush/neonquiz/');
	const swScope = await page.evaluate(async () => {
		const reg = await navigator.serviceWorker.ready;
		return reg.scope;
	});
	expect(swScope).toContain('/pwarush/neonquiz/');
});
