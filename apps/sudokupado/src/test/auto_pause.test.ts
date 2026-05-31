import { act, render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameScreen from '../components/GameScreen';
import { useGameStore } from '../store/gameStore';

// Mock Sudoku Worker
vi.mock('../hooks/useSudokuWorker', () => ({
	useSudokuWorker: () => ({
		generatePuzzle: vi.fn(),
	}),
}));

describe('Regression: Auto-pause on background', () => {
	beforeEach(() => {
		const store = useGameStore.getState();
		const initial = Array(9)
			.fill(0)
			.map(() => Array(9).fill(0));
		const solution = Array(9)
			.fill(1)
			.map(() => Array(9).fill(1));
		act(() => {
			store.initGame(initial, solution, 'beginner');
			store.setPaused(false);
		});
	});

	it('should pause the game when document visibility changes to hidden', () => {
		render(React.createElement(GameScreen));

		// Initially not paused
		expect(useGameStore.getState().isPaused).toBe(false);

		// Mock visibilityState
		Object.defineProperty(document, 'visibilityState', {
			configurable: true,
			get: () => 'hidden',
		});

		// Trigger event
		act(() => {
			document.dispatchEvent(new Event('visibilitychange'));
		});

		// Should be paused now
		expect(useGameStore.getState().isPaused).toBe(true);

		// Cleanup mock
		Object.defineProperty(document, 'visibilityState', {
			configurable: true,
			get: () => 'visible',
		});
	});
});
