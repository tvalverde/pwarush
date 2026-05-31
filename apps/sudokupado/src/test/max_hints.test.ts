import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameScreen from '../components/GameScreen';
import { useGameStore } from '../store/gameStore';

vi.mock('../hooks/useSudokuWorker', () => ({
	useSudokuWorker: () => ({
		generatePuzzle: vi.fn(),
		getHint: vi.fn().mockResolvedValue({ r: 0, c: 2, value: 4, type: 'naked_single' }),
	}),
}));

describe('Regression: Configurable Hints (maxHints)', () => {
	const initial = [
		[5, 3, 0, 0, 7, 0, 0, 0, 0],
		[6, 0, 0, 1, 9, 5, 0, 0, 0],
		[0, 9, 8, 0, 0, 0, 0, 6, 0],
		[8, 0, 0, 0, 6, 0, 0, 0, 3],
		[4, 0, 0, 8, 0, 3, 0, 0, 1],
		[7, 0, 0, 0, 2, 0, 0, 0, 6],
		[0, 6, 0, 0, 0, 0, 2, 8, 0],
		[0, 0, 0, 4, 1, 9, 0, 0, 5],
		[0, 0, 0, 0, 8, 0, 0, 7, 9],
	];
	const solution = [
		[5, 3, 4, 6, 7, 8, 9, 1, 2],
		[6, 7, 2, 1, 9, 5, 3, 4, 8],
		[1, 9, 8, 3, 4, 2, 5, 6, 7],
		[8, 5, 9, 7, 6, 1, 4, 2, 3],
		[4, 2, 6, 8, 5, 3, 7, 9, 1],
		[7, 1, 3, 9, 2, 4, 8, 5, 6],
		[9, 6, 1, 5, 3, 7, 2, 8, 4],
		[2, 8, 7, 4, 1, 9, 6, 3, 5],
		[3, 4, 5, 2, 8, 6, 1, 7, 9],
	];

	beforeEach(() => {
		const store = useGameStore.getState();
		act(() => {
			store.initGame(initial, solution, 'beginner');
		});
	});

	it('disables the hint button and shows "Sin pistas" when maxHints is 0', () => {
		act(() => {
			useGameStore.setState({ maxHints: 0, hintsUsed: 0 });
		});

		render(React.createElement(GameScreen));

		const hintButton = screen.getByText(/Sin pistas|No hints/i).closest('button');
		expect(hintButton).toBeDefined();
		expect(hintButton).toBeDisabled();
	});

	it('blocks useHint() in the store when maxHints is 0', () => {
		act(() => {
			useGameStore.setState({ maxHints: 0, hintsUsed: 0, currentHint: null });
			useGameStore.getState().useHint({ r: 0, c: 2, value: 4, type: 'naked_single' });
		});

		expect(useGameStore.getState().hintsUsed).toBe(0);
		expect(useGameStore.getState().currentHint).toBeNull();
	});

	it('allows up to maxHints=5 hint requests and then locks the button', () => {
		act(() => {
			useGameStore.setState({ maxHints: 5, hintsUsed: 0, currentHint: null });
		});

		for (let i = 0; i < 5; i++) {
			act(() => {
				useGameStore.getState().useHint({ r: 0, c: 2, value: 4, type: 'naked_single' });
				useGameStore.getState().clearHint();
			});
		}
		expect(useGameStore.getState().hintsUsed).toBe(5);

		act(() => {
			useGameStore.getState().useHint({ r: 0, c: 2, value: 4, type: 'naked_single' });
		});
		expect(useGameStore.getState().hintsUsed).toBe(5);
	});

	it('shows the dynamic counter format "(X/maxHints)" when hints are available', () => {
		act(() => {
			useGameStore.setState({ maxHints: 5, hintsUsed: 2 });
		});

		render(React.createElement(GameScreen));

		expect(screen.getByText(/\(2\/5\)/i)).toBeDefined();
	});
});
