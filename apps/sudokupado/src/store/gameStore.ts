import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { db } from '../db/database';
import type { Difficulty, GameState, ScreenType } from '../types';
import { translations } from '../utils/translations';
import type { HintResult } from '../workers/sudokuWorker';

export interface GameResult {
	id?: number;
	score: number;
	timeElapsed: number;
	difficulty: Difficulty;
	mistakes: number;
	hintsUsed: number;
}

export type Language = 'en' | 'es';

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
	// Navigation & UI State
	activeScreen: ScreenType;
	activePlayerId: number | null;
	selectedDifficulty: Difficulty;
	allowNotes: boolean;
	maxMistakes: number;
	maxHints: number;
	lastGameResult: GameResult | null;
	language: Language;
	dialog: DialogState;

	// Actions
	setScreen: (screen: ScreenType) => void;
	setActivePlayer: (playerId: number | null) => Promise<void>;
	setDifficulty: (difficulty: Difficulty) => Promise<void>;
	setAllowNotes: (allow: boolean) => Promise<void>;
	setMaxMistakes: (max: number) => Promise<void>;
	setMaxHints: (max: number) => Promise<void>;
	setLastGameResult: (result: GameResult | null) => void;
	setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
	setLanguage: (lang: Language) => void;
	t: (path: string) => string;
	showDialog: (config: Omit<DialogState, 'isOpen'>) => void;
	closeDialog: () => void;

	// Game Play State
	hasActiveGame: boolean;
	grid: number[][];
	initialGrid: number[][];
	solution: number[][];
	notes: number[][][];
	mistakes: number;
	hintsUsed: number;
	timeElapsed: number;
	isPaused: boolean;
	selectedCell: { r: number; c: number } | null;
	isNoteMode: boolean;
	deferredPrompt: BeforeInstallPromptEvent | null;
	currentHint: HintResult | null;
	activeAnimations: {
		rows: number[];
		cols: number[];
		blocks: number[];
	};

	// Game Play Actions
	initGame: (initial: number[][], solution: number[][], difficulty: Difficulty) => void;
	resumeGame: (savedState: GameState) => void;
	restartGame: () => void;
	clearSavedGame: () => void;
	setCellValue: (
		r: number,
		c: number,
		val: number,
	) => { isCorrect: boolean; isFinished: boolean; isCellOccupied?: boolean };
	toggleNote: (r: number, c: number, val: number) => void;
	setSelectedCell: (r: number, c: number | null) => void;
	setNoteMode: (isNoteMode: boolean) => void;
	incrementTime: () => void;
	setPaused: (paused: boolean) => void;
	isNumberCompleted: (num: number) => boolean;
	useHint: (logicalHint: HintResult) => void;
	clearHint: () => void;
	clearActiveAnimations: () => void;
	applyHint: () => void;
	eraseCell: (r: number, c: number) => void;
}

const emptyGrid = () =>
	Array(9)
		.fill(null)
		.map(() => Array(9).fill(0));
const emptyNotes = () =>
	Array(9)
		.fill(null)
		.map(() =>
			Array(9)
				.fill(null)
				.map(() => []),
		);

const getInitialLanguage = (): Language => {
	if (typeof navigator === 'undefined') return 'en';
	const browserLang = navigator.language.split('-')[0];
	return browserLang === 'es' ? 'es' : 'en';
};

const DEFAULT_PREFS = {
	selectedDifficulty: 'beginner' as Difficulty,
	allowNotes: true,
	maxMistakes: 3,
	maxHints: 3,
};

