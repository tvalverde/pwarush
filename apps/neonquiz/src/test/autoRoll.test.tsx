import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import ArenaScreen from '../components/ArenaScreen';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES, type Question } from '../types';

const bank: Question[] = CATEGORIES.map((category, index) => ({
	id: index + 1,
	category,
	targetAudience: 'BOTH',
	questionText: `Q ${category}`,
	option0: 'the right one',
	option1: 'nope',
	option2: 'nope',
	option3: 'nope',
	correctAnswerIndex: 0,
}));

// Drives a fresh KID match up to an active question on a tile adjacent to the Nexus (a normal,
// non-Spark tile), so answering correctly grants no Spark and the roll-again is the direct path.
const startToQuestion = () => {
	const s = useGameStore.getState();
	s.resetGame();
	s.loadBank(bank);
	s.startGame([
		{ name: 'Ada', shape: 'TRIANGLE', level: 'KID' },
		{ name: 'Bob', shape: 'SQUARE', level: 'KID' },
	]);
	useGameStore.getState().confirmTurnTransition();
	useGameStore.getState().rollDice(1);
	useGameStore.getState().moveTo(useGameStore.getState().validMoves[0]);
};

describe('Arena auto-roll on "roll again"', () => {
	beforeEach(() => {
		useGameStore.setState({ language: 'es' });
		startToQuestion();
	});

	it('rolls again automatically after a correct answer, without pressing Roll', async () => {
		render(<ArenaScreen />);
		expect(useGameStore.getState().phase).toBe('QUESTION_ACTIVE');

		// Answer correctly and dismiss the feedback (the "Roll again" press).
		useGameStore.getState().answerQuestion(0);
		expect(useGameStore.getState().lastOutcome?.collectedSpark).toBeNull();
		useGameStore.getState().continueAfterFeedback();
		expect(useGameStore.getState().phase).toBe('ROLLING_DICE');

		// ArenaScreen auto-rolls: the dice resolves and the turn advances to AWAITING_MOVE with no
		// manual Roll press.
		await waitFor(() => {
			const state = useGameStore.getState();
			expect(state.dice).not.toBeNull();
			expect(state.phase).toBe('AWAITING_MOVE');
		});
	});
});
