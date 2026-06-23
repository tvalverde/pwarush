import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import AdultQuestionOverlay, { revealProgress } from '../components/AdultQuestionOverlay';
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

const openAdultQuestion = () => {
	const s = useGameStore.getState();
	s.resetGame();
	s.loadBank(bank);
	s.startGame([
		{ name: 'Ada', shape: 'TRIANGLE', level: 'ADULT' },
		{ name: 'Bob', shape: 'SQUARE', level: 'ADULT' },
	]);
	useGameStore.getState().confirmTurnTransition();
	useGameStore.getState().rollDice(1);
	useGameStore.getState().moveTo(useGameStore.getState().validMoves[0]);
};

describe('AdultQuestionOverlay', () => {
	beforeEach(openAdultQuestion);

	it('hides the answer until the adult reveals it, then offers self-grading', () => {
		const { getByTestId, queryByTestId } = render(<AdultQuestionOverlay />);
		expect(getByTestId('adult-reveal')).toBeInTheDocument();
		expect(queryByTestId('adult-correct')).toBeNull();

		fireEvent.click(getByTestId('adult-reveal'));
		expect(getByTestId('adult-correct')).toBeInTheDocument();
		expect(getByTestId('adult-failed')).toBeInTheDocument();
		expect(getByTestId('adult-question-overlay').textContent).toContain('the right one');
	});

	it('paints the failure button with the semantic error colour, not a category colour', () => {
		const { getByTestId } = render(<AdultQuestionOverlay />);
		fireEvent.click(getByTestId('adult-reveal'));

		const failed = getByTestId('adult-failed');
		expect(failed.className).toContain('bg-error');
		expect(failed.className).toContain('text-on-error');
	});

	it('shows a countdown while reading', () => {
		const { getByTestId } = render(<AdultQuestionOverlay />);
		expect(getByTestId('adult-timer')).toBeInTheDocument();
	});

	it('renders the reveal button charging fill, starting empty', () => {
		const { getByTestId } = render(<AdultQuestionOverlay />);
		const fill = getByTestId('adult-reveal-progress');
		expect(fill).toBeInTheDocument();
		expect(fill.style.width).toBe('0%');
	});

	it('fills with a fixed contrast scrim, never the category colour, so it stays visible on the primary button (e.g. Geography)', () => {
		useGameStore.setState({
			activeQuestion: {
				id: 99,
				category: 'EMERALD_GEO',
				targetAudience: 'BOTH',
				questionText: 'Geo Q',
				option0: 'a',
				option1: 'b',
				option2: 'c',
				option3: 'd',
				correctAnswerIndex: 0,
			},
		});

		const { getByTestId } = render(<AdultQuestionOverlay />);
		const fill = getByTestId('adult-reveal-progress');

		expect(fill.style.backgroundColor).toBe('var(--color-on-primary)');
		expect(fill.style.backgroundColor).not.toBe('var(--color-cat-cyan)');
	});
});

describe('revealProgress', () => {
	it('maps elapsed time to a clamped 0..1 fraction of the reading clock', () => {
		expect(revealProgress(0, 30000)).toBe(0);
		expect(revealProgress(15000, 30000)).toBe(0.5);
		expect(revealProgress(30000, 30000)).toBe(1);
		expect(revealProgress(45000, 30000)).toBe(1);
		expect(revealProgress(100, 0)).toBe(1);
	});
});
