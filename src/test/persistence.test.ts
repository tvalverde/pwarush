import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { useAutoSave } from '../hooks/useAutoSave';
import { useGameStore } from '../store/gameStore';

describe('useAutoSave real DB integration', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		// Avoid fake timers here to prevent deadlock with IndexedDB/Dexie
		if (!db.isOpen()) await db.open();
		await Promise.all([db.gameState.clear(), db.history.clear(), db.preferences.clear()]);

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

		useGameStore.setState({
			activePlayerId: 1,
			activeScreen: 'game',
			hasActiveGame: true,
			timeElapsed: 0,
			isPaused: false,
			grid: empty9x9(),
			notes: emptyNotes(),
			mistakes: 0,
			hintsUsed: 0,
			selectedDifficulty: 'beginner',
			initialGrid: full9x9(),
			solution: full9x9(),
			lastGameResult: null,
		});
	}, 10000);

	it('should save after the throttle interval if changes occurred', async () => {
		renderHook(() => useAutoSave());

		await act(async () => {
			useGameStore.setState({ timeElapsed: 1 });
		});

		// Wait for throttle (3s) + small buffer
		await new Promise((resolve) => setTimeout(resolve, 3500));

		const saved = await db.gameState.where('playerId').equals(1).first();
		expect(saved).toBeDefined();
		expect(saved?.timeElapsed).toBe(1);
	}, 10000);

	it('should save IMMEDIATELY when the game is paused', async () => {
		renderHook(() => useAutoSave());

		await act(async () => {
			useGameStore.setState({ timeElapsed: 10, isPaused: true });
		});

		// Small delay for async DB write (no throttle)
		await new Promise((resolve) => setTimeout(resolve, 100));

		const saved = await db.gameState.where('playerId').equals(1).first();
		expect(saved).toBeDefined();
		expect(saved?.isPaused).toBe(true);
	});

	it('should save IMMEDIATELY when the screen changes', async () => {
		renderHook(() => useAutoSave());

		await act(async () => {
			useGameStore.setState({ activeScreen: 'main' });
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const count = await db.gameState.count();
		expect(count).toBe(1);
	});
});
