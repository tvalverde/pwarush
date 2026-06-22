import { fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import QuestionAudienceManagerScreen from '../components/QuestionAudienceManagerScreen';
import { db } from '../db/database';
import { getAudienceOverrides } from '../db/questionOverrides';
import { useGameStore } from '../store/gameStore';
import type { Question } from '../types';
import { questionKey } from '../utils/questionKey';

const q = (id: number, category: Question['category'], text: string): Question => ({
	id,
	category,
	targetAudience: 'KID',
	questionText: text,
	option0: 'a',
	option1: 'b',
	option2: 'c',
	option3: 'd',
	correctAnswerIndex: 0,
});

const sci1 = q(1, 'CYAN_SCI', 'Sci one');
const ent2 = q(2, 'GOLD_ENT', 'Ent two');
const sci3 = q(3, 'CYAN_SCI', 'Sci three (unused)');

describe('QuestionAudienceManagerScreen', () => {
	beforeEach(async () => {
		await db.questionAudienceOverrides.clear();
		const store = useGameStore.getState();
		store.resetGame();
		// ids 1 and 2 have appeared; id 3 has not.
		store.loadBank([sci1, ent2, sci3], [1, 2]);
	});

	it('lists only questions that have appeared', () => {
		const { getByTestId, queryByText } = render(
			<QuestionAudienceManagerScreen onClose={vi.fn()} />,
		);
		expect(getByTestId('card-counter').textContent).toBe('1 / 2');
		expect(queryByText('Sci three (unused)')).toBeNull();
	});

	it('filters the appeared questions by category', () => {
		const { getByTestId } = render(<QuestionAudienceManagerScreen onClose={vi.fn()} />);
		fireEvent.click(getByTestId('filter-GOLD_ENT'));
		expect(getByTestId('card-counter').textContent).toBe('1 / 1');
	});

	it('filters the appeared questions by exact audience (kid / both / adult)', () => {
		const kid = { ...q(10, 'CYAN_SCI', 'Kid Q'), targetAudience: 'KID' as const };
		const adult = { ...q(11, 'CYAN_SCI', 'Adult Q'), targetAudience: 'ADULT' as const };
		const both = { ...q(12, 'CYAN_SCI', 'Both Q'), targetAudience: 'BOTH' as const };
		useGameStore.getState().loadBank([kid, adult, both], [10, 11, 12]);

		const { getByTestId } = render(<QuestionAudienceManagerScreen onClose={vi.fn()} />);
		expect(getByTestId('card-counter').textContent).toBe('1 / 3');
		fireEvent.click(getByTestId('afilter-ADULT'));
		expect(getByTestId('card-counter').textContent).toBe('1 / 1');
		fireEvent.click(getByTestId('afilter-BOTH'));
		expect(getByTestId('card-counter').textContent).toBe('1 / 1');
		fireEvent.click(getByTestId('afilter-ALL'));
		expect(getByTestId('card-counter').textContent).toBe('1 / 3');
	});

	it('reassigns a question audience and persists the override', async () => {
		const { getByTestId } = render(<QuestionAudienceManagerScreen onClose={vi.fn()} />);
		fireEvent.click(getByTestId('audience-ADULT'));

		await waitFor(() => {
			const overrides = useGameStore.getState();
			expect(overrides.bank.find((b) => b.id === 1)?.targetAudience).toBe('ADULT');
		});

		const persisted = await getAudienceOverrides();
		expect(persisted.get(questionKey(sci1))).toBe('ADULT');
	});
});
