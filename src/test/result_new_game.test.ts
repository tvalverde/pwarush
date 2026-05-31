import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ResultScreen from '../components/ResultScreen';
import { useGameStore } from '../store/gameStore';

// Mock Web Worker
vi.mock('../hooks/useSudokuWorker', () => ({
	useSudokuWorker: () => ({
		generatePuzzle: vi.fn().mockResolvedValue({
			initialGrid: Array(9)
				.fill(0)
				.map(() => Array(9).fill(0)),
			solution: Array(9)
				.fill(1)
				.map(() => Array(9).fill(1)),
		}),
	}),
}));

describe('Regression: ResultScreen New Game Button', () => {
	it('should reset lastGameResult and initialize a new game when clicking New Game button', async () => {
		// 1. Setup a victory state
		useGameStore.setState({
			lastGameResult: {
				score: 1000,
				timeElapsed: 300,
				difficulty: 'beginner' as const,
				mistakes: 0,
				hintsUsed: 0,
			},
			activeScreen: 'result',
		});

		render(React.createElement(ResultScreen));

		// 2. Find and click "New Game" or "NUEVO SUDOKUPADO" button
		const newGameButton = await screen.findByRole('button', {
			name: /new sudokupado|nuevo sudokupado/i,
		});
		fireEvent.click(newGameButton);

		// Wait for async actions (generatePuzzle + initGame)
		await new Promise((resolve) => setTimeout(resolve, 50));

		// 3. Verify lastGameResult is cleared (null) so the user is not trapped in victory mode
		expect(useGameStore.getState().lastGameResult).toBeNull();
		// Screen should be 'game'
		expect(useGameStore.getState().activeScreen).toBe('game');
	});
});
