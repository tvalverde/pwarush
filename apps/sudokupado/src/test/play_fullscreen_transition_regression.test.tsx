import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MainMenuScreen from '../components/MainMenuScreen';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import type { ScreenType } from '../types';

const { generatePuzzleMock } = vi.hoisted(() => ({ generatePuzzleMock: vi.fn() }));

vi.mock('../hooks/useSudokuWorker', () => ({
	useSudokuWorker: () => ({ generatePuzzle: generatePuzzleMock, getHint: vi.fn() }),
}));

const empty9x9 = () =>
	Array(9)
		.fill(null)
		.map(() => Array(9).fill(0));

const solved9x9 = () =>
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

describe('Regression: starting a game must not leave the menu before fullscreen is requested', () => {
	let requestFullscreenMock: ReturnType<typeof vi.fn>;
	let screenWhenFullscreenRequested: ScreenType | null;

	beforeEach(() => {
		generatePuzzleMock.mockReset();
		screenWhenFullscreenRequested = null;
		requestFullscreenMock = vi.fn().mockImplementation(() => {
			screenWhenFullscreenRequested = useGameStore.getState().activeScreen;
			return Promise.resolve();
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			value: requestFullscreenMock,
			configurable: true,
			writable: true,
		});
		useGameStore.setState({
			activeScreen: 'main',
			activePlayerId: null,
			selectedDifficulty: 'beginner',
			dialog: undefined,
		});
	});

	afterEach(async () => {
		await db.gameState.clear();
	});

	it('requests fullscreen during the Play gesture and keeps the menu (with the generating label) visible until the puzzle is ready', async () => {
		let resolveGeneration!: (value: { initialGrid: number[][]; solution: number[][] }) => void;
		generatePuzzleMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveGeneration = resolve;
				}),
		);

		render(React.createElement(MainMenuScreen));
		const user = userEvent.setup();
		await user.click(screen.getByTestId('start-game-button'));

		expect(requestFullscreenMock).toHaveBeenCalledTimes(1);
		expect(screenWhenFullscreenRequested).toBe('main');
		expect(useGameStore.getState().activeScreen).toBe('main');
		const generatingLabel = useGameStore.getState().t('main_menu.generating_label');
		expect(screen.getByText(generatingLabel)).toBeInTheDocument();

		await act(async () => {
			resolveGeneration({ initialGrid: empty9x9(), solution: solved9x9() });
		});

		await waitFor(() => expect(useGameStore.getState().activeScreen).toBe('game'));
	});

	it('requests fullscreen during the Resume gesture before leaving the menu', async () => {
		await db.gameState.add({
			playerId: 0,
			grid: empty9x9(),
			initialGrid: empty9x9(),
			solution: solved9x9(),
			notes: emptyNotes(),
			timeElapsed: 42,
			mistakes: 0,
			hintsUsed: 0,
			isPaused: true,
			difficulty: 'beginner',
		});

		render(React.createElement(MainMenuScreen));
		const user = userEvent.setup();
		await user.click(await screen.findByTestId('resume-saved-game'));

		await waitFor(() => expect(useGameStore.getState().activeScreen).toBe('game'));
		expect(requestFullscreenMock).toHaveBeenCalledTimes(1);
		expect(screenWhenFullscreenRequested).toBe('main');
	});
});
