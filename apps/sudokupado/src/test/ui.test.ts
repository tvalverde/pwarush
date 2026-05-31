import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import MainMenuScreen from '../components/MainMenuScreen';
import SudokuBoard from '../components/SudokuBoard';
import { useGameStore } from '../store/gameStore';

// Mock Worker
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

describe('UI Components', () => {
	it('should show Play as Guest button when no player is active', () => {
		useGameStore.setState({ activePlayerId: null });
		render(React.createElement(MainMenuScreen));

		const button = screen.getByRole('button', { name: /Play as Guest|Jugar como Invitado/i });
		expect(button).toBeDefined();
	});
	it('should change button to PLAY when a player is active', () => {
		useGameStore.setState({ activePlayerId: 1 });
		render(React.createElement(MainMenuScreen));

		const button = screen.getByRole('button', { name: /PLAY|JUGAR/i });
		expect(button).toBeDefined();
	});

	it('should render the board with 81 cells', () => {
		const emptyGrid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
		useGameStore.setState({
			grid: emptyGrid,
			initialGrid: emptyGrid,
			notes: Array(9)
				.fill(null)
				.map(() => Array(9).fill([])),
		});

		render(React.createElement(SudokuBoard));

		const cells = screen.queryAllByTestId(/cell-\d-\d/);
		expect(cells.length).toBe(81);
	});

	it('should highlight the selected cell with a border (Regression)', () => {
		const emptyGrid = Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
		useGameStore.setState({
			grid: emptyGrid,
			initialGrid: emptyGrid,
			notes: Array(9)
				.fill(null)
				.map(() => Array(9).fill([])),
			selectedCell: { r: 0, c: 0 },
			lastGameResult: null,
		});

		render(React.createElement(SudokuBoard));

		const cell = screen.getByTestId('cell-0-0');
		// The visual indicator is a div with border-4 class
		const indicator = cell.querySelector('.border-4');
		expect(indicator).not.toBeNull();
	});
});
