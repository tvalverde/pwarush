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
}

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
			players: session.players,
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

		set({ activeQuestion: null, activeNodeId: null, lastOutcome: null });
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
}));

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
		turnCount: state.turnCount + 1,
	});
};

if (import.meta.env.VITE_E2E === '1' && typeof window !== 'undefined') {
	(window as unknown as { __useGameStore: typeof useGameStore }).__useGameStore = useGameStore;
}
