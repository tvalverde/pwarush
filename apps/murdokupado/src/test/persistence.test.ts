import { afterEach, describe, expect, it } from 'vitest';
import { courtroom } from '../data/scenes';
import { db } from '../db/database';
import { generateCase } from '../engine/generator';
import { clearSavedGame, persistGame } from '../hooks/useAutoSave';
import { useGameStore } from '../store/gameStore';

afterEach(async () => {
	await db.gameState.clear();
});

describe('autosave persistence round-trip', () => {
	it('persists a game snapshot and resumes it through Dexie', async () => {
		const generated = generateCase(courtroom, 'beginner', 3);
		useGameStore.getState().initGame(generated);
		const first = generated.people[0];
		const firstCell = generated.solution[first.id];
		if (!firstCell) throw new Error('generated solution is incomplete');
		useGameStore.getState().placePerson(first.id, firstCell);

		await persistGame(useGameStore.getState());

		const saved = await db.gameState.where('playerId').equals(0).first();
		expect(saved).toBeDefined();
		if (!saved) return;
		expect(saved.activeCase.sceneId).toBe('courtroom');
		expect(saved.placement[first.id]).toEqual(firstCell);

		useGameStore.getState().clearActiveGame();
		useGameStore.getState().resumeGame(saved);
		const resumed = useGameStore.getState();
		expect(resumed.activeScreen).toBe('game');
		expect(resumed.hasActiveGame).toBe(true);
		expect(resumed.activeCase?.sceneId).toBe('courtroom');
		expect(resumed.placement[first.id]).toEqual(firstCell);
	});

	it('updates the existing snapshot instead of duplicating it', async () => {
		const generated = generateCase(courtroom, 'beginner', 4);
		useGameStore.getState().initGame(generated);
		await persistGame(useGameStore.getState());
		await persistGame(useGameStore.getState());
		expect(await db.gameState.where('playerId').equals(0).count()).toBe(1);
	});

	it('clearSavedGame deletes the persisted snapshot', async () => {
		await db.gameState.add({
			playerId: 0,
			activeCase: generateCase(courtroom, 'beginner', 1),
			placement: {},
			checkedClues: [],
			timeElapsed: 0,
			mistakes: 0,
			isPaused: false,
			difficulty: 'beginner',
		});
		await clearSavedGame();
		expect(await db.gameState.where('playerId').equals(0).count()).toBe(0);
	});
});
