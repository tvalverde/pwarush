import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('Regression: AutoSave Race Condition vs Delete', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		if (!db.isOpen()) await db.open();
		await Promise.all([db.gameState.clear(), db.history.clear(), db.preferences.clear()]);

		useGameStore.setState({
			activePlayerId: 1,
			activeScreen: 'game',
			hasActiveGame: true,
			timeElapsed: 10,
			isPaused: false,
			grid: empty9x9(),
			notes: emptyNotes(),
			mistakes: 0,
			hintsUsed: 0,
			selectedDifficulty: 'beginner',
			initialGrid: full9x9(),
			solution: full9x9(),
			lastGameResult: null,
			maxMistakes: 3,
		});
	}, 10000);

	it('should delete the saved game state when victory is detected by autosave', async () => {
		renderHook(() => useAutoSave());

		await act(async () => {
			useGameStore.setState({ timeElapsed: 1 });
		});

		await new Promise((resolve) => setTimeout(resolve, 3500));

		const savedBefore = await db.gameState.where('playerId').equals(1).first();
		expect(savedBefore).toBeDefined();

		await act(async () => {
			useGameStore.setState({
				lastGameResult: {
					score: 1000,
					timeElapsed: 10,
					difficulty: 'beginner',
					mistakes: 0,
					hintsUsed: 0,
				},
			});
		});

		await new Promise((resolve) => setTimeout(resolve, 3500));

		const savedAfter = await db.gameState.where('playerId').equals(1).first();
		expect(savedAfter).toBeUndefined();
	}, 15000);

	it('should delete the saved game state when game over is detected by autosave', async () => {
		renderHook(() => useAutoSave());

		await act(async () => {
			useGameStore.setState({ timeElapsed: 1 });
		});

		await new Promise((resolve) => setTimeout(resolve, 3500));

		const savedBefore = await db.gameState.where('playerId').equals(1).first();
		expect(savedBefore).toBeDefined();

		await act(async () => {
			useGameStore.setState({ mistakes: 3 });
		});

		await new Promise((resolve) => setTimeout(resolve, 3500));

		const savedAfter = await db.gameState.where('playerId').equals(1).first();
		expect(savedAfter).toBeUndefined();
	}, 15000);

	it('clearSavedGame standalone function should delete db entry atomically', async () => {
		const { clearSavedGame } = await import('../hooks/useAutoSave');

		await db.gameState.add({
			playerId: 1,
			grid: empty9x9(),
			initialGrid: full9x9(),
			solution: full9x9(),
			notes: emptyNotes(),
			timeElapsed: 5,
			mistakes: 0,
			hintsUsed: 0,
			isPaused: false,
			difficulty: 'beginner',
		});

		const countBefore = await db.gameState.count();
		expect(countBefore).toBe(1);

		await clearSavedGame();

		const countAfter = await db.gameState.count();
		expect(countAfter).toBe(0);
	});
});
