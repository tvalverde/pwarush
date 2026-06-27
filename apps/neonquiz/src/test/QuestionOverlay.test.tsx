import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import QuestionOverlay from '../components/QuestionOverlay';
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

const openWrongAnswer = () => {
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
	useGameStore.getState().answerQuestion(1); // wrong (correct is index 0)
};

describe('QuestionOverlay second-chance reveal (regression)', () => {
	beforeEach(openWrongAnswer);

	// Regression: the correct answer was shown in green while a 2nd chance was still
	// offered, making the wildcard pointless. It must stay hidden until the retry resolves.
	it('does not reveal the correct option while a 2nd chance is offered', () => {
		const { getByTestId, queryByTestId } = render(<QuestionOverlay />);
		expect(getByTestId('use-second-chance')).toBeInTheDocument();
		expect(getByTestId('reveal-answer')).toBeInTheDocument();
		expect(queryByTestId('continue-feedback')).toBeNull();
		expect(getByTestId('answer-0').className).not.toContain('success');
		expect(getByTestId('answer-1').className).toContain('error');
	});

	it('reveals the answer and offers to pass the turn when the player declines the retry', () => {
		useGameStore.getState().revealAnswer();
		const { getByTestId, queryByTestId } = render(<QuestionOverlay />);
		expect(getByTestId('answer-0').className).toContain('success');
		expect(getByTestId('continue-feedback')).toBeInTheDocument();
		expect(queryByTestId('use-second-chance')).toBeNull();
	});

	it('reveals the correct option once the 2nd chance is spent', () => {
		// Spend the second chance, fail again → no retry left → reveal is allowed.
		useGameStore.getState().useSecondChance();
		useGameStore.getState().answerQuestion(2);
		const { getByTestId } = render(<QuestionOverlay />);
		expect(getByTestId('answer-0').className).toContain('success');
	});
});

describe('QuestionOverlay arcade feedback label (regression)', () => {
	beforeEach(() => {
		const s = useGameStore.getState();
		s.resetGame();
		s.loadBank(bank);
		s.startGame([{ name: 'Solo', shape: 'TRIANGLE', level: 'KID' }]); // 1 player → ARCADE
		useGameStore.getState().rollDice(1);
		useGameStore.getState().moveTo(useGameStore.getState().validMoves[0]);
		useGameStore.getState().answerQuestion(1); // wrong (correct is index 0)
		useGameStore.getState().revealAnswer(); // decline the retry → continue button appears
	});

	// Regression: a solo Arcade player who missed saw "Next player", but there is no next
	// player — the button must invite them to roll again instead.
	it('labels the post-miss button "roll again", not "next player", in Arcade', () => {
		const { getByTestId } = render(<QuestionOverlay />);
		const t = useGameStore.getState().t;
		const label = getByTestId('continue-feedback').textContent;
		expect(label).toBe(t('question.roll_again'));
		expect(label).not.toBe(t('question.next_player'));
	});
});
