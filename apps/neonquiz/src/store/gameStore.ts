import { create } from 'zustand';
import { calculateValidMoves } from '../engine/boardEngine';
import { buildFamiliarBoard, getNode, NEXUS_ID } from '../engine/boardFactory';
import { drawQuestion } from '../engine/questionPool';
import { rollDie } from '../engine/rng';
import { calculateArcadeScore } from '../engine/scoring';
import {
	type Board,
	CATEGORIES,
	type GameMode,
	type GamePhase,
	type GameSession,
	type Language,
	type Player,
	type PlayerLevel,
	type PlayerShape,
	type Question,
	type TargetAudience,
	type TriviaCategory,
	type WildcardUsage,
} from '../types';
import { playerAccent } from '../utils/players';
import { questionKey } from '../utils/questionKey';
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
	level: PlayerLevel;
	accentColor?: string;
	profileId?: number;
}

interface GameStore {
	language: Language;
	mode: GameMode;
	phase: GamePhase;
	board: Board;
	players: Player[];
	currentPlayerIndex: number;
	dice: number | null;
	validMoves: number[];
	activeNodeId: number | null;
	activeQuestion: Question | null;
	lastOutcome: AnswerOutcome | null;
	bank: Question[];
	bankSize: number;
	usedQuestionIds: number[];
	turnCount: number;
	startedAt: number | null;
	conclaveFails: number;
	conclaveCategory: TriviaCategory | null;
	isConclave: boolean;
	winnerIndex: number | null;
	hiddenOptions: number[];
	lockedOptions: number[];
	answerRevealed: boolean;
	// KID rule: at most one wildcard per question. Reset whenever a fresh question is presented
	// (roll, conclave handoff, turn change); using any wildcard sets it and a Change does NOT reset it.
	wildcardUsedThisQuestion: boolean;
	// Pause state (mirrors Sudokupado): a boolean flag, not a phase. `pausedAccumMs` banks completed
	// pauses and `pausedSince` marks the pause in progress, so the clock and the adult timer freeze.
	isPaused: boolean;
	pausedAccumMs: number;
	pausedSince: number | null;
	hapticsEnabled: boolean;

	t: (path: string) => string;
	setLanguage: (language: Language) => void;
	setHapticsEnabled: (enabled: boolean) => void;

	loadBank: (questions: Question[], usedIds?: number[]) => void;
	setQuestionAudience: (question: Question, audience: TargetAudience) => void;
	startGame: (drafts: PlayerDraft[]) => void;
	hydrate: (session: GameSession, questions: Question[], usedIds?: number[]) => void;
	resetGame: () => void;
	resetQuestionUsage: () => void;
	restartGame: () => void;
	abandonGame: () => void;
	removePlayer: (playerId: string) => void;
	resetApp: () => void;

	pauseGame: () => void;
	resumeGame: () => void;
	suspendToLobby: () => void;
	resumeSavedGame: (session: GameSession) => void;

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
	revealAdultAnswer: () => void;
	gradeAdultAnswer: (correct: boolean, answerTimeMs?: number) => void;
}

const FRESH_WILDCARDS = (): WildcardUsage => ({
	fiftyFifty: false,
	change: false,
	secondChance: false,
});

// Forced to Spanish until the question bank exists in other languages (the i18n infra and the
// `en` translations are kept for that future).
const getInitialLanguage = (): Language => 'es';

const HAPTICS_KEY = 'neonquiz:haptics';
const getInitialHaptics = (): boolean => {
	if (typeof localStorage === 'undefined') return true;
	return localStorage.getItem(HAPTICS_KEY) !== 'off';
};
const persistHaptics = (enabled: boolean): void => {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(HAPTICS_KEY, enabled ? 'on' : 'off');
};

const createPlayer = (draft: PlayerDraft, index: number): Player => ({
	id: draft.profileId != null ? `profile-${draft.profileId}` : `p${index}-${draft.shape}`,
	profileId: draft.profileId,
	name: draft.name,
	shape: draft.shape,
	level: draft.level,
	accentColor: draft.accentColor ?? playerAccent(index),
	position: NEXUS_ID,
	sparks: [],
	correct: 0,
	wrong: 0,
	usedWildcards: FRESH_WILDCARDS(),
	pendingConclaveCategory: null,
});

