import { describe, expect, it } from 'vitest';
import { type GameState, gameReducer, type Player } from './GameStateContext';

describe('gameReducer', () => {
	const initialPlayer: Player = {
		id: '1',
		name: 'Test Player',
		score: 10,
		farsanteCount: 1,
		wronglyEliminatedCount: 0,
		roundsSurvivedCount: 5,
		farsanteWinsCount: 1,
		isAlive: true,
		role: 'normal',
	};

	const mockState: GameState = {
		players: [initialPlayer],
		currentPhase: 'PUNTUACIONES',
		config: {
			timerDuration: 300,
			selectedCategories: ['animales'],
			farsantesCount: 1,
			penaltyOnFail: false,
			scoreLimit: null,
			blindTimer: false,
			language: 'es' as const,
		},
		round: {
			word: 'Gato',
			category: 'animales',
			farsanteIds: [],
			remainingTime: 300,
			accusedId: null,
			currentPlayerIndex: 0,
			startingPlayerId: null,
			hasShownStartNotice: false,
		},
		usedWords: {},
		updatedAt: 0,
		localMutationCount: 0,
	};

	it('should reset scores but keep players and stats on RESET_SCORES', () => {
		const action = { type: 'RESET_SCORES' } as const;
		const newState = gameReducer(mockState, action);

		expect(newState.currentPhase).toBe('HOME');
		expect(newState.players[0].score).toBe(0);
		expect(newState.players[0].name).toBe('Test Player');
		expect(newState.players[0].roundsSurvivedCount).toBe(5);
		expect(newState.players[0].isAlive).toBe(true);
		expect(newState.players[0].role).toBeNull();
	});

	it('should update current phase on NEXT_PHASE', () => {
		const action = { type: 'NEXT_PHASE', payload: 'DEBATE' } as const;
		const newState = gameReducer(mockState, action);

		expect(newState.currentPhase).toBe('DEBATE');
	});

	it('should update players on UPDATE_PLAYERS', () => {
		const updatedPlayers = [{ ...initialPlayer, score: 20 }];
		const action = { type: 'UPDATE_PLAYERS', payload: updatedPlayers } as const;
		const newState = gameReducer(mockState, action);

		expect(newState.players[0].score).toBe(20);
	});

	it('should save word to history when moving to PUNTUACIONES', () => {
		const action = { type: 'NEXT_PHASE', payload: 'PUNTUACIONES' } as const;
		const newState = gameReducer(mockState, action);

		expect(newState.usedWords.animales).toContain('Gato');
	});

	it('should clear category words on CLEAR_CATEGORY_WORDS', () => {
		const stateWithWords: GameState = {
			...mockState,
			usedWords: { animales: ['Gato', 'Perro'] },
		};
		const action = { type: 'CLEAR_CATEGORY_WORDS', payload: 'animales' } as const;
		const newState = gameReducer(stateWithWords, action);

		expect(newState.usedWords.animales).toEqual([]);
	});
});
