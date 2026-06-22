import { beforeEach, describe, expect, it } from 'vitest';
import { NEXUS_ID } from '../engine/boardFactory';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES, type GameSession, type Question } from '../types';

const bank: Question[] = CATEGORIES.map((category, index) => ({
	id: index + 1,
	category,
	targetAudience: 'BOTH', // eligible for both KID and ADULT players
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

describe('gameStore turn loop', () => {
	beforeEach(() => start());

	it('starts at the first player in the transition phase', () => {
		const s = useGameStore.getState();
		expect(s.phase).toBe('TURN_TRANSITION');
		expect(s.currentPlayerIndex).toBe(0);
		expect(s.players).toHaveLength(2);
	});

	it('rolls the dice and exposes legal destinations', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		expect(useGameStore.getState().phase).toBe('ROLLING_DICE');
		s.rollDice(1);
		const next = useGameStore.getState();
		expect(next.phase).toBe('AWAITING_MOVE');
		expect(next.dice).toBe(1);
		expect(next.validMoves.length).toBeGreaterThan(0);
	});

	it('opens a question when moving onto a category tile', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		s.rollDice(1);
		const target = useGameStore.getState().validMoves[0];
		s.moveTo(target);
		const next = useGameStore.getState();
		expect(next.phase).toBe('QUESTION_ACTIVE');
		expect(next.activeQuestion).not.toBeNull();
	});

	it('grants another roll for the same player on a correct answer', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		s.rollDice(1);
		s.moveTo(useGameStore.getState().validMoves[0]);
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		s.answerQuestion(correct);
		expect(useGameStore.getState().phase).toBe('FEEDBACK');
		expect(useGameStore.getState().lastOutcome?.correct).toBe(true);
		s.continueAfterFeedback();
		const next = useGameStore.getState();
		expect(next.phase).toBe('ROLLING_DICE');
		expect(next.currentPlayerIndex).toBe(0);
	});

	it('passes the turn to the next player on a wrong answer', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		s.rollDice(1);
		s.moveTo(useGameStore.getState().validMoves[0]);
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		s.answerQuestion(correct === 0 ? 1 : 0);
		s.continueAfterFeedback();
		const next = useGameStore.getState();
		expect(next.phase).toBe('TURN_TRANSITION');
		expect(next.currentPlayerIndex).toBe(1);
	});

	it('collects a Spark when answering correctly on a Spark Node', () => {
		const s = useGameStore.getState();
		s.confirmTurnTransition();
		s.rollDice(4);
		const board = useGameStore.getState().board;
		const sparkMove = useGameStore
			.getState()
			.validMoves.find((id) => board.nodes[id].type === 'SPARK_NODE');
		expect(sparkMove).toBeDefined();
		s.moveTo(sparkMove!);
		const category = board.nodes[sparkMove!].category;
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		s.answerQuestion(correct);
		const outcome = useGameStore.getState().lastOutcome;
		expect(outcome?.collectedSpark).toBe(category);
		expect(useGameStore.getState().players[0].sparks).toContain(category);
	});
});

