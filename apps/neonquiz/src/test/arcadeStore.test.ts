import { beforeEach, describe, expect, it } from 'vitest';
import {
	ARCADE_BASE_POINTS,
	ARCADE_COMBO_MULTIPLIER,
	ARCADE_SPEED_BONUS_POINTS,
} from '../engine/scoring';
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

const startArcade = (level: 'KID' | 'ADULT' = 'KID') => {
	const store = useGameStore.getState();
	store.resetGame();
	store.loadBank(bank);
	store.startGame([{ name: 'Solo', shape: 'TRIANGLE', level }]);
};

// Drive the single player onto a category tile so a question opens.
const openQuestion = (roll = 1) => {
	const store = useGameStore.getState();
	store.rollDice(roll);
	const target = useGameStore.getState().validMoves[0];
	store.moveTo(target);
};

describe('arcade mode store integration', () => {
	beforeEach(() => startArcade());

	it('starts a single-player game in ARCADE mode, skipping the turn transition', () => {
		const s = useGameStore.getState();
		expect(s.mode).toBe('ARCADE');
		expect(s.phase).toBe('ROLLING_DICE');
		expect(s.players).toHaveLength(1);
		expect(s.players[0]).toMatchObject({ arcadeScore: 0, arcadeCombo: 0, arcadeMaxCombo: 0 });
	});

	it('keeps FAMILY mode and the turn transition for two or more players', () => {
		const store = useGameStore.getState();
		store.resetGame();
		store.loadBank(bank);
		store.startGame([
			{ name: 'Ada', shape: 'TRIANGLE', level: 'KID' },
			{ name: 'Bob', shape: 'SQUARE', level: 'KID' },
		]);
		const s = useGameStore.getState();
		expect(s.mode).toBe('FAMILY');
		expect(s.phase).toBe('TURN_TRANSITION');
	});

	it('awards base points and grows the combo on a correct KID answer', () => {
		openQuestion();
		useGameStore.getState().answerQuestion(0);
		const player = useGameStore.getState().players[0];
		expect(player.arcadeScore).toBe(ARCADE_BASE_POINTS + 1 * ARCADE_COMBO_MULTIPLIER);
		expect(player.arcadeCombo).toBe(1);
		expect(player.arcadeMaxCombo).toBe(1);
	});

	it('stacks the combo across consecutive correct answers', () => {
		openQuestion();
		useGameStore.getState().answerQuestion(0);
		useGameStore.getState().continueAfterFeedback();
		expect(useGameStore.getState().phase).toBe('ROLLING_DICE');
		openQuestion();
		useGameStore.getState().answerQuestion(0);
		const player = useGameStore.getState().players[0];
		const expected =
			ARCADE_BASE_POINTS +
			1 * ARCADE_COMBO_MULTIPLIER +
			(ARCADE_BASE_POINTS + 2 * ARCADE_COMBO_MULTIPLIER);
		expect(player.arcadeScore).toBe(expected);
		expect(player.arcadeCombo).toBe(2);
		expect(player.arcadeMaxCombo).toBe(2);
	});

	it('resets the combo but preserves score and max combo on a wrong answer', () => {
		openQuestion();
		useGameStore.getState().answerQuestion(0);
		const earned = useGameStore.getState().players[0].arcadeScore;
		useGameStore.getState().continueAfterFeedback();
		openQuestion();
		useGameStore.getState().answerQuestion(1);
		const player = useGameStore.getState().players[0];
		expect(player.arcadeCombo).toBe(0);
		expect(player.arcadeScore).toBe(earned);
		expect(player.arcadeMaxCombo).toBe(1);
	});

	it('grants the speed bonus to a fast ADULT answer', () => {
		startArcade('ADULT');
		openQuestion();
		useGameStore.getState().gradeAdultAnswer(true, 5000);
		const player = useGameStore.getState().players[0];
		expect(player.arcadeScore).toBe(
			ARCADE_BASE_POINTS + 1 * ARCADE_COMBO_MULTIPLIER + ARCADE_SPEED_BONUS_POINTS,
		);
	});

	it('rolls again instead of a turn transition after a wrong answer in solo play', () => {
		openQuestion();
		useGameStore.getState().answerQuestion(1);
		useGameStore.getState().continueAfterFeedback();
		expect(useGameStore.getState().phase).toBe('ROLLING_DICE');
	});

	it('resets arcade stats when restarting', () => {
		openQuestion();
		useGameStore.getState().answerQuestion(0);
		expect(useGameStore.getState().players[0].arcadeScore).toBeGreaterThan(0);
		useGameStore.getState().restartGame();
		const player = useGameStore.getState().players[0];
		expect(player).toMatchObject({ arcadeScore: 0, arcadeCombo: 0, arcadeMaxCombo: 0 });
		expect(useGameStore.getState().phase).toBe('ROLLING_DICE');
	});
});
