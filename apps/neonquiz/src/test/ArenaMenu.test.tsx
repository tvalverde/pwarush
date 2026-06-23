import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ArenaMenu from '../components/ArenaMenu';
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

const startWith = (count: number) => {
	const players: PlayerDraft[] = Array.from({ length: count }, (_, i) => ({
		name: `P${i}`,
		shape: 'TRIANGLE',
		level: 'ADULT',
	}));
	const s = useGameStore.getState();
	s.resetGame();
	s.loadBank(bank);
	s.startGame(players);
};

describe('ArenaMenu leave confirmation', () => {
	beforeEach(() => startWith(2));

	it('warns that the game will be cancelled when only two players remain', () => {
		const { getByTestId } = render(<ArenaMenu onClose={vi.fn()} />);
		fireEvent.click(getByTestId('leave-0'));

		const t = useGameStore.getState().t;
		const message = getByTestId('confirm-overlay').textContent ?? '';
		expect(message).toContain(t('menu.leave_cancels_confirm'));
		expect(message).not.toContain(t('menu.leave_confirm'));
	});

	it('keeps the normal "rest keep playing" message when three or more players remain', () => {
		startWith(3);
		const { getByTestId } = render(<ArenaMenu onClose={vi.fn()} />);
		fireEvent.click(getByTestId('leave-0'));

		const t = useGameStore.getState().t;
		const message = getByTestId('confirm-overlay').textContent ?? '';
		expect(message).toContain(t('menu.leave_confirm'));
		expect(message).not.toContain(t('menu.leave_cancels_confirm'));
	});
});
