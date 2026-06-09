import type {
	GameConfig,
	GameState,
	Phase,
	Player,
	RoundData,
} from '../../src/context/GameStateContext';

/*
  Typed builders for a valid El Farsante GameState. The shapes mirror exactly
  what gameReducer / initGameState (GameStateContext) expect, so the app can
  hydrate from localStorage without crashing.
*/

export const STATE_STORAGE_KEY = 'elfarsante_state';
export const DRAFT_CONFIG_KEY = 'elfarsante_draft_config';
export const DRAFT_PLAYERS_KEY = 'elfarsante_draft_players';
export const LANG_KEY = 'elfarsante_lang';
export const SYNC_UID_KEY = 'elfarsante_sync_uid';

export type Language = 'es' | 'en' | 'ca';

export const defaultConfig = (overrides: Partial<GameConfig> = {}): GameConfig => ({
	timerDuration: 300,
	selectedCategories: ['animales'],
	farsantesCount: 1,
	penaltyOnFail: false,
	scoreLimit: null,
	blindTimer: false,
	language: 'es',
	...overrides,
});

export const buildPlayer = (overrides: Partial<Player> & { id: string; name: string }): Player => ({
	score: 0,
	farsanteCount: 0,
	wronglyEliminatedCount: 0,
	roundsSurvivedCount: 0,
	farsanteWinsCount: 0,
	isAlive: true,
	role: 'normal',
	...overrides,
});

/*
  Three players with deterministic ids. The first player is the faker so specs
  can reason about roles and results without relying on randomness.
*/
export const buildPlayers = (): Player[] => [
	buildPlayer({ id: 'p-0', name: 'Ana', role: 'farsante', farsanteCount: 1 }),
	buildPlayer({ id: 'p-1', name: 'Bruno' }),
	buildPlayer({ id: 'p-2', name: 'Carla' }),
];

export const buildRound = (overrides: Partial<RoundData> = {}): RoundData => ({
	word: 'León',
	category: 'animales',
	farsanteIds: ['p-0'],
	remainingTime: 300,
	accusedId: null,
	currentPlayerIndex: 0,
	startingPlayerId: 'p-1',
	hasShownStartNotice: true,
	...overrides,
});

/*
  A coherent mid-game state. The persisted currentPhase drives what the app
  restores: any phase other than HOME / PUNTUACIONES / RESTORE_PROMPT is
  promoted to RESTORE_PROMPT on cold boot by initGameState.
*/
export const buildGameState = (overrides: Partial<GameState> = {}): GameState => ({
	players: buildPlayers(),
	currentPhase: 'DEBATE',
	config: defaultConfig(),
	round: buildRound(),
	usedWords: {},
	updatedAt: 0,
	localMutationCount: 1,
	...overrides,
});

export const stateAtPhase = (phase: Phase, overrides: Partial<GameState> = {}): GameState =>
	buildGameState({ currentPhase: phase, ...overrides });

export interface SeedOptions {
	gameState?: GameState;
	draftConfig?: Partial<GameConfig> & Record<string, unknown>;
	draftPlayers?: string[];
	lang?: Language;
	syncUid?: string;
}

/*
  Serializes the seed payload into a small script that runs in the page context
  BEFORE the app boots, so the providers read the seeded localStorage on mount.
*/
export const buildSeedScript = (options: SeedOptions): string => {
	const entries: Array<[string, string]> = [];

	if (options.gameState) {
		entries.push([STATE_STORAGE_KEY, JSON.stringify(options.gameState)]);
	}
	if (options.draftConfig) {
		entries.push([DRAFT_CONFIG_KEY, JSON.stringify(options.draftConfig)]);
	}
	if (options.draftPlayers) {
		entries.push([DRAFT_PLAYERS_KEY, JSON.stringify(options.draftPlayers)]);
	}
	if (options.lang) {
		entries.push([LANG_KEY, options.lang]);
	}
	if (options.syncUid) {
		entries.push([SYNC_UID_KEY, options.syncUid]);
	}

	const serialized = JSON.stringify(entries);
	return `(() => {
		try { localStorage.clear(); } catch (e) {}
		const entries = ${serialized};
		for (const [key, value] of entries) {
			localStorage.setItem(key, value);
		}
	})();`;
};
