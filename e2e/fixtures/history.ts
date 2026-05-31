import type { Difficulty, HistoryEntry } from '../../src/types';

const DIFFICULTY_CYCLE: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];
const BASE_TIMESTAMP = 1_700_000_000_000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface HistoryEntryOptions {
	startScore?: number;
	scoreStep?: number;
	startTimeElapsed?: number;
	timeStep?: number;
	mistakes?: number;
	hintsUsed?: number;
	difficulty?: Difficulty | 'cycle';
	startTimestamp?: number;
	timestampStep?: number;
}

export const buildHistoryEntries = (
	count: number,
	options: HistoryEntryOptions = {},
): Omit<HistoryEntry, 'id' | 'playerId'>[] => {
	const {
		startScore = 5000,
		scoreStep = 50,
		startTimeElapsed = 120,
		timeStep = 10,
		mistakes = 0,
		hintsUsed = 0,
		difficulty = 'cycle',
		startTimestamp = BASE_TIMESTAMP,
		timestampStep = ONE_DAY_MS,
	} = options;

	const resolveDifficulty = (index: number): Difficulty =>
		difficulty === 'cycle' ? DIFFICULTY_CYCLE[index % DIFFICULTY_CYCLE.length] : difficulty;

	return Array.from({ length: count }, (_, index) => ({
		difficulty: resolveDifficulty(index),
		score: Math.max(0, startScore - index * scoreStep),
		timeElapsed: startTimeElapsed + index * timeStep,
		mistakes,
		hintsUsed,
		date: startTimestamp + index * timestampStep,
	}));
};
