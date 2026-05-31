import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import GameScreen from '../components/GameScreen';
import { useGameStore } from '../store/gameStore';

describe('Keyboard Accessibility', () => {
	beforeEach(() => {
		act(() => {
			useGameStore.setState({
				activeScreen: 'game',
				isPaused: false,
				lastGameResult: null,
				selectedCell: { r: 0, c: 0 },
				isNoteMode: false,
				grid: Array(9)
					.fill(null)
					.map(() => Array(9).fill(0)),
				initialGrid: Array(9)
					.fill(null)
					.map(() => Array(9).fill(0)),
				solution: Array(9)
					.fill(null)
					.map(() => Array(9).fill(1)),
			});
		});
	});

	it('should navigate with arrow keys', () => {
		render(React.createElement(GameScreen));

		act(() => {
			fireEvent.keyDown(window, { key: 'ArrowRight' });
		});
		expect(useGameStore.getState().selectedCell).toEqual({ r: 0, c: 1 });

		act(() => {
			fireEvent.keyDown(window, { key: 'ArrowDown' });
		});
		expect(useGameStore.getState().selectedCell).toEqual({ r: 1, c: 1 });

		act(() => {
			fireEvent.keyDown(window, { key: 'ArrowLeft' });
		});
		expect(useGameStore.getState().selectedCell).toEqual({ r: 1, c: 0 });

		act(() => {
			fireEvent.keyDown(window, { key: 'ArrowUp' });
		});
		expect(useGameStore.getState().selectedCell).toEqual({ r: 0, c: 0 });
	});

	it('should respect boundaries when navigating', () => {
		render(React.createElement(GameScreen));

		act(() => {
			fireEvent.keyDown(window, { key: 'ArrowUp' });
		});
		expect(useGameStore.getState().selectedCell).toEqual({ r: 0, c: 0 });

		act(() => {
			fireEvent.keyDown(window, { key: 'ArrowLeft' });
		});
		expect(useGameStore.getState().selectedCell).toEqual({ r: 0, c: 0 });

		act(() => {
			useGameStore.setState({ selectedCell: { r: 8, c: 8 } });
		});

		act(() => {
			fireEvent.keyDown(window, { key: 'ArrowRight' });
		});
		expect(useGameStore.getState().selectedCell).toEqual({ r: 8, c: 8 });

		act(() => {
			fireEvent.keyDown(window, { key: 'ArrowDown' });
		});
		expect(useGameStore.getState().selectedCell).toEqual({ r: 8, c: 8 });
	});

	it('should input numbers from keyboard', async () => {
		render(React.createElement(GameScreen));

		await act(async () => {
			fireEvent.keyDown(window, { key: '1' });
		});
		expect(useGameStore.getState().grid[0][0]).toBe(1);
	});

	it('should toggle note mode with N key or Space', () => {
		render(React.createElement(GameScreen));

		act(() => {
			fireEvent.keyDown(window, { key: 'n' });
		});
		expect(useGameStore.getState().isNoteMode).toBe(true);

		act(() => {
			fireEvent.keyDown(window, { key: ' ' });
		});
		expect(useGameStore.getState().isNoteMode).toBe(false);
	});

	it('should ignore input when paused', () => {
		act(() => {
			useGameStore.setState({ isPaused: true });
		});
		render(React.createElement(GameScreen));

		act(() => {
			fireEvent.keyDown(window, { key: 'ArrowRight' });
		});
		expect(useGameStore.getState().selectedCell).toEqual({ r: 0, c: 0 });

		act(() => {
			fireEvent.keyDown(window, { key: '1' });
		});
		expect(useGameStore.getState().grid[0][0]).toBe(0);
	});
});
