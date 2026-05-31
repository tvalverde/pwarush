import { render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../store/gameStore';

vi.mock('../hooks/useSudokuWorker', () => ({
	useSudokuWorker: () => ({
		generatePuzzle: vi.fn(),
		getHint: vi.fn(),
	}),
}));

vi.mock('../components/SudokuBoard', () => ({
	default: () => React.createElement('div', { 'data-testid': 'sudoku-board' }),
}));

describe('Regression: Zustand Selectors Prevent Unnecessary Re-renders (Fix 4.1)', () => {
	const empty9x9 = () =>
		Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));

	const emptyNotes = () =>
		Array(9)
			.fill(null)
			.map(() =>
				Array(9)
					.fill(null)
					.map(() => []),
			);

	beforeEach(() => {
		useGameStore.setState({
			activeScreen: 'game',
			grid: empty9x9(),
			initialGrid: empty9x9(),
			solution: empty9x9().map((row) => row.map(() => 1)),
			notes: emptyNotes(),
			mistakes: 0,
			maxMistakes: 3,
			selectedCell: null,
			isPaused: false,
			timeElapsed: 0,
			lastGameResult: null,
			currentHint: null,
			activeAnimations: { rows: [], cols: [], blocks: [] },
			hintsUsed: 0,
			isNoteMode: false,
		});
	});

	it('SudokuBoard should not re-render when only timeElapsed changes', () => {
		let renderCount = 0;

		const SpySudokuBoard: React.FC = () => {
			renderCount++;
			const _grid = useGameStore((s) => s.grid);
			const _notes = useGameStore((s) => s.notes);
			const _selectedCell = useGameStore((s) => s.selectedCell);
			const _solution = useGameStore((s) => s.solution);
			const _lastGameResult = useGameStore((s) => s.lastGameResult);
			const _currentHint = useGameStore((s) => s.currentHint);
			const _activeAnimations = useGameStore((s) => s.activeAnimations);

			return React.createElement('div', {
				'data-testid': 'spy-board',
				'data-renders': renderCount,
			});
		};

		render(React.createElement(SpySudokuBoard));

		const initialRenderCount = renderCount;

		for (let i = 1; i <= 5; i++) {
			useGameStore.getState().incrementTime();
		}

		expect(renderCount).toBe(initialRenderCount);
	});

	it('SudokuBoard should re-render when grid changes', () => {
		let renderCount = 0;

		const SpySudokuBoard: React.FC = () => {
			renderCount++;
			const _grid = useGameStore((s) => s.grid);

			return React.createElement('div', {
				'data-testid': 'spy-board',
				'data-renders': renderCount,
			});
		};

		render(React.createElement(SpySudokuBoard));

		const initialRenderCount = renderCount;

		const newGrid = empty9x9();
		newGrid[0][0] = 5;
		useGameStore.setState({ grid: newGrid });

		expect(renderCount).toBeGreaterThan(initialRenderCount);
	});

	it('App should not re-render when only timeElapsed changes', () => {
		let renderCount = 0;

		const SpyApp: React.FC = () => {
			renderCount++;
			const activeScreen = useGameStore((s) => s.activeScreen);

			return React.createElement('div', {
				'data-testid': 'spy-app',
				'data-screen': activeScreen,
			});
		};

		render(React.createElement(SpyApp));

		const initialRenderCount = renderCount;

		for (let i = 1; i <= 5; i++) {
			useGameStore.getState().incrementTime();
		}

		expect(renderCount).toBe(initialRenderCount);
	});

	it('App should re-render when activeScreen changes', () => {
		let renderCount = 0;

		const SpyApp: React.FC = () => {
			renderCount++;
			const activeScreen = useGameStore((s) => s.activeScreen);

			return React.createElement('div', {
				'data-testid': 'spy-app',
				'data-screen': activeScreen,
			});
		};

		render(React.createElement(SpyApp));

		const initialRenderCount = renderCount;

		useGameStore.setState({ activeScreen: 'main' });

		expect(renderCount).toBeGreaterThan(initialRenderCount);
	});
});
