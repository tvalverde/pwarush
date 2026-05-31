import { buildHistoryEntries } from '../fixtures/history';
import { expect, test } from '../helpers/page-setup';

const readActivePlayerId = (page: import('@playwright/test').Page) =>
	page.evaluate(() => {
		const store = (
			window as unknown as {
				__useGameStore: { getState: () => { activePlayerId: number | null } };
			}
		).__useGameStore;
		return store.getState().activePlayerId;
	});

const readDbCounts = (page: import('@playwright/test').Page, playerId: number) =>
	page.evaluate(async (id) => {
		const db = (
			window as unknown as {
				__db: {
					players: { get: (id: number) => Promise<{ isDeleted: number } | undefined> };
					preferences: {
						where: (k: string) => { equals: (v: number) => { count: () => Promise<number> } };
					};
					history: {
						where: (k: string) => { equals: (v: number) => { count: () => Promise<number> } };
					};
					gameState: {
						where: (k: string) => { equals: (v: number) => { count: () => Promise<number> } };
					};
				};
			}
		).__db;
		const player = await db.players.get(id);
		return {
			isDeleted: player?.isDeleted ?? null,
			prefsCount: await db.preferences.where('playerId').equals(id).count(),
			historyCount: await db.history.where('playerId').equals(id).count(),
			gameStateCount: await db.gameState.where('playerId').equals(id).count(),
		};
	}, playerId);

test.describe('Player menu', () => {
	test('creating a player sets it as active', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			zustand: { activePlayerId: null },
			skipPlayer: true,
		});
		expect(await readActivePlayerId(page)).toBeNull();

		await page.getByTestId('open-player-menu').click();
		await page.getByTestId('player-create-button').click();
		const nameInput = page.getByTestId('player-name-input');
		await nameInput.fill('Alice');
		await expect(nameInput).toHaveValue('Alice');
		await page.getByTestId('player-create-confirm').click();

		await expect.poll(() => readActivePlayerId(page), { timeout: 10_000 }).toBeGreaterThan(0);
	});

	test('switching to guest clears the active player id', async ({ page, seedAndGoto }) => {
		await seedAndGoto('/pwarush/sudokupado/', {
			extraPlayers: [{ id: 2, name: 'Alice', createdAt: 1_700_000_000_000, isDeleted: 0 }],
		});
		await page.getByTestId('open-player-menu').click();
		await page.getByTestId('player-switch-guest').click();
		await expect.poll(() => readActivePlayerId(page)).toBeNull();
	});

	test('deleting a player cascades to preferences, history and gameState', async ({
		page,
		seedAndGoto,
	}) => {
		const bobId = 3;
		await seedAndGoto('/pwarush/sudokupado/', {
			extraPlayers: [{ id: bobId, name: 'Bob', createdAt: 1_700_000_000_000, isDeleted: 0 }],
			extraPreferences: [
				{
					playerId: bobId,
					difficulty: 'beginner',
					allowNotes: true,
					maxMistakes: 3,
					maxHints: 3,
				},
			],
			history: buildHistoryEntries(3, { difficulty: 'beginner' }).map((entry) => ({
				...entry,
			})),
		});

		await page.evaluate(
			async ({ id, entries }) => {
				const db = (
					window as unknown as {
						__db: {
							history: { bulkAdd: (rows: unknown[]) => Promise<unknown> };
						};
					}
				).__db;
				await db.history.bulkAdd(
					entries.map((e) => ({
						...e,
						playerId: id,
					})),
				);
			},
			{
				id: bobId,
				entries: buildHistoryEntries(3, {
					difficulty: 'expert',
					startScore: 1000,
					startTimestamp: 1_700_500_000_000,
				}),
			},
		);

		await page.getByTestId('open-player-menu').click();
		await page.getByTestId(`player-delete-${bobId}`).click();
		await expect(page.getByTestId('confirm-dialog')).toBeVisible();
		await page.getByRole('button', { name: /delete player/i }).click();

		await expect
			.poll(async () => (await readDbCounts(page, bobId)).isDeleted, { timeout: 5000 })
			.toBe(1);
		await expect
			.poll(async () => (await readDbCounts(page, bobId)).prefsCount, { timeout: 5000 })
			.toBe(0);
		await expect
			.poll(async () => (await readDbCounts(page, bobId)).historyCount, { timeout: 5000 })
			.toBe(0);
		await expect
			.poll(async () => (await readDbCounts(page, bobId)).gameStateCount, { timeout: 5000 })
			.toBe(0);
	});
});