export const useGameStore = create<GameStore>()(
	persist(
		(set, get) => {
			const persistPreferences = async (changes: {
				difficulty?: Difficulty;
				allowNotes?: boolean;
				maxMistakes?: number;
				maxHints?: number;
			}) => {
				const { activePlayerId } = get();
				if (!activePlayerId) return;
				try {
					await db.preferences.where('playerId').equals(activePlayerId).modify(changes);
				} catch (err) {
					console.error('Failed to persist player preferences:', err);
					const { t, showDialog } = get();
					showDialog({
						title: t('settings.title'),
						message: t('settings.save_error'),
						type: 'info',
						confirmText: 'OK',
						onConfirm: () => {},
					});
				}
			};

			return {
				activeScreen: 'main',
				activePlayerId: null,
				selectedDifficulty: DEFAULT_PREFS.selectedDifficulty,
				allowNotes: DEFAULT_PREFS.allowNotes,
				maxMistakes: DEFAULT_PREFS.maxMistakes,
				maxHints: DEFAULT_PREFS.maxHints,
				lastGameResult: null,
				language: getInitialLanguage(),
				dialog: {
					isOpen: false,
					title: '',
					message: '',
					onConfirm: () => {},
				},

				hasActiveGame: false,
				grid: emptyGrid(),
				initialGrid: emptyGrid(),
				solution: emptyGrid(),
				notes: emptyNotes(),
				mistakes: 0,
				hintsUsed: 0,
				timeElapsed: 0,
				isPaused: false,
				selectedCell: null,
				isNoteMode: false,
				deferredPrompt: null,
				currentHint: null,
				activeAnimations: { rows: [], cols: [], blocks: [] },

				setScreen: (screen) => set({ activeScreen: screen }),

				setActivePlayer: async (playerId) => {
					if (!playerId) {
						set({ activePlayerId: null, ...DEFAULT_PREFS });
						return;
					}

					const prefs = await db.preferences.where('playerId').equals(playerId).first();
					if (prefs) {
						set({
							activePlayerId: playerId,
							selectedDifficulty: prefs.difficulty,
							allowNotes: prefs.allowNotes,
							maxMistakes: prefs.maxMistakes,
							maxHints:
								typeof prefs.maxHints === 'number' ? prefs.maxHints : DEFAULT_PREFS.maxHints,
						});
					} else {
						// It's a new player or first time session
						set({ activePlayerId: playerId, ...DEFAULT_PREFS });
						await db.preferences.add({
							playerId,
							difficulty: DEFAULT_PREFS.selectedDifficulty,
							allowNotes: DEFAULT_PREFS.allowNotes,
							maxMistakes: DEFAULT_PREFS.maxMistakes,
							maxHints: DEFAULT_PREFS.maxHints,
						});
					}
				},

				setDifficulty: async (difficulty) => {
					set({ selectedDifficulty: difficulty });
					await persistPreferences({ difficulty });
				},

				setAllowNotes: async (allowNotes) => {
					set({ allowNotes });
					await persistPreferences({ allowNotes });
				},

				setMaxMistakes: async (maxMistakes) => {
					set({ maxMistakes });
					await persistPreferences({ maxMistakes });
				},

				setMaxHints: async (maxHints) => {
					set({ maxHints });
					await persistPreferences({ maxHints });
				},

				setLastGameResult: (lastGameResult) => set({ lastGameResult }),
				setDeferredPrompt: (deferredPrompt) => set({ deferredPrompt }),
				setLanguage: (language) => set({ language }),

				showDialog: (config) => set({ dialog: { ...config, isOpen: true } }),
				closeDialog: () => set((state) => ({ dialog: { ...state.dialog, isOpen: false } })),

				t: (path: string): string => {
					const lang = get().language;
					const keys = path.split('.');
					let value: unknown = translations[lang];
					for (const key of keys) {
						if (typeof value === 'object' && value !== null && key in value) {
							value = (value as Record<string, unknown>)[key];
						} else {
							value = undefined;
							break;
						}
					}
					return typeof value === 'string' ? value : path;
				},

				initGame: (initial, solution, difficulty) =>
					set({
						hasActiveGame: true,
						grid: initial.map((row) => [...row]),
						initialGrid: initial.map((row) => [...row]),
						solution: solution.map((row) => [...row]),
						notes: emptyNotes(),
						mistakes: 0,
						hintsUsed: 0,
						timeElapsed: 0,
						isPaused: false,
						selectedCell: null,
						isNoteMode: false,
						selectedDifficulty: difficulty,
						activeScreen: 'game',
						lastGameResult: null,
					}),

				resumeGame: (saved) =>
					set({
						hasActiveGame: true,
						grid: saved.grid,
						initialGrid: saved.initialGrid,
						solution: saved.solution,
						notes: saved.notes,
						mistakes: saved.mistakes,
						hintsUsed: saved.hintsUsed,
						timeElapsed: saved.timeElapsed,
						isPaused: false,
						selectedDifficulty: saved.difficulty,
						selectedCell: null,
						isNoteMode: false,
						activeScreen: 'game',
						lastGameResult: null,
					}),

				restartGame: () => {
					const { initialGrid } = get();
					set({
						grid: initialGrid.map((row) => [...row]),
						notes: emptyNotes(),
						mistakes: 0,
						hintsUsed: 0,
						timeElapsed: 0,
						isPaused: false,
						selectedCell: null,
						isNoteMode: false,
						lastGameResult: null,
					});
				},

				clearSavedGame: () =>
					set({
						hasActiveGame: false,
						grid: emptyGrid(),
						initialGrid: emptyGrid(),
						solution: emptyGrid(),
						notes: emptyNotes(),
						mistakes: 0,
						hintsUsed: 0,
						timeElapsed: 0,
					}),

				setSelectedCell: (r, c) =>
					set({
						selectedCell: c === null ? null : { r, c },
					}),

				setNoteMode: (isNoteMode) => set({ isNoteMode }),

				setCellValue: (r, c, val) => {
					const state = get();

					// Clear previous errors from the grid first
					const cleanGrid = state.grid.map((row, ri) =>
						row.map((cellVal, ci) =>
							cellVal !== 0 && state.initialGrid[ri][ci] === 0 && cellVal !== state.solution[ri][ci]
								? 0
								: cellVal,
						),
					);

					if (cleanGrid[r][c] !== 0)
						return { isCorrect: true, isFinished: false, isCellOccupied: true };

					const isCorrect = state.solution[r][c] === val;

					if (isCorrect) {
						cleanGrid[r][c] = val;

						const newNotes = state.notes.map((row) => row.map((cell) => [...cell]));
						for (let i = 0; i < 9; i++) {
							newNotes[r][i] = newNotes[r][i].filter((n) => n !== val);
							newNotes[i][c] = newNotes[i][c].filter((n) => n !== val);
						}
						const startR = r - (r % 3);
						const startC = c - (c % 3);
						for (let i = 0; i < 3; i++) {
							for (let j = 0; j < 3; j++) {
								newNotes[startR + i][startC + j] = newNotes[startR + i][startC + j].filter(
									(n) => n !== val,
								);
							}
						}

						const isFinished = cleanGrid.every((row, ri) =>
							row.every((cell, ci) => cell === state.solution[ri][ci]),
						);

						// Check for row/col/block completion animations
						const completedRows = [];
						const completedCols = [];
						const completedBlocks = [];

						if (cleanGrid[r].every((cell, ci) => cell === state.solution[r][ci])) {
							completedRows.push(r);
						}
						if (cleanGrid.every((row, ri) => row[c] === state.solution[ri][c])) {
							completedCols.push(c);
						}

						// Only check block completion for standard 9x9 grids
						if (cleanGrid.length === 9 && cleanGrid[0].length === 9) {
							const br = Math.floor(r / 3) * 3;
							const bc = Math.floor(c / 3) * 3;
							let blockComplete = true;
							for (let i = 0; i < 3; i++) {
								for (let j = 0; j < 3; j++) {
									if (cleanGrid[br + i][bc + j] !== state.solution[br + i][bc + j]) {
										blockComplete = false;
										break;
									}
								}
							}
							if (blockComplete) completedBlocks.push(Math.floor(r / 3) * 3 + Math.floor(c / 3));
						}

						const hasNewAnimation =
							completedRows.length > 0 || completedCols.length > 0 || completedBlocks.length > 0;

						set({
							grid: cleanGrid,
							notes: newNotes,
							activeAnimations: hasNewAnimation
								? { rows: completedRows, cols: completedCols, blocks: completedBlocks }
								: { rows: [], cols: [], blocks: [] },
						});

						return { isCorrect: true, isFinished };
					} else {
						cleanGrid[r][c] = val; // Temporarily show the error on the board
						set({ grid: cleanGrid, mistakes: state.mistakes + 1 });
						return { isCorrect: false, isFinished: false };
					}
				},

				toggleNote: (r, c, val) => {
					const state = get();

					// Clear errors first
					const cleanGrid = state.grid.map((row, ri) =>
						row.map((cellVal, ci) =>
							cellVal !== 0 && state.initialGrid[ri][ci] === 0 && cellVal !== state.solution[ri][ci]
								? 0
								: cellVal,
						),
					);

					if (cleanGrid[r][c] !== 0) {
						set({ grid: cleanGrid });
						return;
					}

					const newNotes = state.notes.map((row) => row.map((cell) => [...cell]));
					const cellNotes = newNotes[r][c];

					if (cellNotes.includes(val)) {
						newNotes[r][c] = cellNotes.filter((n) => n !== val);
					} else {
						newNotes[r][c] = [...cellNotes, val].sort();
					}

					set({ grid: cleanGrid, notes: newNotes });
				},

				incrementTime: () =>
					set((state) => ({
						timeElapsed: state.isPaused ? state.timeElapsed : state.timeElapsed + 1,
					})),

				setPaused: (isPaused) => set({ isPaused }),

				isNumberCompleted: (num: number) => {
					const { grid, solution } = get();
					let count = 0;
					for (let r = 0; r < 9; r++) {
						for (let c = 0; c < 9; c++) {
							if (grid[r][c] === num && grid[r][c] === solution[r][c]) {
								count++;
							}
						}
					}
					return count >= 9;
				},

				useHint: (logicalHint: HintResult) => {
					const state = get();
					if (state.maxHints <= 0 || state.hintsUsed >= state.maxHints || state.currentHint) return;

					if (logicalHint) {
						set({
							currentHint: logicalHint,
							selectedCell: { r: logicalHint.r, c: logicalHint.c },
							hintsUsed: state.hintsUsed + 1,
						});
					}
				},

				clearActiveAnimations: () => set({ activeAnimations: { rows: [], cols: [], blocks: [] } }),

				clearHint: () => set({ currentHint: null }),

				applyHint: () => {
					const state = get();
					if (!state.currentHint) return;

					const { r, c, value } = state.currentHint;
					const newGrid = state.grid.map((row) => [...row]);
					newGrid[r][c] = value;

					set({
						grid: newGrid,
						currentHint: null,
					});
				},

				eraseCell: (r, c) => {
					const state = get();
					// Only erase when the cell is not part of the initial puzzle
					if (state.initialGrid[r][c] !== 0) return;

					// Clear all errors and also the targeted cell
					const newGrid = state.grid.map((row, ri) =>
						row.map((cellVal, ci) =>
							cellVal !== 0 && state.initialGrid[ri][ci] === 0 && cellVal !== state.solution[ri][ci]
								? 0
								: cellVal,
						),
					);
					newGrid[r][c] = 0;

					set({ grid: newGrid });
				},
			};
		},
		{
			name: 'sudokupado-game-storage',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				activePlayerId: state.activePlayerId,
				language: state.language,
				selectedDifficulty: state.selectedDifficulty,
				allowNotes: state.allowNotes,
				maxMistakes: state.maxMistakes,
				maxHints: state.maxHints,
			}),
		},
	),
);

if (import.meta.env.VITE_E2E === '1' && typeof window !== 'undefined') {
	(window as unknown as { __useGameStore: typeof useGameStore }).__useGameStore = useGameStore;
}
