import { expect, test } from '../helpers/page-setup';

/*
  Full human flow with NO seeding: HOME -> REPARTO -> DEBATE -> VOTACION ->
  RESULTADO -> PUNTUACIONES. Texts come from the default 'es' locale.
*/
test.describe('Golden path: full round', () => {
	test('plays a complete round from home to scores', async ({ page, seedAndGoto }) => {
		await seedAndGoto();

		// HOME: title and core controls render.
		await expect(page.getByRole('heading', { name: 'EL FARSANTE' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Jugadores' })).toBeVisible();

		// Add three players. The list starts empty, so each click appends an input.
		const addPlayer = page.getByRole('button', { name: 'Añadir jugador' });
		for (let i = 0; i < 3; i++) {
			await addPlayer.click();
		}
		const inputs = page.getByPlaceholder('Nombre (máx. 15)');
		await expect(inputs).toHaveCount(3);
		await inputs.nth(0).fill('Ana');
		await inputs.nth(1).fill('Bruno');
		await inputs.nth(2).fill('Carla');

		// 'Animales' category is selected by default; start the game.
		await page.getByRole('button', { name: '¡JUGAR!' }).click();

		// REPARTO: pass-the-phone role reveal, one step per player.
		await expect(page.getByText('Turno de')).toBeVisible();
		// First two players advance with "Siguiente Jugador".
		await page.getByRole('button', { name: 'Siguiente Jugador' }).click();
		await page.getByRole('button', { name: 'Siguiente Jugador' }).click();
		// Last player moves to the debate.
		await page.getByRole('button', { name: 'Empezar Debate' }).click();

		// DEBATE: the timer is running; end it via the accuse control instead of
		// waiting real minutes.
		const accuse = page.getByRole('button', { name: /DETENER Y ACUSAR/i });
		await expect(accuse).toBeVisible();
		await accuse.click();

		// VOTACION: pick the first suspect.
		await expect(page.getByRole('heading', { name: '¿Quién es el Farsante?' })).toBeVisible();
		await page.getByRole('button', { name: 'Ana' }).click();

		// RESULTADO: the screen shows "Analizando..." for ~3s before the verdict.
		await expect(page.getByRole('heading', { name: 'Analizando...' })).toBeVisible();
		// Whatever the verdict, a continuation control leads to PUNTUACIONES.
		const proceed = page
			.getByRole('button', { name: /Ver Puntuaciones|Continuar|HA ADIVINADO|HA FALLADO/i })
			.first();
		await expect(proceed).toBeVisible({ timeout: 10_000 });
		await proceed.click();

		// If the accused was innocent and the game is not over, the app returns to
		// DEBATE; force the round to completion through another accusation.
		if (await page.getByRole('button', { name: /DETENER Y ACUSAR/i }).isVisible()) {
			await page.getByRole('button', { name: /DETENER Y ACUSAR/i }).click();
			await page.getByRole('button', { name: 'Ana' }).click();
			const proceedAgain = page
				.getByRole('button', { name: /Ver Puntuaciones|Continuar|HA ADIVINADO|HA FALLADO/i })
				.first();
			await expect(proceedAgain).toBeVisible({ timeout: 10_000 });
			await proceedAgain.click();
		}

		// PUNTUACIONES: ranking is shown.
		await expect(page.getByRole('heading', { name: /PUNTUACIONES|CAMPEÓN/i })).toBeVisible({
			timeout: 10_000,
		});
	});
});
