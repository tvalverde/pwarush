import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES, type Question } from '../types';

const bank: Question[] = CATEGORIES.map((category, index) => ({
	id: index + 1,
	category,
	targetAudience: 'KID',
	questionText: `Q ${category}`,
	option0: 'right',
	option1: 'wrong',
	option2: 'wrong',
	option3: 'wrong',
	correctAnswerIndex: 0,
}));

const start = () => {
	const store = useGameStore.getState();
	store.resetGame();
	store.loadBank(bank);
	store.startGame([
		{ name: 'Ada', shape: 'TRIANGLE' },
		{ name: 'Bob', shape: 'SQUARE' },
	]);
};

describe('gameStore turn loop', () => {
	beforeEach(start);

	it('starts at the first player in the transition phase', () => {
		const s = useGameStore.getState();
		expect(s.phase).toBe('TURN_TRANSITION');
		expect(s.currentPlayerIndex).toBe(0);
		expect(s.players).toHaveLength(2);
	});

	it('rolls the dice and exposes legal destinations', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		expect(useGameStore.getState().phase).toBe('ROLLING_DICE');
		s.rollDice(1);
		const next = useGameStore.getState();
		expect(next.phase).toBe('AWAITING_MOVE');
		expect(next.dice).toBe(1);
		expect(next.validMoves.length).toBeGreaterThan(0);
	});

	it('opens a question when moving onto a category tile', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		s.rollDice(1);
		const target = useGameStore.getState().validMoves[0];
		s.moveTo(target);
		const next = useGameStore.getState();
		expect(next.phase).toBe('QUESTION_ACTIVE');
		expect(next.activeQuestion).not.toBeNull();
	});

	it('grants another roll for the same player on a correct answer', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		s.rollDice(1);
		s.moveTo(useGameStore.getState().validMoves[0]);
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		s.answerQuestion(correct);
		expect(useGameStore.getState().phase).toBe('FEEDBACK');
		expect(useGameStore.getState().lastOutcome?.correct).toBe(true);
		s.continueAfterFeedback();
		const next = useGameStore.getState();
		expect(next.phase).toBe('ROLLING_DICE');
		expect(next.currentPlayerIndex).toBe(0);
	});

	it('passes the turn to the next player on a wrong answer', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		s.rollDice(1);
		s.moveTo(useGameStore.getState().validMoves[0]);
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		s.answerQuestion(correct === 0 ? 1 : 0);
		s.continueAfterFeedback();
		const next = useGameStore.getState();
		expect(next.phase).toBe('TURN_TRANSITION');
		expect(next.currentPlayerIndex).toBe(1);
	});

	it('collects a Spark when answering correctly on a Spark Node', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		s.rollDice(4);
		const board = useGameStore.getState().board;
		const sparkMove = useGameStore
			.getState()
			.validMoves.find((id) => board.nodes[id].type === 'SPARK_NODE');
		expect(sparkMove).toBeDefined();
		s.moveTo(sparkMove!);
		const category = board.nodes[sparkMove!].category;
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		s.answerQuestion(correct);
		const outcome = useGameStore.getState().lastOutcome;
		expect(outcome?.collectedSpark).toBe(category);
		expect(useGameStore.getState().players[0].sparks).toContain(category);
	});
});
