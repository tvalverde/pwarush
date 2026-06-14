import type { Case, Difficulty, Placement } from '../engine/types';

export type { Difficulty } from '../engine/types';

export type ScreenType = 'main' | 'game' | 'result';

export type Language = 'en' | 'es';

export interface Player {
	id?: number;
	name: string;
	createdAt: number;
	isDeleted: number; // 0 for false, 1 for true (better for IndexedDB indexing)
}

export interface Preferences {
	id?: number;
	playerId: number;
	difficulty: Difficulty;
}

export interface HistoryEntry {
	id?: number;
	playerId: number;
	difficulty: Difficulty;
	timeElapsed: number; // in seconds
	mistakes: number;
	date: number; // timestamp
}

export interface GameSnapshot {
	id?: number;
	playerId: number;
	activeCase: Case;
	placement: Placement;
	checkedClues: number[];
	timeElapsed: number;
	mistakes: number;
	isPaused: boolean;
	difficulty: Difficulty;
	hintsUsed?: number;
}