// Backfills fields added in later milestones so sessions saved by an earlier version
// resume cleanly (pre-H4 players have no `usedWildcards`; pre-H5 have no `level`;
// pre-H8 have no `accentColor`/answer tallies).
const normalizePlayer = (player: Player, index: number): Player => ({
	...player,
	level: player.level ?? 'KID',
	sparks: player.sparks ?? [],
	usedWildcards: player.usedWildcards ?? FRESH_WILDCARDS(),
	pendingConclaveCategory: player.pendingConclaveCategory ?? null,
	accentColor: player.accentColor ?? playerAccent(index),
	correct: player.correct ?? 0,
	wrong: player.wrong ?? 0,
	arcadeScore: player.arcadeScore ?? 0,
	arcadeCombo: player.arcadeCombo ?? 0,
	arcadeMaxCombo: player.arcadeMaxCombo ?? 0,
});

// Increments the active player's per-match answer tally.
const bumpAnswer = (players: Player[], index: number, correct: boolean): Player[] =>
	players.map((player, i) =>
		i === index
			? {
					...player,
					correct: (player.correct ?? 0) + (correct ? 1 : 0),
					wrong: (player.wrong ?? 0) + (correct ? 0 : 1),
				}
			: player,
	);

const hasAllSparks = (player: Player): boolean => player.sparks.length >= SPARKS_TO_WIN;

const FRESH_GAME: Pick<
	GameStore,
	| 'dice'
	| 'validMoves'
	| 'activeNodeId'
	| 'activeQuestion'
	| 'lastOutcome'
	| 'turnCount'
	| 'conclaveFails'
	| 'conclaveCategory'
	| 'isConclave'
	| 'winnerIndex'
	| 'hiddenOptions'
	| 'lockedOptions'
	| 'answerRevealed'
	| 'wildcardUsedThisQuestion'
	| 'isPaused'
	| 'pausedAccumMs'
	| 'pausedSince'
> = {
	dice: null,
	validMoves: [],
	activeNodeId: null,
	activeQuestion: null,
	lastOutcome: null,
	turnCount: 0,
	conclaveFails: 0,
	conclaveCategory: null,
	isConclave: false,
	winnerIndex: null,
	hiddenOptions: [],
	lockedOptions: [],
	answerRevealed: false,
	wildcardUsedThisQuestion: false,
	isPaused: false,
	pausedAccumMs: 0,
	pausedSince: null,
};

