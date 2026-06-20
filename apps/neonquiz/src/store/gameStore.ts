import { create } from 'zustand';
import { calculateValidMoves } from '../engine/boardEngine';
import { buildFamiliarBoard, getNode, NEXUS_ID } from '../engine/boardFactory';
import { createQuestionPool, type QuestionPool } from '../engine/questionPool';
import { rollDie } from '../engine/rng';
import {
	type Board,
	CATEGORIES,
	type GamePhase,
	type GameSession,
	type Language,
	type Player,
	type PlayerShape,
	type Question,
	type TriviaCategory,
	type WildcardUsage,
} from '../types';
import { translations } from '../utils/translations';

const SPARKS_TO_WIN = CATEGORIES.length;

export interface AnswerOutcome {
	correct: boolean;
	selectedIndex: number;
	correctIndex: number;
	collectedSpark: TriviaCategory | null;
}

export interface PlayerDraft {
	name: string;
	shape: PlayerShape;
}

interface GameStore {
	language: Language;
	phase: GamePhase;
	board: Board;
	players: Player[];
	currentPlayerIndex: number;
	dice: number | null;
	validMoves: number[];
	activeNodeId: number | null;
	activeQuestion: Question | null;
	lastOutcome: AnswerOutcome | null;
	bankSize: number;
	turnCount: number;
	conclaveCategory: TriviaCategory | null;
	isConclave: boolean;
	winnerIndex: number | null;
	hiddenOptions: number[];
	lockedOptions: number[];
	answerRevealed: boolean;

	t: (path: string) => string;
	setLanguage: (language: Language) => void;

	loadBank: (questions: Question[]) => void;
	startGame: (drafts: PlayerDraft[]) => void;
	hydrate: (session: GameSession, questions: Question[]) => void;
	resetGame: () => void;

	confirmTurnTransition: () => void;
	rollDice: (roll?: number) => void;
	moveTo: (nodeId: number) => void;
	answerQuestion: (selectedIndex: number) => void;
	continueAfterFeedback: () => void;
	skipTurn: () => void;
	voteConclaveCategory: (category: TriviaCategory) => void;
	confirmConclaveHandoff: () => void;
	useFiftyFifty: () => void;
	useChange: () => void;
	useSecondChance: () => void;
	revealAnswer: () => void;
}

const FRESH_WILDCARDS = (): WildcardUsage => ({
	fiftyFifty: false,
	change: false,
	secondChance: false,
});

let pool: QuestionPool = createQuestionPool([]);

const getInitialLanguage = (): Language => {
	if (typeof navigator === 'undefined') return 'es';
	return navigator.language.split('-')[0] === 'en' ? 'en' : 'es';
};

const createPlayer = (draft: PlayerDraft, index: number): Player => ({
	id: `p${index}-${draft.shape}`,
	name: draft.name,
	shape: draft.shape,
	position: NEXUS_ID,
	sparks: [],
	usedWildcards: FRESH_WILDCARDS(),
});

// Backfills fields added in later milestones so sessions saved by an earlier version
// resume cleanly (e.g. pre-H4 players have no `usedWildcards`).
const normalizePlayer = (player: Player): Player => ({
	...player,
	sparks: player.sparks ?? [],
	usedWildcards: player.usedWildcards ?? FRESH_WILDCARDS(),
});

const hasAllSparks = (player: Player): boolean => player.sparks.length >= SPARKS_TO_WIN;

const FRESH_GAME: Pick<
	GameStore,
	| 'dice'
	| 'validMoves'
	| 'activeNodeId'
	| 'activeQuestion'
	| 'lastOutcome'
	| 'turnCount'
	| 'conclaveCategory'
	| 'isConclave'
	| 'winnerIndex'
	| 'hiddenOptions'
	| 'lockedOptions'
	| 'answerRevealed'
> = {
	dice: null,
	validMoves: [],
	activeNodeId: null,
	activeQuestion: null,
	lastOutcome: null,
	turnCount: 0,
	conclaveCategory: null,
	isConclave: false,
	winnerIndex: null,
	hiddenOptions: [],
	lockedOptions: [],
	answerRevealed: false,
};

