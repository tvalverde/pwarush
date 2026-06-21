import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, SESSION_ID } from '../db/database';
import { NEXUS_ID } from '../engine/boardFactory';
import { forfeitSavedTurn, saveCheckpoint, useAutoSave } from '../hooks/useAutoSave';
import { type PlayerDraft, useGameStore } from '../store/gameStore';

const drafts: PlayerDraft[] = [
	{ name: 'Ada', shape: 'TRIANGLE', level: 'KID' },
	{ name: 'Bob', shape: 'SQUARE', level: 'KID' },
];

const readSession = () => db.gameSession.get(SESSION_ID);

describe('autosave turn forfeit on mid-question reload (regression)', () => {
	beforeEach(async () => {
		await db.gameSession.clear();
		useGameStore.getState().resetGame();
	});

	// Regression: reloading with a question on screen used to resume at the turn start and let the
	// player roll again, skipping the question. Abandoning a question must now cost the turn.
	it('re-points the checkpoint at the next player when a question is abandoned', async () => {
		useGameStore.getState().startGame(drafts);
		await saveCheckpoint(useGameStore.getState());
		expect((await readSession())?.currentPlayerIndex).toBe(0);

		await forfeitSavedTurn(useGameStore.getState());

		const saved = await readSession();
		expect(saved?.currentPlayerIndex).toBe(1); // the next player takes over
		expect(saved?.players[0].position).toBe(NEXUS_ID); // the forfeiting player did not advance
		expect(saved?.players[0].sparks).toEqual([]); // and gained no Spark

		// Re-entering the question (e.g. Second Chance) must not skip a further player.
		await forfeitSavedTurn(useGameStore.getState());
		expect((await readSession())?.currentPlayerIndex).toBe(1);
	});

	it('resumes on the next player and does not double-penalize on a second reload', async () => {
		useGameStore.getState().startGame(drafts);
		await saveCheckpoint(useGameStore.getState());
		await forfeitSavedTurn(useGameStore.getState());
		const saved = await readSession();
		if (!saved) throw new Error('expected a saved session');

		useGameStore.getState().hydrate(saved, [], []);
		expect(useGameStore.getState().currentPlayerIndex).toBe(1);
		expect(useGameStore.getState().phase).toBe('TURN_TRANSITION');

		// A second reload re-reads the same record: still the next player, never a further skip.
		useGameStore.getState().resetGame();
		useGameStore.getState().hydrate(saved, [], []);
		expect(useGameStore.getState().currentPlayerIndex).toBe(1);
	});

	it('banks a correct answer so the player keeps their Spark and continues', async () => {
		useGameStore.getState().startGame(drafts);
		await saveCheckpoint(useGameStore.getState());
		await forfeitSavedTurn(useGameStore.getState()); // question shown → points at the next player

		// The player answers correctly: they move on, earn a Spark, and the FEEDBACK checkpoint
		// restores the turn to them.
		useGameStore.setState((state) => ({
			players: state.players.map((p, i) =>
				i === 0 ? { ...p, position: 5, sparks: ['CYAN_SCI'] } : p,
			),
		}));
		await saveCheckpoint(useGameStore.getState());

		const saved = await readSession();
		expect(saved?.currentPlayerIndex).toBe(0); // restored to the active player
		expect(saved?.players[0].sparks).toEqual(['CYAN_SCI']);
	});

	// Wiring: the hook turns phase changes into the right persistence calls without needing the bank.
	it('wires phase transitions to checkpoint then forfeit', async () => {
		renderHook(() => useAutoSave());

		act(() => useGameStore.getState().startGame(drafts));
		await act(async () => {
			await Promise.resolve();
		});
		expect((await readSession())?.currentPlayerIndex).toBe(0);

		act(() => useGameStore.setState({ phase: 'ROLLING_DICE' }));
		act(() => useGameStore.setState({ phase: 'QUESTION_ACTIVE' }));
		await act(async () => {
			await new Promise((r) => setTimeout(r, 10));
		});
		expect((await readSession())?.currentPlayerIndex).toBe(1);
	});
});
