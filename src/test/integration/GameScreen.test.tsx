import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameScreen from '../../components/GameScreen';
import { useGameStore } from '../../store/gameStore';

// Mock SudokuWorker since we are testing UI integration, not the engine
vi.mock('../../hooks/useSudokuWorker', () => ({
	useSudokuWorker: () => ({
		generatePuzzle: vi.fn(),
		getHint: vi.fn(),
	}),
}));

describe('Integration: GameScreen Visual Interactions', () => {
	beforeEach(() => {
		const empty9x9 = () =>
			Array(9)
				.fill(null)
				.map(() => Array(9).fill(0));
		const solution9x9 = () =>
			Array(9)
				.fill(null)
				.map(() => Array(9).fill(1)); // All 1s for simplicity

		// Initialize store state
		useGameStore.setState({
			activeScreen: 'game',
			grid: empty9x9(),
			initialGrid: empty9x9(),
			solution: solution9x9(),
			notes: empty9x9().map((row) => row.map(() => [])),
			mistakes: 0,
			maxMistakes: 3,
			selectedCell: null,
			isPaused: false,
		});
	});

	it('should update the grid visually when a user clicks a cell and then a number', async () => {
		const user = userEvent.setup();
		render(React.createElement(GameScreen));

		// 1. Click cell 0,0
		const cell00 = screen.getByTestId('cell-0-0');
		await user.click(cell00);

		// 2. Click number 1 on the keypad
		// In solution9x9, all cells are 1, so this is correct
		const btn1 = screen.getByRole('button', { name: '1' });
		await user.click(btn1);

		// 3. Verify cell 0,0 now contains '1'
		expect(cell00).toHaveTextContent('1');

		// 4. Verify mistakes didn't increase
		expect(screen.getByText('0/3')).toBeDefined();
	});

	it('should show error visually and increment counter when user inputs wrong number', async () => {
		const user = userEvent.setup();
		render(React.createElement(GameScreen));

		// 1. Click cell 0,1
		const cell01 = screen.getByTestId('cell-0-1');
		await user.click(cell01);

		// 2. Click number 5 (Incorrect, solution is 1)
		const btn5 = screen.getByRole('button', { name: '5' });
		await user.click(btn5);

		// 3. Verify cell 0,1 shows '5' (temporarily, per our new logic)
		expect(cell01).toHaveTextContent('5');

		// 4. Verify mistakes counter updated to 1/3
		expect(screen.getByText('1/3')).toBeDefined();
	});
});
