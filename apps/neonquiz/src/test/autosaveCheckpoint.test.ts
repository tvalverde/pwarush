import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ARCADE_SESSION_ID, db, FAMILY_SESSION_ID } from '../db/database';
import { saveCheckpoint, useAutoSave } from '../hooks/useAutoSave';
import { type PlayerDraft, useGameStore } from '../store/gameStore';
import type { GameSession } from '../types';

const drafts: PlayerDraft[] = [
	{ name: 'Ada', shape: 'TRIANGLE', level: 'KID' },
	{ name: 'Bob', shape: 'SQUARE', level: 'KID' },
];

const readSession = () => db.gameSession.get(FAMILY_SESSION_ID);
const flush = async () => {
	await act(async () => {
		await new Promise((r) => setTimeout(r, 10));
	});
};

describe('autosave checkpoint + session lifecycle', () => {
	beforeEach(async () => {
		await db.gameSession.clear();
		useGameStore.getState().resetGame();
	});

	it('saves a checkpoint at the active player with an elapsed snapshot', async () => {
		useGameStore.getState().startGame(drafts);
		await saveCheckpoint(useGameStore.getState());
		const saved = await readSession();
		expect(saved?.currentPlayerIndex).toBe(0);
		expect(saved?.phase).toBe('TURN_TRANSITION');
		expect(typeof saved?.elapsedMs).toBe('number');
	});

	// Decision (2): no anti-cheat forfeit — a question on screen leaves the turn-start checkpoint in
	// place so pausing/reloading mid-question resumes the SAME player at the start of their turn.
	it('does not forfeit the turn when a question is on screen', async () => {
		renderHook(() => useAutoSave());
		act(() => useGameStore.getState().startGame(drafts));
		await flush();
		act(() => useGameStore.setState({ phase: 'ROLLING_DICE' }));
		act(() => useGameStore.setState({ phase: 'QUESTION_ACTIVE' }));
		await flush();
		expect((await readSession())?.currentPlayerIndex).toBe(0);
	});

	it('keeps the saved game when leaving to the lobby with the roster intact (pause-and-leave)', async () => {
		renderHook(() => useAutoSave());
		act(() => useGameStore.getState().startGame(drafts));
		await flush();
		expect(await readSession()).toBeTruthy();

		act(() => useGameStore.getState().suspendToLobby());
		await flush();
		expect(await readSession()).toBeTruthy(); // preserved for "Resume"
	});

	it('discards the saved game on abandon (empty roster)', async () => {
		renderHook(() => useAutoSave());
		act(() => useGameStore.getState().startGame(drafts));
		await flush();
		act(() => useGameStore.getState().abandonGame());
		await flush();
		expect(await readSession()).toBeUndefined();
	});

	it('banks a correct answer so the active player keeps their progress', async () => {
		renderHook(() => useAutoSave());
		act(() => useGameStore.getState().startGame(drafts));
		await flush();
		act(() =>
			useGameStore.setState((state) => ({
				players: state.players.map((p, i) =>
					i === 0 ? { ...p, position: 5, sparks: ['CYAN_SCI'] } : p,
				),
				lastOutcome: {
					correct: true,
					selectedIndex: 0,
					correctIndex: 0,
					collectedSpark: 'CYAN_SCI',
				},
				phase: 'FEEDBACK',
			})),
		);
		await flush();
		const saved = await readSession();
		expect(saved?.currentPlayerIndex).toBe(0);
		expect(saved?.players[0].sparks).toEqual(['CYAN_SCI']);
	});

	it('persists Family and Arcade games to independent session slots', async () => {
		const store = useGameStore.getState();
		store.startGame(drafts); // two players → FAMILY
		await saveCheckpoint(useGameStore.getState());

		store.resetGame();
		store.startGame([{ name: 'Solo', shape: 'TRIANGLE', level: 'KID' }]); // one player → ARCADE
		await saveCheckpoint(useGameStore.getState());

		const family = await db.gameSession.get(FAMILY_SESSION_ID);
		const arcade = await db.gameSession.get(ARCADE_SESSION_ID);
		expect(family?.mode).toBe('FAMILY');
		expect(family?.players).toHaveLength(2);
		expect(arcade?.mode).toBe('ARCADE');
		expect(arcade?.players).toHaveLength(1);
	});

	it('hydrate reconstructs startedAt from the banked elapsedMs', () => {
		useGameStore.getState().startGame(drafts);
		const players = useGameStore.getState().players;
		const session: GameSession = {
			id: FAMILY_SESSION_ID,
			players,
			currentPlayerIndex: 1,
			phase: 'TURN_TRANSITION',
			updatedAt: Date.now(),
			elapsedMs: 60000,
		};
		const before = Date.now();
		useGameStore.getState().hydrate(session, [], []);
		const s = useGameStore.getState();
		expect(s.currentPlayerIndex).toBe(1);
		expect(s.isPaused).toBe(false);
		expect(s.startedAt).toBeLessThanOrEqual(before - 60000 + 50);
		expect(s.startedAt).toBeGreaterThanOrEqual(before - 60000 - 2000);
	});
});
