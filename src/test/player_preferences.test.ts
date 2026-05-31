import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

describe('Regression: Player-Specific Preferences', () => {
	beforeEach(async () => {
		localStorage.clear();
		await db.preferences.clear();
		await db.players.clear();
		// Reset store state manually because persist might keep it in memory
		const { setActivePlayer } = useGameStore.getState();
		await setActivePlayer(null);
	});

	it('should load default preferences for a new player', async () => {
		const { setActivePlayer } = useGameStore.getState();
		await setActivePlayer(1);

		const state = useGameStore.getState();
		expect(state.selectedDifficulty).toBe('beginner');
		expect(state.allowNotes).toBe(true);
		expect(state.maxMistakes).toBe(3);
	});

	it('should maintain independent preferences between players', async () => {
		const { setActivePlayer, setDifficulty, setAllowNotes, setMaxMistakes } =
			useGameStore.getState();

		// 1. Setup Player 1 as Master
		await setActivePlayer(1);
		setDifficulty('master');
		setAllowNotes(false);
		setMaxMistakes(0);

		expect(useGameStore.getState().selectedDifficulty).toBe('master');

		// 2. Switch to Player 2 (should get defaults)
		// IMPORTANT: We use a different ID
		await setActivePlayer(2);

		const state2 = useGameStore.getState();
		expect(state2.selectedDifficulty).toBe('beginner');
		expect(state2.allowNotes).toBe(true);

		// 3. Switch back to Player 1 (should restore Master settings)
		await setActivePlayer(1);

		const state1Again = useGameStore.getState();
		expect(state1Again.selectedDifficulty).toBe('master');
		expect(state1Again.allowNotes).toBe(false);
		expect(state1Again.maxMistakes).toBe(0);
	});
});
