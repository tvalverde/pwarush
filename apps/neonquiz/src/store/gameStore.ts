import { create } from 'zustand';
import { calculateValidMoves } from '../engine/boardEngine';
import { buildFamiliarBoard, getNode, NEXUS_ID } from '../engine/boardFactory';
import { createQuestionPool, type QuestionPool } from '../engine/questionPool';
import { rollDie } from '../engine/rng';
import type {
	Board,
	GamePhase,
	GameSession,
	Language,
	Player,
	PlayerShape,
	Question,
	TriviaCategory,
} from '../types';
import { translations } from '../utils/translations';

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

export const useGameStore = create<GameStore>()((set, get) => ({
	language: getInitialLanguage(),
	phase: 'LOBBY',
	board: buildFamiliarBoard(),
	players: [],
	currentPlayerIndex: 0,
	dice: null,
	validMoves: [],
	activeNodeId: null,
	activeQuestion: null,
	lastOutcome: null,
	bankSize: 0,

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
			dice: null,
			validMoves: [],
			activeNodeId: null,
			activeQuestion: null,
			lastOutcome: null,
		}),

	hydrate: (session, questions) => {
		pool = createQuestionPool(questions);
		set({
			board: buildFamiliarBoard(),
			players: session.players,
			currentPlayerIndex: session.currentPlayerIndex,
			phase: 'TURN_TRANSITION',
			dice: null,
			validMoves: [],
			activeNodeId: null,
			activeQuestion: null,
			lastOutcome: null,
			bankSize: questions.length,
		});
	},

	resetGame: () =>
		set({
			phase: 'LOBBY',
			players: [],
			currentPlayerIndex: 0,
			dice: null,
			validMoves: [],
			activeNodeId: null,
			activeQuestion: null,
			lastOutcome: null,
		}),

	confirmTurnTransition: () => set({ phase: 'ROLLING_DICE' }),

	rollDice: (roll) => {
		const state = get();
		const value = roll ?? rollDie();
		const player = state.players[state.currentPlayerIndex];
		const validMoves = calculateValidMoves(state.board, player.position, value);
		set({ dice: value, validMoves, phase: 'AWAITING_MOVE' });
	},

	moveTo: (nodeId) => {
		const state = get();
		if (!state.validMoves.includes(nodeId)) return;
		const players = state.players.map((player, index) =>
			index === state.currentPlayerIndex ? { ...player, position: nodeId } : player,
		);
		const node = getNode(state.board, nodeId);

		if (node.type === 'NEXUS' || node.category === null) {
			set({ players, validMoves: [], dice: null });
			advanceTurn(set);
			return;
		}

		const question = pool.draw(node.category);
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
		const nodeId = state.activeNodeId;
		if (!question || nodeId === null) return;

		const correct = selectedIndex === question.correctAnswerIndex;
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
		set({ activeQuestion: null, activeNodeId: null, lastOutcome: null });
		if (correct) {
			set({ phase: 'ROLLING_DICE', dice: null, validMoves: [] });
		} else {
			advanceTurn(set);
		}
	},

	skipTurn: () => advanceTurn(set),
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
	});
};

if (import.meta.env.VITE_E2E === '1' && typeof window !== 'undefined') {
	(window as unknown as { __useGameStore: typeof useGameStore }).__useGameStore = useGameStore;
}
