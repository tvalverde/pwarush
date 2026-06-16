import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { db } from '../db/database';
import { type HintResult, nextHint } from '../engine/hint';
import type { Case, CellRef, PersonId, Placement } from '../engine/types';
import type { Difficulty, GameSnapshot, Language, ScreenType } from '../types';
import { isCaseSolved, personAt, sceneOf, violatedClueCount } from '../utils/caseState';
import { translations } from '../utils/translations';

export interface GameResult {
	timeElapsed: number;
	mistakes: number;
	difficulty: Difficulty;
	murdererId: PersonId;
	victimId: PersonId;
	hintsUsed: number;
}

interface DialogState {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel?: () => void;
	confirmText?: string;
	cancelText?: string;
	type?: 'danger' | 'info';
}

interface GameStore {
	// Navigation & UI
	activeScreen: ScreenType;
	activePlayerId: number | null;
	selectedDifficulty: Difficulty;
	language: Language;
	dialog: DialogState;
	lastResult: GameResult | null;

	setScreen: (screen: ScreenType) => void;
	setActivePlayer: (playerId: number | null) => Promise<void>;
	setDifficulty: (difficulty: Difficulty) => Promise<void>;
	setLanguage: (lang: Language) => void;
	setLastResult: (result: GameResult | null) => void;
	t: (path: string) => string;
	showDialog: (config: Omit<DialogState, 'isOpen'>) => void;
	closeDialog: () => void;

	// Game play
	hasActiveGame: boolean;
	activeCase: Case | null;
	placement: Placement;
	checkedClues: number[];
	clueOrder: number[];
	mistakes: number;
	timeElapsed: number;
	isPaused: boolean;
	selectedPersonId: PersonId | null;
	revealedMurderer: PersonId | null;
	hintsUsed: number;
	currentHint: HintResult | null;

	initGame: (activeCase: Case) => void;
	resumeGame: (snapshot: GameSnapshot) => void;
	restartGame: () => void;
	clearActiveGame: () => void;
	selectPerson: (personId: PersonId | null) => void;
	placePerson: (personId: PersonId, cell: CellRef) => { violates: boolean; isSolved: boolean };
	eraseCell: (cell: CellRef) => void;
	erasePerson: (personId: PersonId) => void;
	toggleClueCheck: (index: number) => void;
	incrementTime: () => void;
	setPaused: (paused: boolean) => void;
	requestHint: () => void;
	applyHint: () => void;
	clearHint: () => void;
}

const getInitialLanguage = (): Language => {
	if (typeof navigator === 'undefined') return 'en';
	return navigator.language.split('-')[0] === 'es' ? 'es' : 'en';
};

const DEFAULT_DIFFICULTY: Difficulty = 'beginner';

const range = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

// Rebuilds the display order for a resumed game: unchecked clues keep their natural
// order at the front, checked clues sink to the back (in the order they were checked).
const orderWithCheckedLast = (count: number, checked: number[]): number[] => {
	const unchecked = range(count).filter((index) => !checked.includes(index));
	const checkedInOrder = checked.filter((index) => index < count);
	return [...unchecked, ...checkedInOrder];
};

