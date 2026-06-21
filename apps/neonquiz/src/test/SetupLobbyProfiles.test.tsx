import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SetupLobbyScreen from '../components/SetupLobbyScreen';
import { db } from '../db/database';
import { getProfiles, upsertProfile } from '../db/profiles';
import { useGameStore } from '../store/gameStore';
import { PLAYER_ACCENTS } from '../utils/players';

describe('SetupLobbyScreen — saved player profiles', () => {
	beforeEach(async () => {
		await db.profiles.clear();
		useGameStore.getState().resetGame();
		useGameStore.setState({ language: 'es' });
	});

	it('creates a profile for a brand-new player and carries accentColor + profileId in the draft', async () => {
		const { findByTestId, getByTestId } = render(<SetupLobbyScreen />);

		fireEvent.change(getByTestId('player-name-input'), { target: { value: 'Ada' } });
		fireEvent.click(getByTestId('add-player'));

		const row = await findByTestId('player-row-0');
		expect(row).toHaveTextContent('Ada');

		const profiles = await getProfiles();
		expect(profiles).toHaveLength(1);
		expect(profiles[0].name).toBe('Ada');
		expect(profiles[0].gamesPlayed).toBe(0);
		expect(profiles[0].accentColor).toBe(PLAYER_ACCENTS[0]);

		// The row's glyph carries the new profile's accent colour.
		expect(row.innerHTML).toContain(PLAYER_ACCENTS[0]);
	});

	it('re-adds a saved profile to the roster with its pinned shape/color/level', async () => {
		const now = Date.now();
		const id = await upsertProfile({
			name: 'Bob',
			shape: 'SQUARE',
			accentColor: PLAYER_ACCENTS[2],
			preferredLevel: 'ADULT',
			gamesPlayed: 3,
			gamesWon: 1,
			totalCorrect: 10,
			totalWrong: 5,
			totalPlayMs: 60_000,
			currentStreak: 0,
			bestStreak: 1,
			createdAt: now,
			lastPlayedAt: now,
		});

		const { findByTestId, getByTestId } = render(<SetupLobbyScreen />);

		const chip = await findByTestId(`saved-profile-${id}`);
		fireEvent.click(chip);

		const row = await findByTestId('player-row-0');
		expect(row).toHaveTextContent('Bob');
		expect(row.innerHTML).toContain(PLAYER_ACCENTS[2]);

		// Re-adding the same saved profile twice should not be possible: its accent is now used.
		expect(getByTestId(`saved-profile-${id}`)).toBeDisabled();
	});

	it('does not let two players in the same match share an accent colour', async () => {
		const now = Date.now();
		await upsertProfile({
			name: 'Carla',
			shape: 'HEXAGON',
			accentColor: PLAYER_ACCENTS[0],
			preferredLevel: 'KID',
			gamesPlayed: 0,
			gamesWon: 0,
			totalCorrect: 0,
			totalWrong: 0,
			totalPlayMs: 0,
			currentStreak: 0,
			bestStreak: 0,
			createdAt: now,
			lastPlayedAt: now,
		});

		const { findByTestId, getByTestId } = render(<SetupLobbyScreen />);

		// A brand-new player takes the first free accent (index 0, same as Carla's).
		fireEvent.change(getByTestId('player-name-input'), { target: { value: 'Dani' } });
		fireEvent.click(getByTestId('add-player'));
		await findByTestId('player-row-0');

		const profiles = await getProfiles();
		const carla = profiles.find((p) => p.name === 'Carla');
		expect(carla).toBeDefined();
		// Carla's accent is now taken in this match, so her chip must be disabled.
		expect(getByTestId(`saved-profile-${carla?.id}`)).toBeDisabled();
	});
});
