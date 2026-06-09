import { expect, test } from '../helpers/page-setup';
import { buildGameState } from '../helpers/seed';

/*
  A seeded mid-game phase (anything other than HOME / PUNTUACIONES /
  RESTORE_PROMPT) is promoted to RESTORE_PROMPT by initGameState on cold boot.
  The user then chooses to resume the seeded phase or discard back to HOME.
*/
test.describe('Restore prompt', () => {
	test('mid-game seed boots into the restore prompt', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/elfarsante/', {
			gameState: buildGameState({ currentPhase: 'DEBATE' }),
		});

		await expect(page.getByRole('heading', { name: 'Partida en Curso' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'CONTINUAR PARTIDA' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'NUEVA PARTIDA' })).toBeVisible();
	});

	test('restore resumes the seeded phase', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/elfarsante/', {
			gameState: buildGameState({ currentPhase: 'DEBATE' }),
		});

		await page.getByRole('button', { name: 'CONTINUAR PARTIDA' }).click();

		// The seeded phase was DEBATE: its hallmark accuse control is shown.
		await expect(page.getByRole('button', { name: /DETENER Y ACUSAR/i })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Partida en Curso' })).toBeHidden();
	});

	test('discard returns to home', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/elfarsante/', {
			gameState: buildGameState({ currentPhase: 'VOTACION' }),
		});

		await page.getByRole('button', { name: 'NUEVA PARTIDA' }).click();

		await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Partida en Curso' })).toBeHidden();
	});

	/*
		Regression: once the user has discarded back to HOME, backgrounding and
		foregrounding the tab must NOT bounce the app into RESTORE_PROMPT. The
		visibilitychange handler in App.tsx only re-prompts for ACTIVE phases
		(HOME / PUNTUACIONES / RESTORE_PROMPT are excluded), so HOME stays put.
	*/
	test('home does not bounce to restore prompt on visibility hidden -> visible', async ({
		page,
		seedAndGoto,
	}) => {
		await seedAndGoto('/pwarush/elfarsante/', {
			gameState: buildGameState({ currentPhase: 'DEBATE' }),
		});

		await page.getByRole('button', { name: 'NUEVA PARTIDA' }).click();
		await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible();

		await simulateVisibility(page, 'hidden');
		await simulateVisibility(page, 'visible');

		// Still on HOME, no restore prompt.
		await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Partida en Curso' })).toBeHidden();
	});
});

async function simulateVisibility(
	page: import('@playwright/test').Page,
	visibilityState: 'hidden' | 'visible',
): Promise<void> {
	await page.evaluate((value) => {
		Object.defineProperty(document, 'visibilityState', {
			configurable: true,
			get: () => value,
		});
		document.dispatchEvent(new Event('visibilitychange'));
	}, visibilityState);
}
