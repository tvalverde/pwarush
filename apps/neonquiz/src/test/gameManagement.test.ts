import { beforeEach, describe, expect, it } from 'vitest';
import { type PlayerDraft, useGameStore } from '../store/gameStore';
import { CATEGORIES, type Question } from '../types';

const bank: Question[] = CATEGORIES.map((category, index) => ({
	id: index + 1,
	category,
	targetAudience: 'BOTH',
	questionText: `Q ${category}`,
	option0: 'a',
	option1: 'b',
	option2: 'c',
	option3: 'd',
	correctAnswerIndex: 0,
}));

const drafts = (n: number): PlayerDraft[] =>
	Array.from({ length: n }, (_, i) => ({
		name: `P${i}`,
		shape: (['TRIANGLE', 'SQUARE', 'PENTAGON', 'HEXAGON', 'CIRCLE', 'RHOMBUS'] as const)[i],
		level: 'KID' as const,
	}));

const startWith = (n: number) => {
	const s = useGameStore.getState();
	s.resetGame();
	s.loadBank(bank);
	s.startGame(drafts(n));
};

describe('game & data management', () => {
	beforeEach(() => startWith(3));

	it('forces Spanish regardless of the browser locale', () => {
		expect(useGameStore.getState().language).toBe('es');
	});

	it('restartGame keeps the roster but resets every player to a fresh state', () => {
		useGameStore.setState((state) => ({
			players: state.players.map((p, i) =>
				i === 0 ? { ...p, sparks: ['CYAN_SCI'], position: 5 } : p,
			),
		}));
		useGameStore.getState().restartGame();
		const s = useGameStore.getState();
		expect(s.players).toHaveLength(3);
		expect(s.currentPlayerIndex).toBe(0);
		expect(s.phase).toBe('TURN_TRANSITION');
		expect(s.players[0].sparks).toEqual([]);
		expect(s.players[0].position).toBe(0);
	});

	it('abandonGame returns to the lobby with no players', () => {
		useGameStore.getState().abandonGame();
		const s = useGameStore.getState();
		expect(s.phase).toBe('LOBBY');
		expect(s.players).toHaveLength(0);
	});

	it('removePlayer drops one and the rest continue', () => {
		const id = useGameStore.getState().players[1].id;
		useGameStore.getState().removePlayer(id);
		const s = useGameStore.getState();
		expect(s.players).toHaveLength(2);
		expect(s.players.find((p) => p.id === id)).toBeUndefined();
		expect(s.phase).toBe('TURN_TRANSITION');
	});

	it('removePlayer ends the game when fewer than two remain', () => {
		startWith(2);
		const id = useGameStore.getState().players[0].id;
		useGameStore.getState().removePlayer(id);
		expect(useGameStore.getState().phase).toBe('LOBBY');
		expect(useGameStore.getState().players).toHaveLength(0);
	});

	it('resetQuestionUsage clears the used list', () => {
		useGameStore.setState({ usedQuestionIds: [1, 2, 3] });
		useGameStore.getState().resetQuestionUsage();
		expect(useGameStore.getState().usedQuestionIds).toEqual([]);
	});

	it('resetApp clears the game, question usage and restores sound', () => {
		useGameStore.setState({ usedQuestionIds: [1, 2] });
		useGameStore.getState().setSoundEnabled(false);
		useGameStore.getState().resetApp();
		const s = useGameStore.getState();
		expect(s.phase).toBe('LOBBY');
		expect(s.players).toHaveLength(0);
		expect(s.usedQuestionIds).toEqual([]);
		expect(s.soundEnabled).toBe(true);
	});

	it('setSoundEnabled toggles and persists the preference', () => {
		useGameStore.getState().setSoundEnabled(false);
		expect(useGameStore.getState().soundEnabled).toBe(false);
		expect(localStorage.getItem('neonquiz:sound')).toBe('off');
		useGameStore.getState().setSoundEnabled(true);
		expect(localStorage.getItem('neonquiz:sound')).toBe('on');
	});
});
