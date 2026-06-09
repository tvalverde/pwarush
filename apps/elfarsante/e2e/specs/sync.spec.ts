import { expect, test } from '../helpers/page-setup';

/*
  Differential sync driven entirely by the in-memory Firebase fake
  (src/firebase.e2e.ts), active under VITE_E2E. The fake exposes
  window.__e2eFirestore for direct seeding/reading and auths a single user with
  uid 'e2e-user'.
*/
type FakeFirestore = {
	seed: (path: string, data: Record<string, unknown>) => void;
	read: (path: string) => Record<string, unknown> | undefined;
};

declare global {
	interface Window {
		__e2eFirestore?: FakeFirestore;
	}
}

test.describe('Cloud sync', () => {
	test('shows a sync code and approves an incoming link request', async ({ page, seedAndGoto }) => {
		await seedAndGoto();

		// Open the menu and enter the sync view.
		await page.getByRole('button', { name: 'menu' }).click();
		const menu = page.getByRole('dialog');
		await menu.getByRole('button', { name: 'Sincronización en la Nube' }).click();

		// A sync code is generated and rendered (the fake stores it under
		// sync_codes/<CODE> with uid 'e2e-user'). The placeholder '...' is
		// replaced once the code resolves.
		await expect(menu.getByText('Tu código en este dispositivo:')).toBeVisible();
		const codeLocator = menu.locator('.font-h1', { hasText: /-/ });
		await expect(codeLocator).toBeVisible();

		// Seed a pending link request targeting the active uid.
		await page.evaluate(() => {
			window.__e2eFirestore?.seed('link_requests/req_test', {
				targetUid: 'e2e-user',
				requesterSessionId: 'spec',
				status: 'pending',
				createdAt: new Date().toISOString(),
			});
		});

		// The global approval modal appears (rendered by App.tsx).
		const approvalModal = page.getByRole('dialog').filter({ hasText: 'NUEVA VINCULACIÓN' });
		await expect(approvalModal).toBeVisible();

		// Approve the request.
		await approvalModal.getByRole('button', { name: 'PERMITIR ACCESO' }).click();

		// The fake now reflects the approved status.
		await expect
			.poll(() =>
				page.evaluate(() => window.__e2eFirestore?.read('link_requests/req_test')?.status),
			)
			.toBe('approved');
	});
});
