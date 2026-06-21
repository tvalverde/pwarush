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

// Writes the resume checkpoint: the safe state a reload should return to — the start of a turn,
// or a position banked right after a correct answer. Always points at the active player; resume
// always re-enters at the turn-transition screen.
export const saveCheckpoint = async (state: GameStoreState): Promise<void> => {
	if (!isLiveGame(state)) return;
	try {
		await db.gameSession.put({
			id: SESSION_ID,
			players: state.players,
			currentPlayerIndex: state.currentPlayerIndex,
			phase: 'TURN_TRANSITION',
			updatedAt: Date.now(),
			startedAt: state.startedAt ?? undefined,
			conclaveFails: state.conclaveFails,
		});
	} catch (err) {
		console.error('Auto-save failed:', err);
	}
};

// Forfeits the active player's turn by re-pointing the saved checkpoint at the next player while
// keeping the turn-start positions untouched. Invoked the moment a question appears, so reloading
// (or closing the tab) with a question on screen resumes on the NEXT player's turn: the question
// cannot be skipped, retried or given extra thinking time, and the player gains nothing.
export const forfeitSavedTurn = async (state: GameStoreState): Promise<void> => {
	if (!isLiveGame(state) || state.players.length < 2) return;
	try {
		const saved = await db.gameSession.get(SESSION_ID);
		if (!saved) return;
		// Compute the next player from the live active index (not the stored one) so re-entering a
		// question — e.g. via the Second Chance wildcard — re-points at the same next player rather
		// than skipping an extra one.
		const next = (state.currentPlayerIndex + 1) % state.players.length;
		await db.gameSession.put({ ...saved, currentPlayerIndex: next, updatedAt: Date.now() });
	} catch (err) {
		console.error('Auto-save failed:', err);
	}
};

export const useAutoSave = (): void => {
	useEffect(() => {
		return useGameStore.subscribe((state, prev) => {
			if (state.phase === prev.phase) return;
			switch (state.phase) {
				case 'LOBBY':
				case 'VICTORY':
					void clearSavedSession();
					break;
				case 'TURN_TRANSITION':
				case 'ROLLING_DICE':
					// Safe checkpoint: a fresh turn (or the next roll after a correct answer).
					void saveCheckpoint(state);
					break;
				case 'FEEDBACK':
					// Bank a correct answer so the player resumes mid-turn keeping the Spark they just
					// earned. A wrong answer leaves the forfeit checkpoint in place (the turn is lost
					// either way), so reloading on a wrong answer cannot dodge the consequence.
					if (state.lastOutcome?.correct) void saveCheckpoint(state);
					break;
				case 'QUESTION_ACTIVE':
				case 'CONCLAVE_QUESTION':
					// A question is on screen: abandoning it now costs the turn.
					void forfeitSavedTurn(state);
					break;
			}
		});
	}, []);
};