export const useGameStore = create<GameStore>()((set, get) => ({
	language: getInitialLanguage(),
	phase: 'LOBBY',
	board: buildFamiliarBoard(),
	players: [],
	currentPlayerIndex: 0,
	bankSize: 0,
	...FRESH_GAME,

	t: (path) => {
		const lang = get().language;
		const keys = path.split('.');
		let value: unknown = translations[lang];
		for (const key of keys) {
			if (typeof value === 'object' && value !== null && key in value) {
				value = (value as Record<string, unknown>)[key];
			} else {
				return path;
			}
		}
		return typeof value === 'string' ? value : path;
	},

	setLanguage: (language) => set({ language }),

	loadBank: (questions) => {
		pool = createQuestionPool(questions);
		set({ bankSize: questions.length });
	},

	startGame: (drafts) =>
		set({
			board: buildFamiliarBoard(),
			players: drafts.map(createPlayer),
			currentPlayerIndex: 0,
			phase: 'TURN_TRANSITION',
			...FRESH_GAME,
		}),

	hydrate: (session, questions) => {
		pool = createQuestionPool(questions);
		set({
			board: buildFamiliarBoard(),
			players: session.players.map(normalizePlayer),
			currentPlayerIndex: session.currentPlayerIndex,
			phase: 'TURN_TRANSITION',
			bankSize: questions.length,
			...FRESH_GAME,
		});
	},

	resetGame: () => set({ phase: 'LOBBY', players: [], currentPlayerIndex: 0, ...FRESH_GAME }),

	// At the start of a turn a challenger already standing on the Nexus with every Spark
	// re-enters the Conclave (the KID retry rule); everyone else rolls.
	confirmTurnTransition: () => {
		const state = get();
		const player = state.players[state.currentPlayerIndex];
		if (player && player.position === NEXUS_ID && hasAllSparks(player)) {
			set({ phase: 'CONCLAVE_VOTE' });
		} else {
			set({ phase: 'ROLLING_DICE' });
		}
	},

	rollDice: (roll) => {
		const state = get();
		const value = roll ?? rollDie();
		const player = state.players[state.currentPlayerIndex];
		const validMoves = calculateValidMoves(state.board, player.position, value, {
			nexusUnlocked: hasAllSparks(player),
		});
		set({ dice: value, validMoves, phase: 'AWAITING_MOVE' });
	},

	moveTo: (nodeId) => {
		const state = get();
		if (!state.validMoves.includes(nodeId)) return;
		const players = state.players.map((player, index) =>
			index === state.currentPlayerIndex ? { ...player, position: nodeId } : player,
		);
		const node = getNode(state.board, nodeId);

		if (node.type === 'NEXUS') {
			set({ players, validMoves: [], dice: null, phase: 'CONCLAVE_VOTE' });
			return;
		}

		const question = node.category ? pool.draw(node.category) : null;
		set({
			players,
			validMoves: [],
			activeNodeId: nodeId,
			activeQuestion: question,
			hiddenOptions: [],
			lockedOptions: [],
			answerRevealed: false,
			phase: 'QUESTION_ACTIVE',
		});
	},

	answerQuestion: (selectedIndex) => {
		const state = get();
		const question = state.activeQuestion;
		if (!question) return;
		const correct = selectedIndex === question.correctAnswerIndex;

		if (state.isConclave) {
			set({
				phase: 'FEEDBACK',
				lastOutcome: {
					correct,
					selectedIndex,
					correctIndex: question.correctAnswerIndex,
					collectedSpark: null,
				},
			});
			return;
		}

		const nodeId = state.activeNodeId;
		if (nodeId === null) return;
		const node = getNode(state.board, nodeId);
		let collectedSpark: TriviaCategory | null = null;
		let players = state.players;

		if (correct && node.type === 'SPARK_NODE' && node.category) {
			const current = state.players[state.currentPlayerIndex];
			if (!current.sparks.includes(node.category)) {
				collectedSpark = node.category;
				players = state.players.map((player, index) =>
					index === state.currentPlayerIndex
						? { ...player, sparks: [...player.sparks, node.category as TriviaCategory] }
						: player,
				);
			}
		}

		set({
			players,
			phase: 'FEEDBACK',
			lastOutcome: {
				correct,
				selectedIndex,
				correctIndex: question.correctAnswerIndex,
				collectedSpark,
			},
		});
	},

	continueAfterFeedback: () => {
		const state = get();
		const correct = state.lastOutcome?.correct ?? false;

		if (state.isConclave) {
			if (correct) {
				set({
					phase: 'VICTORY',
					winnerIndex: state.currentPlayerIndex,
					activeQuestion: null,
					lastOutcome: null,
					isConclave: false,
				});
			} else {
				// KID rule: the challenger keeps every Spark and stays on the Nexus; the
				// Conclave reopens on their next turn (via confirmTurnTransition).
				set({ activeQuestion: null, lastOutcome: null, isConclave: false, conclaveCategory: null });
				advanceTurn(set);
			}
			return;
		}

		set({
			activeQuestion: null,
			activeNodeId: null,
			lastOutcome: null,
			hiddenOptions: [],
			lockedOptions: [],
			answerRevealed: false,
		});
		if (correct) {
			set({ phase: 'ROLLING_DICE', dice: null, validMoves: [] });
		} else {
			advanceTurn(set);
		}
	},

	skipTurn: () => advanceTurn(set),

	voteConclaveCategory: (category) =>
		set({ conclaveCategory: category, phase: 'CONCLAVE_HANDOFF' }),

	confirmConclaveHandoff: () => {
		const category = get().conclaveCategory;
		if (!category) return;
		set({
			activeQuestion: pool.draw(category),
			activeNodeId: null,
			isConclave: true,
			phase: 'CONCLAVE_QUESTION',
		});
	},

	// KID wildcards — one use per player per game, tracked on the player.
	useFiftyFifty: () => {
		const state = get();
		const player = state.players[state.currentPlayerIndex];
		const question = state.activeQuestion;
		if (state.phase !== 'QUESTION_ACTIVE' || !question || player.usedWildcards.fiftyFifty) return;

		const wrong = [0, 1, 2, 3].filter((i) => i !== question.correctAnswerIndex);
		const toHide = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
		set({
			hiddenOptions: toHide,
			players: markWildcard(state.players, state.currentPlayerIndex, 'fiftyFifty'),
		});
	},

	useChange: () => {
		const state = get();
		const player = state.players[state.currentPlayerIndex];
		const question = state.activeQuestion;
		if (state.phase !== 'QUESTION_ACTIVE' || !question || player.usedWildcards.change) return;

		set({
			activeQuestion: pool.draw(question.category) ?? question,
			hiddenOptions: [],
			lockedOptions: [],
			players: markWildcard(state.players, state.currentPlayerIndex, 'change'),
		});
	},

	useSecondChance: () => {
		const state = get();
		const player = state.players[state.currentPlayerIndex];
		const outcome = state.lastOutcome;
		if (
			state.phase !== 'FEEDBACK' ||
			state.isConclave ||
			!outcome ||
			outcome.correct ||
			player.usedWildcards.secondChance
		) {
			return;
		}
		set({
			phase: 'QUESTION_ACTIVE',
			lastOutcome: null,
			answerRevealed: false,
			lockedOptions: [...state.lockedOptions, outcome.selectedIndex],
			players: markWildcard(state.players, state.currentPlayerIndex, 'secondChance'),
		});
	},

	// Declining the 2nd chance reveals the correct answer (for learning) before the turn passes.
	revealAnswer: () => set({ answerRevealed: true }),
}));

const markWildcard = (players: Player[], index: number, key: keyof WildcardUsage): Player[] =>
	players.map((player, i) =>
		i === index ? { ...player, usedWildcards: { ...player.usedWildcards, [key]: true } } : player,
	);

type SetState = (partial: Partial<GameStore>) => void;

const advanceTurn = (set: SetState): void => {
	const state = useGameStore.getState();
	const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
	set({
		currentPlayerIndex: nextIndex,
		phase: 'TURN_TRANSITION',
		dice: null,
		validMoves: [],
		activeNodeId: null,
		activeQuestion: null,
		lastOutcome: null,
		hiddenOptions: [],
		lockedOptions: [],
		answerRevealed: false,
		turnCount: state.turnCount + 1,
	});
};

if (import.meta.env.VITE_E2E === '1' && typeof window !== 'undefined') {
	(window as unknown as { __useGameStore: typeof useGameStore }).__useGameStore = useGameStore;
}
