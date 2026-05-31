import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { useAutoSave } from '../hooks/useAutoSave';
import { useGameStore } from '../store/gameStore';

const empty9x9 = () =>
	Array(9)
		.fill(null)
		.map(() => Array(9).fill(0));

const full9x9 = () =>
	Array(9)
		.fill(null)
		.map(() => Array(9).fill(1));

const emptyNotes = () =>
	Array(9)
		.fill(null)
		.map(() =>
			Array(9)
				.fill(null)
				.map(() => []),
		);

describe('Regression: PWA update does not erase saved game', () => {
	beforeEach(async () => {
		if (!db.isOpen()) await db.open();
		await Promise.all([db.gameState.clear(), db.history.clear(), db.players.clear()]);
	});

	it('visibilitychange on the main screen must not delete an existing saved game', async () => {
		// Simulate a saved game in DB from a previous session
		await db.gameState.add({
			playerId: 0,
			grid: full9x9(),
			initialGrid: full9x9(),
			solution: full9x9(),
			notes: emptyNotes(),
			timeElapsed: 120,
			mistakes: 1,
			hintsUsed: 0,
			isPaused: false,
			difficulty: 'expert',
		});

		// User is on the main screen — no active game loaded in the store
		act(() => {
			useGameStore.setState({
				activeScreen: 'main',
				activePlayerId: null,
				grid: empty9x9(),
				initialGrid: empty9x9(),
				solution: empty9x9(),
				notes: emptyNotes(),
				mistakes: 0,
				hintsUsed: 0,
				timeElapsed: 0,
				isPaused: false,
				lastGameResult: null,
			});
		});

		const { unmount } = renderHook(() => useAutoSave());

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		// Simulate switching away from the app (what also happens on a PWA reload)
		Object.defineProperty(document, 'visibilityState', {
			value: 'hidden',
			configurable: true,
		});
		act(() => {
			document.dispatchEvent(new Event('visibilitychange'));
		});

		await act(async () => {
			await new Promise((r) => setTimeout(r, 150));
		});

		// The saved game MUST still exist — it should not have been deleted
		const saved = await db.gameState.where('playerId').equals(0).first();
		expect(saved).toBeDefined();
		expect(saved?.timeElapsed).toBe(120);

		unmount();
		Object.defineProperty(document, 'visibilityState', {
			value: 'visible',
			configurable: true,
		});
	});

	it('saveGame on game screen still persists state on visibilitychange', async () => {
		act(() => {
			useGameStore.setState({
				activeScreen: 'game',
				activePlayerId: null,
				hasActiveGame: true,
				grid: full9x9(),
				initialGrid: full9x9(),
				solution: full9x9(),
				notes: emptyNotes(),
				mistakes: 0,
				hintsUsed: 0,
				timeElapsed: 60,
				isPaused: false,
				lastGameResult: null,
			});
		});

		const { unmount } = renderHook(() => useAutoSave());

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		Object.defineProperty(document, 'visibilityState', {
			value: 'hidden',
			configurable: true,
		});
		act(() => {
			document.dispatchEvent(new Event('visibilitychange'));
		});

		await act(async () => {
			await new Promise((r) => setTimeout(r, 200));
		});

		const saved = await db.gameState.where('playerId').equals(0).first();
		expect(saved).toBeDefined();
		expect(saved?.timeElapsed).toBe(60);

		unmount();
		Object.defineProperty(document, 'visibilityState', {
			value: 'visible',
			configurable: true,
		});
	});
});
