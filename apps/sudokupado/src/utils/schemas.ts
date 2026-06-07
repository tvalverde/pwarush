import { createBackupGuard, isNotesGrid, isNumberGrid, isOneOf } from '@pwarush/core/utils';
import type { Difficulty, GameState, HistoryEntry, Player, Preferences } from '../types';

const VALID_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];

export const isValidDifficulty = isOneOf(VALID_DIFFICULTIES);

export const isValidPlayer = (v: unknown): v is Player =>
	typeof v === 'object' &&
	v !== null &&
	typeof (v as Player).name === 'string' &&
	typeof (v as Player).createdAt === 'number' &&
	((v as Player).isDeleted === 0 || (v as Player).isDeleted === 1);

const VALID_MAX_MISTAKES = new Set([-1, 0, 3, 5]);
const VALID_MAX_HINTS = new Set([0, 3, 5]);

export const isValidPreferences = (v: unknown): v is Preferences => {
	if (typeof v !== 'object' || v === null) return false;
	const p = v as Preferences;
	return (
		typeof p.playerId === 'number' &&
		isValidDifficulty(p.difficulty) &&
		typeof p.allowNotes === 'boolean' &&
		typeof p.maxMistakes === 'number' &&
		VALID_MAX_MISTAKES.has(p.maxMistakes) &&
		typeof p.maxHints === 'number' &&
		VALID_MAX_HINTS.has(p.maxHints)
	);
};

export const isValidHistoryEntry = (v: unknown): v is HistoryEntry => {
	if (typeof v !== 'object' || v === null) return false;
	const h = v as HistoryEntry;
	return (
		typeof h.playerId === 'number' &&
		isValidDifficulty(h.difficulty) &&
		typeof h.score === 'number' &&
		h.score >= 0 &&
		typeof h.timeElapsed === 'number' &&
		h.timeElapsed >= 0 &&
		typeof h.mistakes === 'number' &&
		h.mistakes >= 0 &&
		h.mistakes <= 999 &&
		typeof h.date === 'number'
	);
};

const isValid9x9Grid = isNumberGrid(9, 0, 9);
const isValidNotes = isNotesGrid(9, 1, 9);

export const isValidGameState = (v: unknown): v is GameState => {
	if (typeof v !== 'object' || v === null) return false;
	const g = v as GameState;
	return (
		typeof g.playerId === 'number' &&
		isValid9x9Grid(g.grid) &&
		isValid9x9Grid(g.initialGrid) &&
		isValid9x9Grid(g.solution) &&
		isValidNotes(g.notes) &&
		typeof g.timeElapsed === 'number' &&
		g.timeElapsed >= 0 &&
		typeof g.mistakes === 'number' &&
		g.mistakes >= 0 &&
		typeof g.hintsUsed === 'number' &&
		g.hintsUsed >= 0 &&
		typeof g.isPaused === 'boolean' &&
		isValidDifficulty(g.difficulty)
	);
};

export const isValidBackup = createBackupGuard({
	appName: 'SUDOKUPADO',
	required: { players: isValidPlayer, history: isValidHistoryEntry },
	optional: { preferences: isValidPreferences, gameState: isValidGameState },
});
