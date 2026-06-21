import { beforeEach, describe, expect, it } from 'vitest';
import { NEXUS_ID } from '../engine/boardFactory';
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

const start = (level: 'KID' | 'ADULT' = 'KID') => {
	const store = useGameStore.getState();
	store.resetGame();
	store.loadBank(bank);
	store.startGame([
		{ name: 'Ada', shape: 'TRIANGLE', level },
		{ name: 'Bob', shape: 'SQUARE', level },
	]);
};

const openQuestion = () => {
	useGameStore.getState().confirmTurnTransition();
	useGameStore.getState().rollDice(1);
	useGameStore.getState().moveTo(useGameStore.getState().validMoves[0]);
	expect(useGameStore.getState().phase).toBe('QUESTION_ACTIVE');
};

describe('gameStore match stats (Hito 8)', () => {
	describe('startGame', () => {
		beforeEach(() => start());

		it('sets startedAt to a number and zeroes every player tally', () => {
			const s = useGameStore.getState();
			expect(typeof s.startedAt).toBe('number');
			expect(s.startedAt).not.toBeNull();
			for (const player of s.players) {
				expect(player.correct).toBe(0);
				expect(player.wrong).toBe(0);
			}
		});
	});

	describe('KID answers', () => {
		beforeEach(() => start());

		it('increments the active player correct tally on a right answer', () => {
			openQuestion();
			const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
			useGameStore.getState().answerQuestion(correct);
			const player = useGameStore.getState().players[0];
			expect(player.correct).toBe(1);
			expect(player.wrong).toBe(0);
		});

		it('increments the active player wrong tally on an incorrect answer', () => {
			openQuestion();
			const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
			useGameStore.getState().answerQuestion(correct === 0 ? 1 : 0);
			const player = useGameStore.getState().players[0];
			expect(player.correct).toBe(0);
			expect(player.wrong).toBe(1);
		});

		it('only updates the answering player, leaving the others untouched', () => {
			openQuestion();
			const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
			useGameStore.getState().answerQuestion(correct);
			const other = useGameStore.getState().players[1];
			expect(other.correct).toBe(0);
			expect(other.wrong).toBe(0);
		});
	});

	describe('ADULT self-graded answers', () => {
		beforeEach(() => start('ADULT'));

		it('gradeAdultAnswer(true) increments correct', () => {
			openQuestion();
			useGameStore.getState().revealAdultAnswer();
			useGameStore.getState().gradeAdultAnswer(true);
			const player = useGameStore.getState().players[0];
			expect(player.correct).toBe(1);
			expect(player.wrong).toBe(0);
		});

		it('gradeAdultAnswer(false) increments wrong', () => {
			openQuestion();
			useGameStore.getState().revealAdultAnswer();
			useGameStore.getState().gradeAdultAnswer(false);
			const player = useGameStore.getState().players[0];
			expect(player.correct).toBe(0);
			expect(player.wrong).toBe(1);
		});
	});

	describe('Conclave failures', () => {
		beforeEach(() => start());

		// Places player 0 on a spoke tile next to the Nexus, holding all six Sparks.
		const armChallenger = (): void => {
			const board = useGameStore.getState().board;
			const spokeInner = board.nodes.find(
				(node) => node.type === 'NORMAL' && node.connectedNodeIds.includes(NEXUS_ID),
			);
			const players = useGameStore
				.getState()
				.players.map((player, index) =>
					index === 0 ? { ...player, sparks: [...CATEGORIES], position: spokeInner!.id } : player,
				);
			useGameStore.setState({ players, currentPlayerIndex: 0, phase: 'TURN_TRANSITION' });
		};

		const reachNexus = (): void => {
			useGameStore.getState().confirmTurnTransition();
			useGameStore.getState().rollDice(1);
			useGameStore.getState().moveTo(NEXUS_ID);
		};

		it('increments conclaveFails when the final question is answered incorrectly', () => {
			armChallenger();
			reachNexus();
			expect(useGameStore.getState().phase).toBe('CONCLAVE_VOTE');
			useGameStore.getState().voteConclaveCategory('CYAN_SCI');
			useGameStore.getState().confirmConclaveHandoff();
			const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
			useGameStore.getState().answerQuestion(correct === 0 ? 1 : 0);
			useGameStore.getState().continueAfterFeedback();

			expect(useGameStore.getState().conclaveFails).toBe(1);
		});

		it('does not increment conclaveFails on a winning final answer', () => {
			armChallenger();
			reachNexus();
			useGameStore.getState().voteConclaveCategory('CYAN_SCI');
			useGameStore.getState().confirmConclaveHandoff();
			const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
			useGameStore.getState().answerQuestion(correct);
			useGameStore.getState().continueAfterFeedback();

			expect(useGameStore.getState().phase).toBe('VICTORY');
			expect(useGameStore.getState().conclaveFails).toBe(0);
		});
	});

	describe('restartGame', () => {
		beforeEach(() => start());

		it('resets every player tally to 0 and refreshes startedAt', async () => {
			openQuestion();
			const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
			useGameStore.getState().answerQuestion(correct);
			expect(useGameStore.getState().players[0].correct).toBe(1);

			const previousStartedAt = useGameStore.getState().startedAt;
			await new Promise((resolve) => setTimeout(resolve, 5));

			useGameStore.getState().restartGame();
			const s = useGameStore.getState();
			for (const player of s.players) {
				expect(player.correct).toBe(0);
				expect(player.wrong).toBe(0);
			}
			expect(typeof s.startedAt).toBe('number');
			expect(s.startedAt).not.toBe(previousStartedAt);
		});
	});
});
