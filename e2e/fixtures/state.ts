import type { Difficulty, Player, Preferences } from '../../src/types';

export const DEFAULT_PLAYER_ID = 1;
export const DEFAULT_PLAYER_NAME = 'Guest E2E';
export const ZUSTAND_STORAGE_KEY = 'sudokupado-game-storage';
export const DEXIE_DB_NAME = 'SudokupadoDB';

export interface ZustandPersistedState {
	activePlayerId: number | null;
	language: 'en' | 'es';
	selectedDifficulty: Difficulty;
	allowNotes: boolean;
	maxMistakes: number;
	maxHints: number;
}

export interface ZustandPersistedShape {
	state: ZustandPersistedState;
	version: number;
}

export const defaultZustandState = (
	overrides: Partial<ZustandPersistedState> = {},
): ZustandPersistedState => ({
	activePlayerId: DEFAULT_PLAYER_ID,
	language: 'en',
	selectedDifficulty: 'beginner',
	allowNotes: true,
	maxMistakes: 3,
	maxHints: 3,
	...overrides,
});

export const defaultZustandPersist = (
	overrides: Partial<ZustandPersistedState> = {},
): ZustandPersistedShape => ({
	state: defaultZustandState(overrides),
	version: 0,
});

export const defaultPlayer = (overrides: Partial<Player> = {}): Player => ({
	name: DEFAULT_PLAYER_NAME,
	createdAt: 1_700_000_000_000,
	isDeleted: 0,
	...overrides,
});

export const defaultPreferences = (overrides: Partial<Preferences> = {}): Preferences => ({
	playerId: DEFAULT_PLAYER_ID,
	difficulty: 'beginner',
	allowNotes: true,
	maxMistakes: 3,
	maxHints: 3,
	...overrides,
});