describe('gameStore victory loop (Conclave)', () => {
	beforeEach(() => start());

	// Places player 0 on a spoke tile next to the Nexus, holding all six Sparks.
	const armChallenger = (): number => {
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
		return spokeInner!.id;
	};

	const reachNexus = () => {
		useGameStore.getState().confirmTurnTransition();
		expect(useGameStore.getState().phase).toBe('ROLLING_DICE');
		useGameStore.getState().rollDice(1);
		expect(useGameStore.getState().validMoves).toContain(NEXUS_ID);
		useGameStore.getState().moveTo(NEXUS_ID);
	};

	it('keeps the Nexus out of reach without the six Sparks', () => {
		const board = useGameStore.getState().board;
		const spokeInner = board.nodes.find(
			(node) => node.type === 'NORMAL' && node.connectedNodeIds.includes(NEXUS_ID),
		);
		const players = useGameStore
			.getState()
			.players.map((player, index) =>
				index === 0 ? { ...player, position: spokeInner!.id } : player,
			);
		useGameStore.setState({ players, currentPlayerIndex: 0, phase: 'ROLLING_DICE' });
		useGameStore.getState().rollDice(1);
		expect(useGameStore.getState().validMoves).not.toContain(NEXUS_ID);
	});

	it('opens the Conclave when the challenger enters the Nexus with six Sparks', () => {
		armChallenger();
		reachNexus();
		expect(useGameStore.getState().phase).toBe('CONCLAVE_VOTE');
	});

	it('wins the game on a correct final answer', () => {
		armChallenger();
		reachNexus();
		useGameStore.getState().voteConclaveCategory('CYAN_SCI');
		expect(useGameStore.getState().phase).toBe('CONCLAVE_HANDOFF');
		useGameStore.getState().confirmConclaveHandoff();
		expect(useGameStore.getState().phase).toBe('CONCLAVE_QUESTION');
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		useGameStore.getState().answerQuestion(correct);
		expect(useGameStore.getState().phase).toBe('FEEDBACK');
		useGameStore.getState().continueAfterFeedback();
		expect(useGameStore.getState().phase).toBe('VICTORY');
		expect(useGameStore.getState().winnerIndex).toBe(0);
	});

	it('keeps the challenger on the Nexus and retries the Conclave after a wrong answer', () => {
		armChallenger();
		reachNexus();
		useGameStore.getState().voteConclaveCategory('CYAN_SCI');
		useGameStore.getState().confirmConclaveHandoff();
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		useGameStore.getState().answerQuestion(correct === 0 ? 1 : 0);
		useGameStore.getState().continueAfterFeedback();

		const afterFail = useGameStore.getState();
		expect(afterFail.phase).toBe('TURN_TRANSITION');
		expect(afterFail.currentPlayerIndex).toBe(1);
		expect(afterFail.players[0].sparks).toHaveLength(CATEGORIES.length);
		expect(afterFail.players[0].position).toBe(NEXUS_ID);

		// Back to the challenger: the Conclave reopens instead of a dice roll.
		useGameStore.setState({ currentPlayerIndex: 0, phase: 'TURN_TRANSITION' });
		useGameStore.getState().confirmTurnTransition();
		expect(useGameStore.getState().phase).toBe('CONCLAVE_VOTE');
	});
});

describe('gameStore KID wildcards', () => {
	beforeEach(() => start());

	const openQuestion = () => {
		useGameStore.getState().confirmTurnTransition();
		useGameStore.getState().rollDice(1);
		useGameStore.getState().moveTo(useGameStore.getState().validMoves[0]);
		expect(useGameStore.getState().phase).toBe('QUESTION_ACTIVE');
	};

	it('50/50 hides exactly two wrong options once and keeps the correct one', () => {
		openQuestion();
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		useGameStore.getState().useFiftyFifty();
		const s = useGameStore.getState();
		expect(s.hiddenOptions).toHaveLength(2);
		expect(s.hiddenOptions).not.toContain(correct);
		expect(s.players[0].usedWildcards.fiftyFifty).toBe(true);

		useGameStore.getState().useFiftyFifty(); // second use is a no-op
		expect(useGameStore.getState().hiddenOptions).toHaveLength(2);
	});

	it('Change swaps the question keeping no stale aid, once', () => {
		openQuestion();
		useGameStore.getState().useChange();
		const s = useGameStore.getState();
		expect(s.players[0].usedWildcards.change).toBe(true);
		expect(s.hiddenOptions).toHaveLength(0);
		expect(s.phase).toBe('QUESTION_ACTIVE');
		expect(s.activeQuestion).not.toBeNull();

		useGameStore.getState().useChange(); // second use is a no-op
		expect(useGameStore.getState().activeQuestion).not.toBeNull();
	});

	it('2nd Chance reopens the same question with the failed option locked', () => {
		openQuestion();
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		const wrong = correct === 0 ? 1 : 0;
		useGameStore.getState().answerQuestion(wrong);
		expect(useGameStore.getState().phase).toBe('FEEDBACK');

		useGameStore.getState().useSecondChance();
		const s = useGameStore.getState();
		expect(s.phase).toBe('QUESTION_ACTIVE');
		expect(s.lockedOptions).toContain(wrong);
		expect(s.players[0].usedWildcards.secondChance).toBe(true);

		// Answering correctly now resolves the turn normally.
		useGameStore.getState().answerQuestion(correct);
		expect(useGameStore.getState().lastOutcome?.correct).toBe(true);
	});

	it('tracks wildcards per player', () => {
		openQuestion();
		useGameStore.getState().useFiftyFifty();
		const correct = useGameStore.getState().activeQuestion!.correctAnswerIndex;
		useGameStore.getState().answerQuestion(correct === 0 ? 1 : 0); // wrong → turn passes
		useGameStore.getState().continueAfterFeedback();

		const s = useGameStore.getState();
		expect(s.currentPlayerIndex).toBe(1);
		expect(s.players[0].usedWildcards.fiftyFifty).toBe(true);
		expect(s.players[1].usedWildcards.fiftyFifty).toBe(false);
	});
});

