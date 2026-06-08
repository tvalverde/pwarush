import { installAutosaveLifecycle } from '@pwarush/core/persistence';
import { useCallback, useEffect, useRef } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import { hasUserInput, isMistakeLimitReached } from '../utils/gameState';

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

export const useAutoSave = () => {
	const lastSavedStateRef = useRef<string>('');

	const saveGame = useCallback(async (force = false) => {
		const currentState = useGameStore.getState();
		const { activePlayerId, activeScreen } = currentState;

		if (!force && activeScreen !== 'game') return;

		const playerId = activePlayerId ?? 0;

		const isWon = currentState.lastGameResult !== null;
		const isLost = isMistakeLimitReached(currentState.mistakes, currentState.maxMistakes);
		const isCleared = !currentState.hasActiveGame;

		if (isWon || isLost || isCleared) {
			await clearSavedGame();
			return;
		}

		const stateSnapshot = JSON.stringify({
			grid: currentState.grid,
			notes: currentState.notes,
			timeElapsed: currentState.timeElapsed,
			mistakes: currentState.mistakes,
			hintsUsed: currentState.hintsUsed,
			isPaused: currentState.isPaused,
		});

		if (!force && stateSnapshot === lastSavedStateRef.current) return;

		try {
			await db.transaction('rw', db.gameState, async () => {
				const existing = await db.gameState.where('playerId').equals(playerId).first();

				const data = {
					playerId: playerId,
					grid: currentState.grid,
					initialGrid: currentState.initialGrid,
					solution: currentState.solution,
					notes: currentState.notes,
					timeElapsed: currentState.timeElapsed,
					mistakes: currentState.mistakes,
					hintsUsed: currentState.hintsUsed,
					isPaused: currentState.isPaused,
					difficulty: currentState.selectedDifficulty,
				};

				if (existing) {
					await db.gameState.update(existing.id!, data);
				} else {
					await db.gameState.add(data);
				}
			});

			lastSavedStateRef.current = stateSnapshot;
		} catch (error) {
			console.error('Auto-save failed:', error);
		}
	}, []);

	useEffect(() => {
		const cleanupLifecycle = installAutosaveLifecycle(() => saveGame(), { intervalMs: 3000 });

		const unsubscribe = useGameStore.subscribe((state, prevState) => {
			const hasLeftGame = prevState.activeScreen === 'game' && state.activeScreen !== 'game';
			const hasPaused = !prevState.isPaused && state.isPaused;

			if (hasLeftGame) {
				// Intentional navigation back to the menu: only keep the save if the player produced input.
				if (hasUserInput(state.grid, state.initialGrid, state.notes)) {
					saveGame(true);
				} else {
					clearSavedGame().catch((err) => console.error('Failed to discard untouched game:', err));
				}
				return;
			}

			if (hasPaused) {
				saveGame(true);
			}
		});

		return () => {
			cleanupLifecycle();
			unsubscribe();
		};
	}, [saveGame]);
};
