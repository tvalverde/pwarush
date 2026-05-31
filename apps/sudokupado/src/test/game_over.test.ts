import { act, fireEvent, render, screen } from '@testing-library/react';
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

describe('Regression: Game Over on Max Mistakes', () => {
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
			store.setMaxMistakes(3);
			useGameStore.setState({
				mistakes: 2,
				dialog: { isOpen: false, title: '', message: '', onConfirm: () => {} },
			});
		});
	});

	it('should trigger game over dialog when the 3rd mistake is made', async () => {
		render(React.createElement(GameScreen));

		const cell = screen.getByTestId('cell-0-2');
		fireEvent.click(cell);

		const button1 = screen.getByRole('button', { name: '1' });

		act(() => {
			fireEvent.click(button1);
		});

		const store = useGameStore.getState();
		expect(store.mistakes).toBe(3);
		expect(store.dialog.isOpen).toBe(true);
		expect(store.dialog.title).toMatch(/Game Over|Fin de la Partida/i);
	});

	it('should restart the game when onConfirm is called in Game Over dialog', async () => {
		render(React.createElement(GameScreen));

		const cell = screen.getByTestId('cell-0-2');
		fireEvent.click(cell);
		const button1 = screen.getByRole('button', { name: '1' });

		act(() => {
			fireEvent.click(button1);
		});

		const store = useGameStore.getState();

		act(() => {
			store.dialog.onConfirm();
		});

		expect(useGameStore.getState().mistakes).toBe(0);
	});

	it('should navigate home when onCancel is called in Game Over dialog', async () => {
		render(React.createElement(GameScreen));

		const cell = screen.getByTestId('cell-0-2');
		fireEvent.click(cell);
		const button1 = screen.getByRole('button', { name: '1' });

		act(() => {
			fireEvent.click(button1);
		});

		const store = useGameStore.getState();

		await act(async () => {
			if (store.dialog.onCancel) await store.dialog.onCancel();
		});

		expect(useGameStore.getState().activeScreen).toBe('main');
	});

	it('should trigger game over on the first mistake when maxMistakes is 0 (Strict mode)', async () => {
		const store = useGameStore.getState();
		act(() => {
			store.setMaxMistakes(0);
			useGameStore.setState({ mistakes: 0 });
		});

		render(React.createElement(GameScreen));

		const cell = screen.getByTestId('cell-0-2');
		fireEvent.click(cell);
		const button1 = screen.getByRole('button', { name: '1' }); // Wrong (solution is 4)

		act(() => {
			fireEvent.click(button1);
		});

		expect(useGameStore.getState().mistakes).toBe(1);
		expect(useGameStore.getState().dialog.isOpen).toBe(true);
		expect(useGameStore.getState().dialog.title).toMatch(/Game Over|Fin de la Partida/i);
	});

	it('should NOT trigger game over when maxMistakes is -1 (Infinite mode)', async () => {
		const store = useGameStore.getState();
		act(() => {
			store.setMaxMistakes(-1);
			useGameStore.setState({ mistakes: 10 }); // Already 10 errors
		});

		render(React.createElement(GameScreen));

		const cell = screen.getByTestId('cell-0-2');
		fireEvent.click(cell);
		const button1 = screen.getByRole('button', { name: '1' }); // Wrong

		act(() => {
			fireEvent.click(button1);
		});

		expect(useGameStore.getState().mistakes).toBe(11);
		expect(useGameStore.getState().dialog.isOpen).toBe(false);
	});
});