export const useGameStore = create<GameStore>()(
	persist(
		(set, get) => ({
			activeScreen: 'main',
			activePlayerId: null,
			selectedDifficulty: DEFAULT_DIFFICULTY,
			language: getInitialLanguage(),
			dialog: { isOpen: false, title: '', message: '', onConfirm: () => {} },
			lastResult: null,

			hasActiveGame: false,
			activeCase: null,
			placement: {},
			checkedClues: [],
			clueOrder: [],
			mistakes: 0,
			timeElapsed: 0,
			isPaused: false,
			selectedPersonId: null,
			revealedMurderer: null,
			hintsUsed: 0,
			currentHint: null,

			setScreen: (activeScreen) => set({ activeScreen }),

			setActivePlayer: async (playerId) => {
				if (!playerId) {
					set({ activePlayerId: null, selectedDifficulty: DEFAULT_DIFFICULTY });
					return;
				}
				const prefs = await db.preferences.where('playerId').equals(playerId).first();
				if (prefs) {
					set({ activePlayerId: playerId, selectedDifficulty: prefs.difficulty });
				} else {
					set({ activePlayerId: playerId, selectedDifficulty: DEFAULT_DIFFICULTY });
					await db.preferences.add({ playerId, difficulty: DEFAULT_DIFFICULTY });
				}
			},

			setDifficulty: async (difficulty) => {
				set({ selectedDifficulty: difficulty });
				const { activePlayerId } = get();
				if (!activePlayerId) return;
				try {
					await db.preferences.where('playerId').equals(activePlayerId).modify({ difficulty });
				} catch (err) {
					console.error('Failed to persist preferences:', err);
				}
			},

			setLanguage: (language) => set({ language }),
			setLastResult: (lastResult) => set({ lastResult }),

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

			showDialog: (config) => set({ dialog: { ...config, isOpen: true } }),
			closeDialog: () => set((state) => ({ dialog: { ...state.dialog, isOpen: false } })),

			initGame: (activeCase) =>
				set({
					hasActiveGame: true,
					activeCase,
					placement: {},
					checkedClues: [],
					clueOrder: range(activeCase.clues.length),
					mistakes: 0,
					timeElapsed: 0,
					isPaused: false,
					selectedPersonId: null,
					revealedMurderer: null,
					hintsUsed: 0,
					currentHint: null,
					selectedDifficulty: activeCase.difficulty,
					activeScreen: 'game',
					lastResult: null,
				}),

			resumeGame: (snapshot) =>
				set({
					hasActiveGame: true,
					activeCase: snapshot.activeCase,
					placement: snapshot.placement,
					checkedClues: snapshot.checkedClues,
					clueOrder: orderWithCheckedLast(snapshot.activeCase.clues.length, snapshot.checkedClues),
					mistakes: snapshot.mistakes,
					timeElapsed: snapshot.timeElapsed,
					isPaused: false,
					selectedPersonId: null,
					revealedMurderer: null,
					hintsUsed: snapshot.hintsUsed ?? 0,
					currentHint: null,
					selectedDifficulty: snapshot.difficulty,
					activeScreen: 'game',
					lastResult: null,
				}),

			restartGame: () =>
				set((state) => ({
					placement: {},
					checkedClues: [],
					clueOrder: range(state.activeCase?.clues.length ?? 0),
					mistakes: 0,
					timeElapsed: 0,
					isPaused: false,
					selectedPersonId: null,
					revealedMurderer: null,
					hintsUsed: 0,
					currentHint: null,
					lastResult: null,
				})),

			clearActiveGame: () =>
				set({
					hasActiveGame: false,
					activeCase: null,
					placement: {},
					checkedClues: [],
					clueOrder: [],
					mistakes: 0,
					timeElapsed: 0,
					selectedPersonId: null,
					revealedMurderer: null,
					hintsUsed: 0,
					currentHint: null,
				}),

			selectPerson: (selectedPersonId) => set({ selectedPersonId }),

			placePerson: (personId, cell) => {
				const state = get();
				const activeCase = state.activeCase;
				if (!activeCase) {
					return { violates: false, isSolved: false };
				}
				const placement: Placement = { ...state.placement };
				const occupant = personAt(placement, cell.r, cell.c);
				const previousCell = placement[personId];
				if (occupant && occupant !== personId) {
					if (previousCell) {
						placement[occupant] = previousCell;
					} else {
						delete placement[occupant];
					}
				}
				placement[personId] = cell;

				const violates = violatedClueCount(activeCase, placement) > 0;
				const isSolved = isCaseSolved(activeCase, placement);
				const mistakes = violates ? state.mistakes + 1 : state.mistakes;
				set({ placement, mistakes, selectedPersonId: null });

				if (isSolved) {
					set({
						hasActiveGame: false,
						revealedMurderer: activeCase.murdererId,
						lastResult: {
							timeElapsed: state.timeElapsed,
							mistakes,
							difficulty: activeCase.difficulty,
							murdererId: activeCase.murdererId,
							victimId: activeCase.victimId,
							hintsUsed: state.hintsUsed,
						},
					});
				}
				return { violates, isSolved };
			},

			eraseCell: (cell) => {
				const state = get();
				const occupant = personAt(state.placement, cell.r, cell.c);
				if (!occupant) return;
				const placement: Placement = { ...state.placement };
				delete placement[occupant];
				set({ placement });
			},

			erasePerson: (personId) => {
				const state = get();
				if (!state.placement[personId]) return;
				const placement: Placement = { ...state.placement };
				delete placement[personId];
				set({ placement });
			},

			toggleClueCheck: (index) =>
				set((state) => {
					const willCheck = !state.checkedClues.includes(index);
					const checkedClues = willCheck
						? [...state.checkedClues, index]
						: state.checkedClues.filter((i) => i !== index);
					const rest = state.clueOrder.filter((i) => i !== index);
					// Checking sinks the clue to the bottom; unchecking floats it back to the top.
					const clueOrder = willCheck ? [...rest, index] : [index, ...rest];
					return { checkedClues, clueOrder };
				}),

			incrementTime: () =>
				set((state) => ({
					timeElapsed: state.isPaused ? state.timeElapsed : state.timeElapsed + 1,
				})),

			setPaused: (isPaused) => set({ isPaused }),

			requestHint: () => {
				const state = get();
				if (!state.activeCase || state.currentHint) return;
				const hint = nextHint(
					sceneOf(state.activeCase),
					state.activeCase.clues,
					state.activeCase.solution,
					state.placement,
				);
				if (!hint) return;
				set({ currentHint: hint, hintsUsed: state.hintsUsed + 1 });
			},

			applyHint: () => {
				const hint = get().currentHint;
				if (!hint) return;
				get().placePerson(hint.personId, hint.cell);
				set({ currentHint: null });
			},

			clearHint: () => set({ currentHint: null }),
		}),
		{
			name: 'murdokupado-game-storage',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				activePlayerId: state.activePlayerId,
				language: state.language,
				selectedDifficulty: state.selectedDifficulty,
			}),
		},
	),
);

if (import.meta.env.VITE_E2E === '1' && typeof window !== 'undefined') {
	(window as unknown as { __useGameStore: typeof useGameStore }).__useGameStore = useGameStore;
}
