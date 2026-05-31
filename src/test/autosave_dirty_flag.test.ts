import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { useAutoSave } from '../hooks/useAutoSave';
import { useGameStore } from '../store/gameStore';

const empty9x9 = () =>
	Array(9)
		.fill(null)
		.map(() => Array(9).fill(0));

const initialGrid = () => {
	const g = empty9x9();
	g[0][0] = 5;
	g[1][1] = 3;
	return g;
};

const fullSolution = () =>
	Array(9)
		.fill(null)
		.map(() => Array(9).fill(1));

const emptyNotes = (): number[][][] =>
	Array(9)
		.fill(null)
		.map(() =>
			Array(9)
				.fill(null)
				.map(() => [] as number[]),
		);

const PLAYER_ID = 7;

describe('Regression: AutoSave only persists intentional navigation when the player produced input', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		if (!db.isOpen()) await db.open();
		await Promise.all([db.gameState.clear(), db.history.clear(), db.preferences.clear()]);

		useGameStore.setState({
			activePlayerId: PLAYER_ID,
			activeScreen: 'game',
			hasActiveGame: true,
			timeElapsed: 0,
			isPaused: false,
			grid: initialGrid(),
			notes: emptyNotes(),
			mistakes: 0,
			hintsUsed: 0,
			selectedDifficulty: 'beginner',
			initialGrid: initialGrid(),
			solution: fullSolution(),
			lastGameResult: null,
			maxMistakes: 3,
			maxHints: 3,
		});
	}, 10000);

	it('does NOT persist the game when the player leaves to the main menu without any input', async () => {
		renderHook(() => useAutoSave());

		await act(async () => {
			useGameStore.setState({ activeScreen: 'main' });
		});

		await new Promise((resolve) => setTimeout(resolve, 200));

		const saved = await db.gameState.where('playerId').equals(PLAYER_ID).first();
		expect(saved).toBeUndefined();
	}, 10000);

	it('persists the game when the player typed at least one number before leaving', async () => {
		renderHook(() => useAutoSave());

		await act(async () => {
			const grid = initialGrid();
			grid[2][2] = 7;
			useGameStore.setState({ grid });
		});

		await act(async () => {
			useGameStore.setState({ activeScreen: 'main' });
		});

		await new Promise((resolve) => setTimeout(resolve, 200));

		const saved = await db.gameState.where('playerId').equals(PLAYER_ID).first();
		expect(saved).toBeDefined();
		expect(saved?.grid[2][2]).toBe(7);
	}, 10000);

	it('persists the game when the player added a note (no numbers) before leaving', async () => {
		renderHook(() => useAutoSave());

		await act(async () => {
			const notes = emptyNotes();
			notes[3][3] = [4, 9];
			useGameStore.setState({ notes });
		});

		await act(async () => {
			useGameStore.setState({ activeScreen: 'main' });
		});

		await new Promise((resolve) => setTimeout(resolve, 200));

		const saved = await db.gameState.where('playerId').equals(PLAYER_ID).first();
		expect(saved).toBeDefined();
		expect(saved?.notes[3][3]).toEqual([4, 9]);
	}, 10000);

	it('persists the game when visibility goes hidden even with no player input', async () => {
		renderHook(() => useAutoSave());

		Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
		document.dispatchEvent(new Event('visibilitychange'));

		await new Promise((resolve) => setTimeout(resolve, 200));

		const saved = await db.gameState.where('playerId').equals(PLAYER_ID).first();
		expect(saved).toBeDefined();

		Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
	}, 10000);

	it('clears any prior save when the player leaves untouched after resuming a stale game state', async () => {
		await db.gameState.add({
			playerId: PLAYER_ID,
			grid: initialGrid(),
			initialGrid: initialGrid(),
			solution: fullSolution(),
			notes: emptyNotes(),
			timeElapsed: 99,
			mistakes: 0,
			hintsUsed: 0,
			isPaused: false,
			difficulty: 'beginner',
		});

		renderHook(() => useAutoSave());

		await act(async () => {
			useGameStore.setState({ activeScreen: 'main' });
		});

		await new Promise((resolve) => setTimeout(resolve, 200));

		const saved = await db.gameState.where('playerId').equals(PLAYER_ID).first();
		expect(saved).toBeUndefined();
	}, 10000);
});
