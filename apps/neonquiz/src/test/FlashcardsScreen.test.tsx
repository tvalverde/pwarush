import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FlashcardsScreen from '../components/FlashcardsScreen';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import type { Question, TargetAudience } from '../types';

const make = (id: number, audience: TargetAudience, text: string): Question => ({
	id,
	category: 'CYAN_SCI',
	targetAudience: audience,
	questionText: text,
	option0: 'right',
	option1: 'b',
	option2: 'c',
	option3: 'd',
	correctAnswerIndex: 0,
});

describe('FlashcardsScreen (Repaso)', () => {
	beforeEach(async () => {
		await db.failedQuestions.clear();
		await db.questions.clear();
		useGameStore.getState().resetGame();
		await db.questions.bulkAdd([
			make(1, 'KID', 'Kid Q'),
			make(2, 'ADULT', 'Adult Q'),
			make(3, 'BOTH', 'Both Q'),
		]);
		await db.failedQuestions.bulkAdd([
			{ questionId: 1, failedAt: 1 },
			{ questionId: 2, failedAt: 2 },
			{ questionId: 3, failedAt: 3 },
		]);
	});

	it('filters by player audience (kid = KID+BOTH, adult = ADULT+BOTH)', async () => {
		const { getByTestId } = render(<FlashcardsScreen onClose={vi.fn()} />);
		await waitFor(() => expect(getByTestId('card-counter').textContent).toBe('1 / 3'));

		fireEvent.click(getByTestId('rfilter-KID'));
		expect(getByTestId('card-counter').textContent).toBe('1 / 2');

		fireEvent.click(getByTestId('rfilter-ADULT'));
		expect(getByTestId('card-counter').textContent).toBe('1 / 2');

		fireEvent.click(getByTestId('rfilter-ALL'));
		expect(getByTestId('card-counter').textContent).toBe('1 / 3');
	});

	it('is interactive: the answer stays hidden until a choice is made', async () => {
		const { getByTestId, queryByTestId } = render(<FlashcardsScreen onClose={vi.fn()} />);
		// Newest-first: the first card is the BOTH question (interactive, with options).
		await waitFor(() => expect(getByTestId('card-option-0')).toBeTruthy());
		expect(queryByTestId('card-result')).toBeNull();

		fireEvent.click(getByTestId('card-option-0')); // correct (index 0)
		expect(getByTestId('card-result')).not.toBeNull();
	});
});
