import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SetupLobbyScreen from '../components/SetupLobbyScreen';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import { PLAYER_ACCENTS } from '../utils/players';

describe('SetupLobbyScreen — choosing a player colour', () => {
	beforeEach(async () => {
		await db.profiles.clear();
		useGameStore.getState().resetGame();
		useGameStore.setState({ language: 'es' });
	});

	it('lets the player pick a colour, which tints their row glyph', async () => {
		const { findByTestId, getByTestId } = render(<SetupLobbyScreen />);

		fireEvent.change(getByTestId('player-name-input'), { target: { value: 'Ada' } });
		fireEvent.click(getByTestId('accent-3'));
		fireEvent.click(getByTestId('add-player'));

		const row = await findByTestId('player-row-0');
		expect(row.innerHTML).toContain(PLAYER_ACCENTS[3]);
	});

	it('disables a colour once it is used in the roster', async () => {
		const { findByTestId, getByTestId } = render(<SetupLobbyScreen />);

		fireEvent.change(getByTestId('player-name-input'), { target: { value: 'Ada' } });
		fireEvent.click(getByTestId('accent-2'));
		fireEvent.click(getByTestId('add-player'));
		await findByTestId('player-row-0');

		expect(getByTestId('accent-2')).toBeDisabled();
	});
});
