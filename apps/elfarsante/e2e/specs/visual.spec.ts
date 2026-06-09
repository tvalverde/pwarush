import { expect, test } from '../helpers/page-setup';
import { buildGameState } from '../helpers/seed';

/*
  Visual regression snapshots of the key screens. Baselines are generated later
  in the container; here we only declare the assertions and their names.
  Active mid-game phases boot into RESTORE_PROMPT, so we resume them via
  "CONTINUAR PARTIDA"; PUNTUACIONES hydrates directly.
*/
test.describe('Visual regression', () => {
	test('home empty', async ({ page, seedAndGoto }) => {
		await seedAndGoto();
		await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible();
		await expect(page).toHaveScreenshot('home-empty.png', { fullPage: true });
	});

	test('home with players', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/elfarsante/', {
			draftPlayers: ['Ana', 'Bruno', 'Carla'],
		});
		await expect(page.getByPlaceholder('Nombre (máx. 15)').first()).toHaveValue('Ana');
		await expect(page).toHaveScreenshot('home-with-players.png', { fullPage: true });
	});

	test('reparto initial', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/elfarsante/', {
			gameState: buildGameState({ currentPhase: 'REPARTO' }),
		});
		await page.getByRole('button', { name: 'CONTINUAR PARTIDA' }).click();
		await expect(page.getByText('Turno de')).toBeVisible();
		await expect(page).toHaveScreenshot('reparto-initial.png', { fullPage: true });
	});

	test('votacion', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/elfarsante/', {
			gameState: buildGameState({ currentPhase: 'VOTACION' }),
		});
		await page.getByRole('button', { name: 'CONTINUAR PARTIDA' }).click();
		await expect(page.getByRole('heading', { name: '¿Quién es el Farsante?' })).toBeVisible();
		await expect(page).toHaveScreenshot('votacion.png', { fullPage: true });
	});

	test('puntuaciones', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/elfarsante/', {
			gameState: buildGameState({ currentPhase: 'PUNTUACIONES' }),
		});
		await expect(page.getByRole('heading', { name: /PUNTUACIONES|CAMPEÓN/i })).toBeVisible();
		await expect(page).toHaveScreenshot('puntuaciones.png', { fullPage: true });
	});
});
