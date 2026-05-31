import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameScreen from '../components/GameScreen';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

vi.mock('../hooks/useSudokuWorker', () => ({
	useSudokuWorker: () => ({ generatePuzzle: vi.fn(), getHint: vi.fn() }),
}));

const emptyNotes = () =>
	Array(9)
		.fill(null)
		.map(() =>
			Array(9)
				.fill(null)
				.map(() => []),
		);

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

// Only cell [0][2] is empty (solution value = 4)
const nearVictoryGrid = [
	[5, 3, 0, 6, 7, 8, 9, 1, 2],
	[6, 7, 2, 1, 9, 5, 3, 4, 8],
	[1, 9, 8, 3, 4, 2, 5, 6, 7],
	[8, 5, 9, 7, 6, 1, 4, 2, 3],
	[4, 2, 6, 8, 5, 3, 7, 9, 1],
	[7, 1, 3, 9, 2, 4, 8, 5, 6],
	[9, 6, 1, 5, 3, 7, 2, 8, 4],
	[2, 8, 7, 4, 1, 9, 6, 3, 5],
	[3, 4, 5, 2, 8, 6, 1, 7, 9],
];

// Multiple empty cells; [0][2]=4 in solution, so entering 1 is always wrong
const multiEmptyGrid = [
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

const GUEST_PLAYER_ID = 0;

describe('Regression: Continuar button must not show after a completed game', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		if (!db.isOpen()) await db.open();
		await Promise.all([db.gameState.clear(), db.history.clear()]);
	});

	it('deletes the DB record upon victory so the Continuar card cannot appear', async () => {
		await db.gameState.add({
			playerId: GUEST_PLAYER_ID,
			grid: nearVictoryGrid,
			initialGrid: nearVictoryGrid,
			solution,
			notes: emptyNotes(),
			timeElapsed: 10,
			mistakes: 0,
			hintsUsed: 0,
			isPaused: false,
			difficulty: 'beginner',
		});

		useGameStore.setState({
			activePlayerId: null,
			activeScreen: 'game',
			isPaused: false,
			isNoteMode: false,
			selectedCell: null,
			lastGameResult: null,
			mistakes: 0,
			hintsUsed: 0,
			maxMistakes: 3,
			timeElapsed: 10,
			notes: emptyNotes(),
			grid: nearVictoryGrid,
			initialGrid: nearVictoryGrid,
			solution,
			selectedDifficulty: 'beginner',
		});

		const before = await db.gameState.where('playerId').equals(GUEST_PLAYER_ID).first();
		expect(before).toBeDefined();

		render(React.createElement(GameScreen));

		fireEvent.click(screen.getByTestId('cell-0-2'));

		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: '4' }));
		});

		const after = await db.gameState.where('playerId').equals(GUEST_PLAYER_ID).first();
		expect(after).toBeUndefined();
	});

	it('deletes the DB record when user goes home after game over so the Continuar card cannot appear', async () => {
		await db.gameState.add({
			playerId: GUEST_PLAYER_ID,
			grid: multiEmptyGrid,
			initialGrid: multiEmptyGrid,
			solution,
			notes: emptyNotes(),
			timeElapsed: 10,
			mistakes: 0,
			hintsUsed: 0,
			isPaused: false,
			difficulty: 'beginner',
		});

		useGameStore.setState({
			activePlayerId: null,
			activeScreen: 'game',
			isPaused: false,
			isNoteMode: false,
			selectedCell: null,
			lastGameResult: null,
			mistakes: 2,
			hintsUsed: 0,
			maxMistakes: 3,
			timeElapsed: 10,
			notes: emptyNotes(),
			grid: multiEmptyGrid,
			initialGrid: multiEmptyGrid,
			solution,
			selectedDifficulty: 'beginner',
			dialog: { isOpen: false, title: '', message: '', onConfirm: () => {} },
		});

		const before = await db.gameState.where('playerId').equals(GUEST_PLAYER_ID).first();
		expect(before).toBeDefined();

		render(React.createElement(GameScreen));

		fireEvent.click(screen.getByTestId('cell-0-2'));

		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: '1' }));
		});

		expect(useGameStore.getState().dialog.isOpen).toBe(true);

		await act(async () => {
			await useGameStore.getState().dialog.onCancel?.();
		});

		const after = await db.gameState.where('playerId').equals(GUEST_PLAYER_ID).first();
		expect(after).toBeUndefined();
	});
});
