import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES, type Question } from '../types';

const bank: Question[] = CATEGORIES.map((category, index) => ({
	id: index + 1,
	category,
	targetAudience: 'BOTH',
	questionText: `Q ${category}`,
	option0: 'right',
	option1: 'wrong',
	option2: 'wrong',
	option3: 'wrong',
	correctAnswerIndex: 0,
}));

const start = (level: 'KID' | 'ADULT' = 'KID') => {
	const store = useGameStore.getState();
	store.resetGame();
	store.loadBank(bank);
	store.startGame([
		{ name: 'Ada', shape: 'TRIANGLE', level },
		{ name: 'Bob', shape: 'SQUARE', level },
	]);
};

// Drives the current player onto a category tile so a question is open.
const openQuestion = () => {
	const s = useGameStore.getState();
	s.confirmTurnTransition();
	s.rollDice(1);
	s.moveTo(useGameStore.getState().validMoves[0]);
	expect(useGameStore.getState().phase).toBe('QUESTION_ACTIVE');
};

describe('KID one-wildcard-per-question rule', () => {
	beforeEach(() => start('KID'));

	it('blocks a second wildcard on the same question after 50/50', () => {
		openQuestion();
		useGameStore.getState().useFiftyFifty();
		expect(useGameStore.getState().wildcardUsedThisQuestion).toBe(true);
		expect(useGameStore.getState().hiddenOptions).toHaveLength(2);

		// Change must be a no-op now.
		useGameStore.getState().useChange();
		expect(useGameStore.getState().players[0].usedWildcards.change).toBe(false);
	});

	it('a Change spends the per-question allowance and blocks 50/50 on the replacement', () => {
		openQuestion();
		useGameStore.getState().useChange();
		expect(useGameStore.getState().players[0].usedWildcards.change).toBe(true);
		expect(useGameStore.getState().wildcardUsedThisQuestion).toBe(true);

		useGameStore.getState().useFiftyFifty();
		expect(useGameStore.getState().players[0].usedWildcards.fiftyFifty).toBe(false);
		expect(useGameStore.getState().hiddenOptions).toHaveLength(0);
	});

	it('blocks the second chance once a wildcard was already used this question', () => {
		openQuestion();
		useGameStore.getState().useFiftyFifty();
		useGameStore.getState().answerQuestion(1); // wrong
		expect(useGameStore.getState().phase).toBe('FEEDBACK');

		useGameStore.getState().useSecondChance();
		// Still in feedback: the retry was refused because the allowance was already spent.
		expect(useGameStore.getState().phase).toBe('FEEDBACK');
		expect(useGameStore.getState().players[0].usedWildcards.secondChance).toBe(false);
	});

	it('resets the per-question allowance when the turn advances', () => {
		openQuestion();
		useGameStore.getState().useFiftyFifty();
		expect(useGameStore.getState().wildcardUsedThisQuestion).toBe(true);

		useGameStore.getState().skipTurn();
		expect(useGameStore.getState().wildcardUsedThisQuestion).toBe(false);
	});
});

describe('ADULT players are not affected by the per-question limit', () => {
	beforeEach(() => start('ADULT'));

	it('still allows distinct wildcards within the same question', () => {
		openQuestion();
		useGameStore.getState().useFiftyFifty();
		expect(useGameStore.getState().wildcardUsedThisQuestion).toBe(true);

		// Not gated by the KID flag → Change still works for an ADULT.
		useGameStore.getState().useChange();
		expect(useGameStore.getState().players[0].usedWildcards.change).toBe(true);
	});
});
