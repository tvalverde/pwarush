import { createAutosaveController } from '@pwarush/core/store';
import { useEffect } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import { hasUserInput } from '../utils/caseState';

type GameStoreState = ReturnType<typeof useGameStore.getState>;

export const clearSavedGame = async (): Promise<void> => {
	const { activePlayerId } = useGameStore.getState();
	const playerId = activePlayerId ?? 0;
	try {
		await db.transaction('rw', db.gameState, async () => {
			await db.gameState.where('playerId').equals(playerId).delete();
		});
	} catch (err) {
		console.error('Failed to clean saved case:', err);
	}
};

export const persistGame = async (state: GameStoreState): Promise<void> => {
	if (!state.activeCase) return;
	const playerId = state.activePlayerId ?? 0;
	try {
		await db.transaction('rw', db.gameState, async () => {
			const existing = await db.gameState.where('playerId').equals(playerId).first();
			const data = {
				playerId,
				activeCase: state.activeCase as NonNullable<GameStoreState['activeCase']>,
				placement: state.placement,
				checkedClues: state.checkedClues,
				timeElapsed: state.timeElapsed,
				mistakes: state.mistakes,
				isPaused: state.isPaused,
				difficulty: state.selectedDifficulty,
				hintsUsed: state.hintsUsed,
			};
			if (existing?.id) {
				await db.gameState.update(existing.id, data);
			} else {
				await db.gameState.add(data);
			}
		});
	} catch (error) {
		console.error('Auto-save failed:', error);
	}
};

export const useAutoSave = () => {
	useEffect(() => {
		const controller = createAutosaveController<GameStoreState>({
			getState: useGameStore.getState,
			subscribe: useGameStore.subscribe,
			snapshot: (state) =>
				JSON.stringify({
					placement: state.placement,
					checkedClues: state.checkedClues,
					timeElapsed: state.timeElapsed,
					mistakes: state.mistakes,
					isPaused: state.isPaused,
					hintsUsed: state.hintsUsed,
				}),
			shouldSave: (state) => state.activeScreen === 'game' && state.activeCase !== null,
			shouldClear: (state) => state.lastResult !== null || !state.hasActiveGame,
			clear: () => clearSavedGame(),
			persist: persistGame,
			triggers: (state, prevState) => {
				const hasLeftGame = prevState.activeScreen === 'game' && state.activeScreen !== 'game';
				const hasPaused = !prevState.isPaused && state.isPaused;
				if (hasLeftGame) {
					return hasUserInput(state.placement) ? 'save' : 'clear';
				}
				if (hasPaused) {
					return 'save';
				}
				return null;
			},
			intervalMs: 3000,
		});

		return controller.start();
	}, []);
};