export const useGameStore = create<GameStore>()((set, get) => ({
	language: getInitialLanguage(),
	mode: 'FAMILY',
	phase: 'LOBBY',
	board: buildFamiliarBoard(),
	players: [],
	currentPlayerIndex: 0,
	bank: [],
	bankSize: 0,
	usedQuestionIds: [],
	hapticsEnabled: getInitialHaptics(),
	startedAt: null,
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

	setHapticsEnabled: (enabled) => {
		persistHaptics(enabled);
		set({ hapticsEnabled: enabled });
	},

	loadBank: (questions, usedIds = []) => {
		set({ bank: questions, bankSize: questions.length, usedQuestionIds: usedIds });
	},

	// Reroutes a question between KID/ADULT/BOTH in the live bank so it immediately stops/starts
	// appearing for the right level (the engine filters on `targetAudience`). The screen also
	// persists the override to Dexie; this only mutates in-memory state.
	setQuestionAudience: (question, audience) => {
		const key = questionKey(question);
		set((state) => ({
			bank: state.bank.map((q) =>
				questionKey(q) === key ? { ...q, targetAudience: audience } : q,
			),
		}));
	},

	startGame: (drafts) => {
		const mode: GameMode = drafts.length === 1 ? 'ARCADE' : 'FAMILY';
		set({
			mode,
			board: buildFamiliarBoard(),
			players: drafts.map((draft, index) => ({
				...createPlayer(draft, index),
				...(mode === 'ARCADE' ? { arcadeScore: 0, arcadeCombo: 0, arcadeMaxCombo: 0 } : {}),
			})),
			currentPlayerIndex: 0,
			phase: mode === 'ARCADE' ? 'ROLLING_DICE' : 'TURN_TRANSITION',
			startedAt: Date.now(),
			...FRESH_GAME,
		});
	},

	hydrate: (session, questions, usedIds = []) => {
		const mode: GameMode = session.mode ?? 'FAMILY';
		const players = session.players.map(normalizePlayer);
		const resumePlayer = players[session.currentPlayerIndex];
		// Arcade has no pass-the-device screen, so resume straight into the roll. A solo player
		// already on the Nexus with every Spark re-enters the Conclave (mirrors advanceTurn).
		const resumePhase =
			mode === 'ARCADE'
				? resumePlayer && resumePlayer.position === NEXUS_ID && hasAllSparks(resumePlayer)
					? 'CONCLAVE_VOTE'
					: 'ROLLING_DICE'
				: 'TURN_TRANSITION';
		set({
			mode,
			board: buildFamiliarBoard(),
			bank: questions,
			bankSize: questions.length,
			usedQuestionIds: usedIds,
			players,
			currentPlayerIndex: session.currentPlayerIndex,
			phase: resumePhase,
			// Reconstruct the start so the clock continues from the banked active elapsed (time spent
			// away or paused does not count). Falls back to the legacy `startedAt` for old sessions.
			startedAt:
				session.elapsedMs != null
					? Date.now() - session.elapsedMs
					: (session.startedAt ?? Date.now()),
			...FRESH_GAME,
			conclaveFails: session.conclaveFails ?? 0,
		});
	},

	resetGame: () =>
		set({ phase: 'LOBBY', players: [], currentPlayerIndex: 0, startedAt: null, ...FRESH_GAME }),

	resetQuestionUsage: () => set({ usedQuestionIds: [] }),

	abandonGame: () =>
		set({ phase: 'LOBBY', players: [], currentPlayerIndex: 0, startedAt: null, ...FRESH_GAME }),

	// Same roster, fresh state. Does NOT touch question usage.
	restartGame: () =>
		set((state) => ({
			board: buildFamiliarBoard(),
			players: state.players.map((player) => ({
				...player,
				position: NEXUS_ID,
				sparks: [],
				correct: 0,
				wrong: 0,
				usedWildcards: FRESH_WILDCARDS(),
				pendingConclaveCategory: null,
				arcadeScore: 0,
				arcadeCombo: 0,
				arcadeMaxCombo: 0,
			})),
			currentPlayerIndex: 0,
			phase: state.mode === 'ARCADE' ? 'ROLLING_DICE' : 'TURN_TRANSITION',
			startedAt: Date.now(),
			...FRESH_GAME,
		})),

	// A single player leaves; the rest continue. If fewer than two remain, the game ends.
	removePlayer: (playerId) => {
		const state = get();
		const removedIndex = state.players.findIndex((p) => p.id === playerId);
		if (removedIndex === -1) return;
		const players = state.players.filter((p) => p.id !== playerId);
		if (players.length < 2) {
			set({ phase: 'LOBBY', players: [], currentPlayerIndex: 0, startedAt: null, ...FRESH_GAME });
			return;
		}
		const shifted =
			removedIndex < state.currentPlayerIndex
				? state.currentPlayerIndex - 1
				: state.currentPlayerIndex;
		set({
			players,
			currentPlayerIndex: shifted % players.length,
			phase: state.mode === 'ARCADE' ? 'ROLLING_DICE' : 'TURN_TRANSITION',
			...FRESH_GAME,
		});
	},

	resetApp: () => {
		persistHaptics(true);
		set({
			phase: 'LOBBY',
			players: [],
			currentPlayerIndex: 0,
			usedQuestionIds: [],
			hapticsEnabled: true,
			startedAt: null,
			...FRESH_GAME,
		});
	},

	// Pauses a live game in place: the clock and the adult timer freeze. No-op in the lobby/victory
	// or when already paused.
	pauseGame: () => {
		const state = get();
		if (state.isPaused) return;
		if (state.phase === 'LOBBY' || state.phase === 'VICTORY' || state.players.length === 0) return;
		set({ isPaused: true, pausedSince: Date.now() });
	},

	// Resumes in place, banking the just-finished pause span so it never counts as play time.
	resumeGame: () => {
		const state = get();
		if (!state.isPaused) return;
		const banked = state.pausedSince !== null ? Date.now() - state.pausedSince : 0;
		set({ isPaused: false, pausedAccumMs: state.pausedAccumMs + banked, pausedSince: null });
	},

	// Leaves to the lobby while KEEPING the saved checkpoint (the autosave only clears the session
	// when the roster is emptied, e.g. on abandon). Resuming later re-enters at the turn start.
	suspendToLobby: () => set({ phase: 'LOBBY', isPaused: false, pausedSince: null }),

	// Re-enters a saved game from the lobby using the bank already loaded into the store.
	resumeSavedGame: (session) => {
		const state = get();
		state.hydrate(session, state.bank, state.usedQuestionIds);
	},

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
		const current = players[state.currentPlayerIndex];

		if (node.type === 'NEXUS') {
			// A pending Conclave (an ADULT challenger who was expelled) resumes straight at the
			// final question with the already-voted category; otherwise the rivals vote first.
			const pending = current.pendingConclaveCategory;
			if (pending) {
				const cleared = players.map((player, index) =>
					index === state.currentPlayerIndex
						? { ...player, pendingConclaveCategory: null }
						: player,
				);
				set({
					players: cleared,
					validMoves: [],
					dice: null,
					conclaveCategory: pending,
					phase: 'CONCLAVE_HANDOFF',
				});
			} else {
				set({ players, validMoves: [], dice: null, phase: 'CONCLAVE_VOTE' });
			}
			return;
		}

		if (!node.category) return;
		const { question, used } = drawQuestion(
			state.bank,
			node.category,
			current.level,
			new Set(state.usedQuestionIds),
		);
		set({
			players,
			usedQuestionIds: [...used],
			validMoves: [],
			activeNodeId: nodeId,
			activeQuestion: question,
			hiddenOptions: [],
			lockedOptions: [],
			answerRevealed: false,
			wildcardUsedThisQuestion: false,
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
				players: bumpAnswer(state.players, state.currentPlayerIndex, correct),
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

		if (state.mode === 'ARCADE') {
			const player = players[state.currentPlayerIndex];
			const result = calculateArcadeScore(
				correct,
				player.arcadeCombo ?? 0,
				player.arcadeMaxCombo ?? 0,
				player.level === 'ADULT',
				null,
			);
			players = players.map((p, i) =>
				i === state.currentPlayerIndex
					? {
							...p,
							arcadeScore: (p.arcadeScore ?? 0) + result.scoreDelta,
							arcadeCombo: result.newCombo,
							arcadeMaxCombo: result.newMaxCombo,
						}
					: p,
			);
		}

		set({
			players: bumpAnswer(players, state.currentPlayerIndex, correct),
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
				const challenger = state.players[state.currentPlayerIndex];
				if (challenger.level === 'ADULT') {
					// ADULT rule: expelled from the Nexus to an adjacent spoke tile; must travel
					// back, then retries the final question directly (no re-vote).
					const exitTile = getNode(state.board, NEXUS_ID).connectedNodeIds[0];
					const players = state.players.map((player, index) =>
						index === state.currentPlayerIndex
							? { ...player, position: exitTile, pendingConclaveCategory: state.conclaveCategory }
							: player,
					);
					set({
						players,
						activeQuestion: null,
						lastOutcome: null,
						isConclave: false,
						answerRevealed: false,
						conclaveCategory: null,
						conclaveFails: state.conclaveFails + 1,
					});
				} else {
					// KID rule: keeps every Spark and stays on the Nexus; the Conclave reopens
					// on their next turn (via confirmTurnTransition).
					set({
						activeQuestion: null,
						lastOutcome: null,
						isConclave: false,
						answerRevealed: false,
						conclaveCategory: null,
						conclaveFails: state.conclaveFails + 1,
					});
				}
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
		const state = get();
		const category = state.conclaveCategory;
		if (!category) return;
		const { question, used } = drawQuestion(
			state.bank,
			category,
			state.players[state.currentPlayerIndex].level,
			new Set(state.usedQuestionIds),
		);
		set({
			activeQuestion: question,
			usedQuestionIds: [...used],
			activeNodeId: null,
			isConclave: true,
			answerRevealed: false,
			wildcardUsedThisQuestion: false,
			phase: 'CONCLAVE_QUESTION',
		});
	},

	// KID wildcards — one use per player per game (tracked on the player) AND, in KID mode, at most
	// one wildcard per question (tracked by `wildcardUsedThisQuestion`).
	useFiftyFifty: () => {
		const state = get();
		const player = state.players[state.currentPlayerIndex];
		const question = state.activeQuestion;
		if (
			state.phase !== 'QUESTION_ACTIVE' ||
			!question ||
			player.usedWildcards.fiftyFifty ||
			(player.level === 'KID' && state.wildcardUsedThisQuestion)
		) {
			return;
		}

		const wrong = [0, 1, 2, 3].filter((i) => i !== question.correctAnswerIndex);
		const toHide = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
		set({
			hiddenOptions: toHide,
			wildcardUsedThisQuestion: true,
			players: markWildcard(state.players, state.currentPlayerIndex, 'fiftyFifty'),
		});
	},

	useChange: () => {
		const state = get();
		const player = state.players[state.currentPlayerIndex];
		const question = state.activeQuestion;
		if (
			state.phase !== 'QUESTION_ACTIVE' ||
			!question ||
			player.usedWildcards.change ||
			(player.level === 'KID' && state.wildcardUsedThisQuestion)
		) {
			return;
		}

		const { question: swapped, used } = drawQuestion(
			state.bank,
			question.category,
			player.level,
			new Set(state.usedQuestionIds),
		);
		set({
			activeQuestion: swapped ?? question,
			usedQuestionIds: [...used],
			hiddenOptions: [],
			lockedOptions: [],
			// A Change spends the per-question allowance: the swapped question keeps the flag set,
			// so a KID can't also use 50/50 on the replacement.
			wildcardUsedThisQuestion: true,
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
			player.usedWildcards.secondChance ||
			(player.level === 'KID' && state.wildcardUsedThisQuestion)
		) {
			return;
		}
		set({
			phase: 'QUESTION_ACTIVE',
			lastOutcome: null,
			answerRevealed: false,
			wildcardUsedThisQuestion: true,
			lockedOptions: [...state.lockedOptions, outcome.selectedIndex],
			players: markWildcard(state.players, state.currentPlayerIndex, 'secondChance'),
		});
	},

	// Declining the 2nd chance reveals the correct answer (for learning) before the turn passes.
	revealAnswer: () => set({ answerRevealed: true }),

	// ADULT flow: read → reveal the correct answer → self-grade ("I was right" / "I failed").
	revealAdultAnswer: () => {
		const state = get();
		if (state.phase !== 'QUESTION_ACTIVE' && state.phase !== 'CONCLAVE_QUESTION') return;
		set({ answerRevealed: true });
	},

	gradeAdultAnswer: (correct, answerTimeMs) => {
		const state = get();
		const question = state.activeQuestion;
		if (!question) return;
		if (state.phase !== 'QUESTION_ACTIVE' && state.phase !== 'CONCLAVE_QUESTION') return;

		if (state.isConclave) {
			set({
				players: bumpAnswer(state.players, state.currentPlayerIndex, correct),
				phase: 'FEEDBACK',
				answerRevealed: true,
				lastOutcome: {
					correct,
					selectedIndex: -1,
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

		if (state.mode === 'ARCADE') {
			const player = players[state.currentPlayerIndex];
			const result = calculateArcadeScore(
				correct,
				player.arcadeCombo ?? 0,
				player.arcadeMaxCombo ?? 0,
				player.level === 'ADULT',
				answerTimeMs ?? null,
			);
			players = players.map((p, i) =>
				i === state.currentPlayerIndex
					? {
							...p,
							arcadeScore: (p.arcadeScore ?? 0) + result.scoreDelta,
							arcadeCombo: result.newCombo,
							arcadeMaxCombo: result.newMaxCombo,
						}
					: p,
			);
		}

		set({
			players: bumpAnswer(players, state.currentPlayerIndex, correct),
			phase: 'FEEDBACK',
			answerRevealed: true,
			lastOutcome: {
				correct,
				selectedIndex: -1,
				correctIndex: question.correctAnswerIndex,
				collectedSpark,
			},
		});
	},
}));

const markWildcard = (players: Player[], index: number, key: keyof WildcardUsage): Player[] =>
	players.map((player, i) =>
		i === index ? { ...player, usedWildcards: { ...player.usedWildcards, [key]: true } } : player,
	);

type SetState = (partial: Partial<GameStore>) => void;

const advanceTurn = (set: SetState): void => {
	const state = useGameStore.getState();
	const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
	const nextPlayer = state.players[nextIndex];
	const nextPhase =
		state.mode === 'ARCADE'
			? nextPlayer.position === NEXUS_ID && hasAllSparks(nextPlayer)
				? 'CONCLAVE_VOTE'
				: 'ROLLING_DICE'
			: 'TURN_TRANSITION';
	set({
		currentPlayerIndex: nextIndex,
		phase: nextPhase,
		dice: null,
		validMoves: [],
		activeNodeId: null,
		activeQuestion: null,
		lastOutcome: null,
		hiddenOptions: [],
		lockedOptions: [],
		answerRevealed: false,
		wildcardUsedThisQuestion: false,
		turnCount: state.turnCount + 1,
	});
};

if (import.meta.env.VITE_E2E === '1' && typeof window !== 'undefined') {
	(window as unknown as { __useGameStore: typeof useGameStore }).__useGameStore = useGameStore;
}
