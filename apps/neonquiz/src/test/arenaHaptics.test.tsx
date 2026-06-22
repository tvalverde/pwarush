import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ArenaScreen, { decideRollHaptic } from '../components/ArenaScreen';
import { useGameStore } from '../store/gameStore';
import { type Board, CATEGORIES, type Player, type Question } from '../types';

const stubVibrate = () => {
	const fn = vi.fn(() => true);
	Object.defineProperty(navigator, 'vibrate', { value: fn, configurable: true });
	return fn;
};

const player = (sparks: Player['sparks'] = []): Player => ({
	id: 'p0-TRIANGLE',
	name: 'Ada',
	shape: 'TRIANGLE',
	level: 'KID',
	position: 0,
	sparks,
	usedWildcards: { fiftyFifty: false, change: false, secondChance: false },
	pendingConclaveCategory: null,
});

const board: Board = {
	nodes: [
		{ id: 0, type: 'NEXUS', category: null, connectedNodeIds: [1, 2], x: 0, y: 0 },
		{ id: 1, type: 'NORMAL', category: 'EMERALD_GEO', connectedNodeIds: [0], x: 1, y: 0 },
		{
			id: 2,
			type: 'SPARK_NODE',
			category: 'CRIMSON_HIST',
			connectedNodeIds: [0],
			x: 0,
			y: 1,
		},
	],
};

describe('decideRollHaptic (pure)', () => {
	it('returns "deadEnd" when the roll produces no legal destination', () => {
		expect(decideRollHaptic(board, [], player())).toBe('deadEnd');
	});

	it('returns "sparkCandidate" when a valid move lands on an uncollected Spark Node', () => {
		expect(decideRollHaptic(board, [1, 2], player())).toBe('sparkCandidate');
	});

	it('returns null when the only Spark Node in range was already collected', () => {
		expect(decideRollHaptic(board, [2], player(['CRIMSON_HIST']))).toBeNull();
	});

	it('returns null for a plain move with no Spark Node in range', () => {
		expect(decideRollHaptic(board, [1], player())).toBeNull();
	});
});

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

const startMatch = () => {
	const store = useGameStore.getState();
	store.resetGame();
	store.loadBank(bank);
	store.startGame([
		{ name: 'Ada', shape: 'TRIANGLE', level: 'KID' },
		{ name: 'Bob', shape: 'SQUARE', level: 'KID' },
	]);
	useGameStore.getState().confirmTurnTransition();
};

describe('ArenaScreen haptics wiring', () => {
	beforeEach(() => {
		startMatch();
		useGameStore.setState({ hapticsEnabled: true });
	});

	it('fires a light tap when the roll button is pressed', () => {
		const fn = stubVibrate();
		const { getByTestId } = render(<ArenaScreen />);

		fireEvent.click(getByTestId('roll-dice'));

		expect(fn).toHaveBeenCalledWith(10);
	});

	it('fires the move pattern when a highlighted tile is clicked', () => {
		useGameStore.getState().rollDice(1);
		const fn = stubVibrate();
		const { getByTestId } = render(<ArenaScreen />);

		const targetId = useGameStore.getState().validMoves[0];
		fireEvent.click(getByTestId(`move-${targetId}`));

		expect(fn).toHaveBeenCalledWith(35);
	});

	it('fires a tap when opening the menu and when skipping a dead-end turn', () => {
		const fn = stubVibrate();
		const { getByTestId } = render(<ArenaScreen />);

		fireEvent.click(getByTestId('open-menu'));
		expect(fn).toHaveBeenLastCalledWith(10);
	});
});