describe('gameStore session migration (regression)', () => {
	// Regression: a session saved before wildcards existed has players without
	// `usedWildcards`, which hid the wildcard bar after resuming. Hydrate must backfill it.
	it('backfills usedWildcards when hydrating a pre-H4 session', () => {
		const legacyPlayers = [
			{ id: 'p0-TRIANGLE', name: 'Ada', shape: 'TRIANGLE', position: 0, sparks: [] },
			{ id: 'p1-SQUARE', name: 'Bob', shape: 'SQUARE', position: 0, sparks: [] },
		];
		const session = {
			id: 1,
			players: legacyPlayers,
			currentPlayerIndex: 0,
			phase: 'TURN_TRANSITION' as const,
			updatedAt: 0,
		};

		useGameStore.getState().hydrate(session as unknown as GameSession, bank);

		const players = useGameStore.getState().players;
		expect(players[0].usedWildcards).toEqual({
			fiftyFifty: false,
			change: false,
			secondChance: false,
		});
		expect(players[1].usedWildcards.fiftyFifty).toBe(false);
		// pre-H5 sessions have no level / pendingConclaveCategory either
		expect(players[0].level).toBe('KID');
		expect(players[0].pendingConclaveCategory).toBeNull();
	});
});

describe('gameStore ADULT flow', () => {
	beforeEach(() => start('ADULT'));

	const openAdultQuestion = () => {
		useGameStore.getState().confirmTurnTransition();
		useGameStore.getState().rollDice(1);
		useGameStore.getState().moveTo(useGameStore.getState().validMoves[0]);
		expect(useGameStore.getState().phase).toBe('QUESTION_ACTIVE');
		expect(useGameStore.getState().activeQuestion).not.toBeNull();
	};

	it('grants another roll when an ADULT self-grades a correct answer', () => {
		openAdultQuestion();
		useGameStore.getState().revealAdultAnswer();
		expect(useGameStore.getState().answerRevealed).toBe(true);
		useGameStore.getState().gradeAdultAnswer(true);
		expect(useGameStore.getState().phase).toBe('FEEDBACK');
		useGameStore.getState().continueAfterFeedback();
		const s = useGameStore.getState();
		expect(s.phase).toBe('ROLLING_DICE');
		expect(s.currentPlayerIndex).toBe(0);
	});

	it('passes the turn when an ADULT self-grades a failure', () => {
		openAdultQuestion();
		useGameStore.getState().gradeAdultAnswer(false);
		useGameStore.getState().continueAfterFeedback();
		const s = useGameStore.getState();
		expect(s.phase).toBe('TURN_TRANSITION');
		expect(s.currentPlayerIndex).toBe(1);
	});

	it('expels an ADULT challenger from the Nexus on a Conclave failure and retries without re-voting', () => {
		// Arrange: ADULT player 0 with all six Sparks on a tile next to the Nexus.
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

		useGameStore.getState().confirmTurnTransition();
		useGameStore.getState().rollDice(1);
		useGameStore.getState().moveTo(NEXUS_ID);
		expect(useGameStore.getState().phase).toBe('CONCLAVE_VOTE');
		useGameStore.getState().voteConclaveCategory('CYAN_SCI');
		useGameStore.getState().confirmConclaveHandoff();
		useGameStore.getState().gradeAdultAnswer(false); // fail the final question
		useGameStore.getState().continueAfterFeedback();

		const afterFail = useGameStore.getState();
		expect(afterFail.players[0].position).not.toBe(NEXUS_ID); // expelled
		expect(afterFail.players[0].pendingConclaveCategory).toBe('CYAN_SCI');

		// Return to the Nexus → straight to the handoff (no re-vote).
		useGameStore.setState({ currentPlayerIndex: 0 });
		useGameStore.getState().confirmTurnTransition();
		useGameStore.getState().rollDice(1);
		useGameStore.getState().moveTo(NEXUS_ID);
		expect(useGameStore.getState().phase).toBe('CONCLAVE_HANDOFF');
		expect(useGameStore.getState().players[0].pendingConclaveCategory).toBeNull();
	});
});
