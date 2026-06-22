import { beforeEach, describe, expect, it } from 'vitest';
import { type PlayerDraft, useGameStore } from '../store/gameStore';
import type { GameSession } from '../types';

const drafts: PlayerDraft[] = [
	{ name: 'Ada', shape: 'TRIANGLE', level: 'KID' },
	{ name: 'Bob', shape: 'SQUARE', level: 'KID' },
];

describe('pause/resume store actions', () => {
	beforeEach(() => {
		useGameStore.getState().resetGame();
		useGameStore.getState().startGame(drafts);
	});

	it('pauseGame sets the flag and pausedSince', () => {
		useGameStore.getState().pauseGame();
		expect(useGameStore.getState().isPaused).toBe(true);
		expect(useGameStore.getState().pausedSince).not.toBeNull();
	});

	it('resumeGame banks the elapsed pause span and clears the flag', async () => {
		useGameStore.getState().pauseGame();
		await new Promise((r) => setTimeout(r, 20));
		useGameStore.getState().resumeGame();
		const s = useGameStore.getState();
		expect(s.isPaused).toBe(false);
		expect(s.pausedSince).toBeNull();
		expect(s.pausedAccumMs).toBeGreaterThan(0);
	});

	it('pauseGame is a no-op in the lobby', () => {
		useGameStore.getState().resetGame(); // → LOBBY, empty roster
		useGameStore.getState().pauseGame();
		expect(useGameStore.getState().isPaused).toBe(false);
	});

	it('suspendToLobby goes to LOBBY keeping the roster and clearing pause', () => {
		useGameStore.getState().pauseGame();
		useGameStore.getState().suspendToLobby();
		const s = useGameStore.getState();
		expect(s.phase).toBe('LOBBY');
		expect(s.isPaused).toBe(false);
		expect(s.players.length).toBe(2); // roster kept so the autosave preserves the session
	});

	it('resumeSavedGame hydrates from a saved session', () => {
		const players = useGameStore.getState().players;
		const session: GameSession = {
			id: 1,
			players,
			currentPlayerIndex: 1,
			phase: 'TURN_TRANSITION',
			updatedAt: Date.now(),
			elapsedMs: 1000,
		};
		useGameStore.getState().resetGame();
		useGameStore.getState().resumeSavedGame(session);
		const s = useGameStore.getState();
		expect(s.phase).toBe('TURN_TRANSITION');
		expect(s.currentPlayerIndex).toBe(1);
		expect(s.players.length).toBe(2);
		expect(s.isPaused).toBe(false);
	});
});
