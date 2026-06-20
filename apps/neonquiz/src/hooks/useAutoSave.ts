import { createAutosaveController } from '@pwarush/core/store';
import { useEffect } from 'react';
import { db, SESSION_ID } from '../db/database';
import { useGameStore } from '../store/gameStore';

type GameStoreState = ReturnType<typeof useGameStore.getState>;

export const clearSavedSession = async (): Promise<void> => {
	try {
		await db.gameSession.delete(SESSION_ID);
	} catch (err) {
		console.error('Failed to clear saved session:', err);
	}
};

const isLiveGame = (state: GameStoreState): boolean =>
	state.phase !== 'LOBBY' && state.phase !== 'VICTORY' && state.players.length > 0;

export const persistSession = async (state: GameStoreState): Promise<void> => {
	if (!isLiveGame(state)) return;
	try {
		await db.gameSession.put({
			id: SESSION_ID,
			players: state.players,
			currentPlayerIndex: state.currentPlayerIndex,
			phase: 'TURN_TRANSITION',
			updatedAt: Date.now(),
		});
	} catch (err) {
		console.error('Auto-save failed:', err);
	}
};

export const useAutoSave = (): void => {
	useEffect(() => {
		const controller = createAutosaveController<GameStoreState>({
			getState: useGameStore.getState,
			subscribe: useGameStore.subscribe,
			snapshot: (state) =>
				JSON.stringify({ players: state.players, currentPlayerIndex: state.currentPlayerIndex }),
			shouldSave: isLiveGame,
			shouldClear: (state) => !isLiveGame(state),
			clear: () => clearSavedSession(),
			persist: persistSession,
			triggers: (state, prevState) => {
				const ended =
					(state.phase === 'LOBBY' || state.phase === 'VICTORY') && prevState.phase !== state.phase;
				if (ended) return 'clear';
				if (state.phase === 'TURN_TRANSITION' && prevState.phase !== 'TURN_TRANSITION') {
					return 'save';
				}
				return null;
			},
			intervalMs: 3000,
		});
		return controller.start();
	}, []);
};
