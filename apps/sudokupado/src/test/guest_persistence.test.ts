import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { useAutoSave } from '../hooks/useAutoSave';
import { useGameStore } from '../store/gameStore';

// No fake timers to avoid interference with async DB
// vi.useFakeTimers();

describe('Regression: Guest Mode Persistence', () => {
	beforeEach(async () => {
		await db.gameState.clear();
		const store = useGameStore.getState();
		act(() => {
			store.initGame(
				Array(9)
					.fill(0)
					.map(() => Array(9).fill(0)),
				Array(9)
					.fill(1)
					.map(() => Array(9).fill(1)),
				'beginner',
			);
			useGameStore.setState({ activePlayerId: null }); // Guest mode
		});
	});

	it('should save game state for guests using ID 0', async () => {
		// 1. Setup hook
		renderHook(() => useAutoSave());

		// 2. Simulate a change in the grid
		act(() => {
			const grid = useGameStore.getState().grid.map((row) => [...row]);
			grid[0][0] = 1;
			useGameStore.setState({ grid });
		});

		// 3. Force save (via timer or manual call if exported, but here we test the hook behavior)
		// We can't easily call saveGame directly from renderHook if not returned,
		// but we can trigger the "immediate save" effect by pausing.
		act(() => {
			useGameStore.setState({ isPaused: true });
		});

		// Wait for async db operations
		await new Promise((resolve) => setTimeout(resolve, 100));

		// 4. Verify in DB
		const saved = await db.gameState.where('playerId').equals(0).first();
		expect(saved).toBeDefined();
		expect(saved?.grid[0][0]).toBe(1);
	});
});
