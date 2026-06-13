import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MainMenuScreen from '../components/MainMenuScreen';
import { courtroom } from '../data/scenes';
import { db } from '../db/database';
import { generateCase } from '../engine/generator';
import type { Case } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import type { ScreenType } from '../types';

const { generateMock } = vi.hoisted(() => ({ generateMock: vi.fn() }));

vi.mock('../hooks/useMurdokuWorker', () => ({
	useMurdokuWorker: () => ({ generate: generateMock }),
}));

const sampleCase = (): Case => generateCase(courtroom, 'beginner', 1);

describe('Regression: starting a case must not leave the menu before fullscreen is requested', () => {
	let requestFullscreenMock: ReturnType<typeof vi.fn>;
	let screenWhenFullscreenRequested: ScreenType | null;

	beforeEach(async () => {
		generateMock.mockReset();
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
		await db.gameState.clear();
		useGameStore.setState({
			activeScreen: 'main',
			activePlayerId: null,
			selectedDifficulty: 'beginner',
			activeCase: null,
			lastResult: null,
			hasActiveGame: false,
			dialog: { isOpen: false, title: '', message: '', onConfirm: () => {} },
		});
	});

	afterEach(async () => {
		await db.gameState.clear();
	});

	it('requests fullscreen during the Play gesture and keeps the menu (with the loading label) visible until the case is ready', async () => {
		let resolveGeneration!: (value: { case: Case; seed: number }) => void;
		generateMock.mockImplementation(
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
		const loadingLabel = useGameStore.getState().t('main_menu.generating_label');
		expect(screen.getByText(loadingLabel)).toBeInTheDocument();

		await act(async () => {
			resolveGeneration({ case: sampleCase(), seed: 1 });
		});

		await waitFor(() => expect(useGameStore.getState().activeScreen).toBe('game'));
	});

	it('requests fullscreen during the Resume gesture before leaving the menu', async () => {
		await db.gameState.add({
			playerId: 0,
			activeCase: sampleCase(),
			placement: {},
			checkedClues: [],
			timeElapsed: 30,
			mistakes: 0,
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
