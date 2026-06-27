import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SetupLobbyScreen from '../components/SetupLobbyScreen';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

describe('SetupLobbyScreen — single-player minimum (regression)', () => {
	beforeEach(async () => {
		await db.profiles.clear();
		await db.gameSession.clear();
		useGameStore.getState().resetGame();
		useGameStore.setState({ language: 'es' });
	});

	// Regression: the start button advertised "Añade al menos 2 jugadores" even though
	// Arcade mode is playable with a single player (MIN_PLAYERS === 1).
	it('advertises the real 1-player minimum when the roster is empty', async () => {
		const { getByTestId } = render(<SetupLobbyScreen />);
		await waitFor(() => expect(getByTestId('start-game')).toBeTruthy());

		const t = useGameStore.getState().t;
		const label = getByTestId('start-game').textContent ?? '';
		expect(label).toBe(t('lobby.min_players'));
		expect(label).toContain('1');
		expect(label).not.toContain('2');
	});
});
