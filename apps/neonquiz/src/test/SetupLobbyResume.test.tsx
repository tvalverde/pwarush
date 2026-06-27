import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SetupLobbyScreen from '../components/SetupLobbyScreen';
import { db, FAMILY_SESSION_ID } from '../db/database';
import { useGameStore } from '../store/gameStore';
import type { GameSession, Player } from '../types';

const player = (id: string, name: string, shape: Player['shape']): Player => ({
	id,
	name,
	shape,
	level: 'KID',
	position: 0,
	sparks: [],
	usedWildcards: { fiftyFifty: false, change: false, secondChance: false },
	pendingConclaveCategory: null,
});

const savedSession: GameSession = {
	id: FAMILY_SESSION_ID,
	players: [player('p0', 'Ada', 'TRIANGLE'), player('p1', 'Bob', 'SQUARE')],
	currentPlayerIndex: 0,
	phase: 'TURN_TRANSITION',
	updatedAt: Date.now(),
	elapsedMs: 5000,
};

describe('Lobby resume', () => {
	beforeEach(async () => {
		await db.gameSession.clear();
		await db.profiles.clear();
		useGameStore.getState().resetGame();
		useGameStore.getState().loadBank([]); // bank present so a resume can hydrate
	});

	it('shows a Resume card for a saved game and resumes it', async () => {
		await db.gameSession.put(savedSession);
		const { getByTestId } = render(<SetupLobbyScreen />);
		await waitFor(() => expect(getByTestId('resume-family-card')).toBeTruthy());

		fireEvent.click(getByTestId('resume-family-game'));
		expect(useGameStore.getState().phase).toBe('TURN_TRANSITION');
		expect(useGameStore.getState().players.length).toBe(2);
	});

	it('shows no Resume card when there is no saved game', async () => {
		const { queryByTestId, getByTestId } = render(<SetupLobbyScreen />);
		await waitFor(() => expect(getByTestId('player-name-input')).toBeTruthy());
		expect(queryByTestId('resume-family-card')).toBeNull();
		expect(queryByTestId('resume-arcade-card')).toBeNull();
	});
});
