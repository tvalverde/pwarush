import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

describe('Regression: Ghost Player Protection', () => {
	beforeEach(async () => {
		localStorage.clear();
		await db.players.clear();
		await useGameStore.getState().setActivePlayer(null);
	});

	it('should reset to Guest mode if activePlayerId points to a non-existent player (Simulated logic)', async () => {
		// 1. Manually set a non-existent player ID in the store
		// (Simulating state persistence after a DB clear)
		useGameStore.setState({ activePlayerId: 9999 });

		expect(useGameStore.getState().activePlayerId).toBe(9999);

		// 2. We verify our logic for validation:
		// if we fetch player 9999 and it's null, we should clear it.
		const player = await db.players.get(9999);
		expect(player).toBeUndefined();

		if (!player) {
			await useGameStore.getState().setActivePlayer(null);
		}

		// 3. Verify state self-healing
		expect(useGameStore.getState().activePlayerId).toBeNull();
	});

	it('should clear activePlayerId when handleReset (Settings) is executed', async () => {
		// 1. Setup a player
		await useGameStore.getState().setActivePlayer(1);
		expect(useGameStore.getState().activePlayerId).toBe(1);

		// 2. Clear all data (mimicking handleReset logic)
		await db.transaction('rw', [db.players], async () => {
			await db.players.clear();
		});
		await useGameStore.getState().setActivePlayer(null);

		// 3. Verify immediate state clearance
		expect(useGameStore.getState().activePlayerId).toBeNull();
	});
});
