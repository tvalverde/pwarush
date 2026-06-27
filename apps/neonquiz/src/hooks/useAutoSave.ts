import { useEffect } from 'react';
import { ARCADE_SESSION_ID, db, FAMILY_SESSION_ID } from '../db/database';
import { useGameStore } from '../store/gameStore';
import { activeElapsedMs } from '../utils/time';

type GameStoreState = ReturnType<typeof useGameStore.getState>;

export const clearSavedSession = async (sessionId: number = FAMILY_SESSION_ID): Promise<void> => {
	try {
		await db.gameSession.delete(sessionId);
	} catch (err) {
		console.error('Failed to clear saved session:', err);
	}
};

const isLiveGame = (state: GameStoreState): boolean =>
	state.phase !== 'LOBBY' && state.phase !== 'VICTORY' && state.players.length > 0;

// Writes the resume checkpoint: the safe state a reload (or a pause-and-leave) returns to — the
// start of the current player's turn, or a position banked right after a correct answer. Resume
// always re-enters at the turn-transition screen, so pausing mid-question simply replays that turn.
export const saveCheckpoint = async (state: GameStoreState): Promise<void> => {
	if (!isLiveGame(state)) return;
	try {
		const sessionId = state.mode === 'ARCADE' ? ARCADE_SESSION_ID : FAMILY_SESSION_ID;
		await db.gameSession.put({
			id: sessionId,
			mode: state.mode,
			players: state.players,
			currentPlayerIndex: state.currentPlayerIndex,
			phase: 'TURN_TRANSITION',
			updatedAt: Date.now(),
			startedAt: state.startedAt ?? undefined,
			conclaveFails: state.conclaveFails,
			elapsedMs: activeElapsedMs(
				state.startedAt,
				state.pausedAccumMs,
				state.pausedSince,
				Date.now(),
			),
		});
	} catch (err) {
		console.error('Auto-save failed:', err);
	}
};

export const useAutoSave = (): void => {
	useEffect(() => {
		return useGameStore.subscribe((state, prev) => {
			if (state.phase === prev.phase) return;
			switch (state.phase) {
				case 'VICTORY':
					void clearSavedSession(state.mode === 'ARCADE' ? ARCADE_SESSION_ID : FAMILY_SESSION_ID);
					break;
				case 'LOBBY':
					// Only discard the saved game when the roster is emptied (abandon / reset). A
					// pause-and-leave keeps the players, so its checkpoint survives for "Resume".
					if (state.players.length === 0) {
						void clearSavedSession(state.mode === 'ARCADE' ? ARCADE_SESSION_ID : FAMILY_SESSION_ID);
					}
					break;
				case 'TURN_TRANSITION':
				case 'ROLLING_DICE':
					// Safe checkpoint: a fresh turn (or the next roll after a correct answer).
					void saveCheckpoint(state);
					break;
				case 'FEEDBACK':
					// Bank a correct answer so the player resumes mid-turn keeping the Spark they just
					// earned. A wrong answer leaves the turn-start checkpoint in place.
					if (state.lastOutcome?.correct) void saveCheckpoint(state);
					break;
			}
		});
	}, []);
};
