import { createAutosaveController } from '@pwarush/core/store';
import { useEffect } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import { hasUserInput, isMistakeLimitReached } from '../utils/gameState';

type GameStoreState = ReturnType<typeof useGameStore.getState>;

export const clearSavedGame = async (): Promise<void> => {
	const { activePlayerId } = useGameStore.getState();
	const playerId = activePlayerId ?? 0;
	try {
		await db.transaction('rw', db.gameState, async () => {
			await db.gameState.where('playerId').equals(playerId).delete();
		});
	} catch (err) {
		console.error('Failed to clean zombie state:', err);
	}
};

const persistGame = async (state: GameStoreState): Promise<void> => {
	const playerId = state.activePlayerId ?? 0;

	try {
		await db.transaction('rw', db.gameState, async () => {
			const existing = await db.gameState.where('playerId').equals(playerId).first();

			const data = {
				playerId: playerId,
				grid: state.grid,
				initialGrid: state.initialGrid,
				solution: state.solution,
				notes: state.notes,
				timeElapsed: state.timeElapsed,
				mistakes: state.mistakes,
				hintsUsed: state.hintsUsed,
				isPaused: state.isPaused,
				difficulty: state.selectedDifficulty,
			};

			if (existing) {
				await db.gameState.update(existing.id!, data);
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
					grid: state.grid,
					notes: state.notes,
					timeElapsed: state.timeElapsed,
					mistakes: state.mistakes,
					hintsUsed: state.hintsUsed,
					isPaused: state.isPaused,
				}),
			shouldSave: (state) => state.activeScreen === 'game',
			shouldClear: (state) =>
				state.lastGameResult !== null ||
				isMistakeLimitReached(state.mistakes, state.maxMistakes) ||
				!state.hasActiveGame,
			clear: () => clearSavedGame(),
			persist: persistGame,
			triggers: (state, prevState) => {
				const hasLeftGame = prevState.activeScreen === 'game' && state.activeScreen !== 'game';
				const hasPaused = !prevState.isPaused && state.isPaused;

				if (hasLeftGame) {
					return hasUserInput(state.grid, state.initialGrid, state.notes) ? 'save' : 'clear';
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
