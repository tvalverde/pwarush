import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import PauseOverlay from '../components/PauseOverlay';
import { type PlayerDraft, useGameStore } from '../store/gameStore';

const drafts: PlayerDraft[] = [
	{ name: 'Ada', shape: 'TRIANGLE', level: 'KID' },
	{ name: 'Bob', shape: 'SQUARE', level: 'KID' },
];

describe('PauseOverlay', () => {
	beforeEach(() => {
		useGameStore.getState().resetGame();
		useGameStore.getState().startGame(drafts);
		useGameStore.getState().pauseGame();
	});

	it('resumes in place', () => {
		const { getByTestId } = render(<PauseOverlay />);
		fireEvent.click(getByTestId('pause-resume'));
		expect(useGameStore.getState().isPaused).toBe(false);
	});

	it('exits to the lobby keeping the roster', () => {
		const { getByTestId } = render(<PauseOverlay />);
		fireEvent.click(getByTestId('pause-exit'));
		const s = useGameStore.getState();
		expect(s.phase).toBe('LOBBY');
		expect(s.players.length).toBe(2);
	});
});
