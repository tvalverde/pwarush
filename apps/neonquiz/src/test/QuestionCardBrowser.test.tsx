import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import QuestionCardBrowser from '../components/QuestionCardBrowser';
import type { Question } from '../types';

const kid: Question = {
	id: 1,
	category: 'CYAN_SCI',
	targetAudience: 'BOTH',
	questionText: 'Kid question',
	option0: 'A',
	option1: 'B',
	option2: 'C',
	option3: 'D',
	correctAnswerIndex: 2,
};

const adult: Question = {
	id: 2,
	category: 'GOLD_ENT',
	targetAudience: 'ADULT',
	questionText: 'Adult question',
	option0: 'W',
	option1: 'X',
	option2: 'Y',
	option3: 'Z',
	correctAnswerIndex: 1,
};

describe('QuestionCardBrowser', () => {
	it('shows one card at a time with a counter and navigates next/prev', () => {
		const { getByTestId, queryByText } = render(<QuestionCardBrowser questions={[kid, adult]} />);
		expect(getByTestId('card-counter').textContent).toBe('1 / 2');
		expect(getByTestId('card-prev')).toHaveProperty('disabled', true);
		expect(queryByText('Kid question')).not.toBeNull();

		fireEvent.click(getByTestId('card-next'));
		expect(getByTestId('card-counter').textContent).toBe('2 / 2');
		expect(queryByText('Adult question')).not.toBeNull();
		expect(getByTestId('card-next')).toHaveProperty('disabled', true);
	});

	it('renders the four options for a KID/BOTH card, marking the correct one', () => {
		const { getByTestId } = render(<QuestionCardBrowser questions={[kid]} />);
		expect(getByTestId('card-option-0')).not.toBeNull();
		expect(getByTestId('card-option-3')).not.toBeNull();
		expect(getByTestId('card-option-2').className).toContain('border-success');
	});

	it('hides the answer behind a reveal button for an ADULT card', () => {
		const { getByTestId, queryByTestId } = render(<QuestionCardBrowser questions={[adult]} />);
		expect(queryByTestId('card-option-0')).toBeNull();
		expect(queryByTestId('card-answer')).toBeNull();

		fireEvent.click(getByTestId('card-reveal'));
		expect(getByTestId('card-answer').textContent).toContain('X');
	});
});

describe('QuestionCardBrowser — interactive practice (Repaso)', () => {
	it('keeps the answer hidden until the player picks, then confirms a correct choice', () => {
		const { getByTestId, queryByTestId } = render(
			<QuestionCardBrowser questions={[kid]} interactive />,
		);
		expect(queryByTestId('card-result')).toBeNull();
		expect(getByTestId('card-option-2').className).not.toContain('border-success');

		fireEvent.click(getByTestId('card-option-2')); // correct
		expect(getByTestId('card-result').className).toContain('text-success');
		expect(getByTestId('card-option-2').className).toContain('border-success');
	});

	it('marks a wrong pick and reveals the correct one, locking the card', () => {
		const { getByTestId } = render(<QuestionCardBrowser questions={[kid]} interactive />);
		fireEvent.click(getByTestId('card-option-0')); // wrong
		expect(getByTestId('card-result').className).toContain('text-error');
		expect(getByTestId('card-option-0').className).toContain('border-error');
		expect(getByTestId('card-option-2').className).toContain('border-success');
		expect(getByTestId('card-option-1')).toHaveProperty('disabled', true);
	});

	it('resets the pick when navigating to another card', () => {
		const second: Question = { ...kid, id: 9, questionText: 'Second', correctAnswerIndex: 0 };
		const { getByTestId, queryByTestId } = render(
			<QuestionCardBrowser questions={[kid, second]} interactive />,
		);
		fireEvent.click(getByTestId('card-option-2'));
		expect(queryByTestId('card-result')).not.toBeNull();

		fireEvent.click(getByTestId('card-next'));
		expect(queryByTestId('card-result')).toBeNull();
	});
});
