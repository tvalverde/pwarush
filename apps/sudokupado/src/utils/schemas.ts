import type { Difficulty, GameState, HistoryEntry, Player, Preferences } from '../types';

const VALID_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];

export const isValidDifficulty = (v: unknown): v is Difficulty =>
	typeof v === 'string' && (VALID_DIFFICULTIES as string[]).includes(v);

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

const isValid9x9Grid = (v: unknown): v is number[][] =>
	Array.isArray(v) &&
	v.length === 9 &&
	v.every(
		(row) =>
			Array.isArray(row) &&
			row.length === 9 &&
			row.every((cell) => typeof cell === 'number' && cell >= 0 && cell <= 9),
	);

const isValidNotes = (v: unknown): v is number[][][] =>
	Array.isArray(v) &&
	v.length === 9 &&
	v.every(
		(row) =>
			Array.isArray(row) &&
			row.length === 9 &&
			row.every(
				(cell) =>
					Array.isArray(cell) && cell.every((n) => typeof n === 'number' && n >= 1 && n <= 9),
			),
	);

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

export const isValidBackup = (v: unknown): boolean => {
	if (typeof v !== 'object' || v === null) return false;
	const d = v as Record<string, unknown>;
	if (d.appName !== 'SUDOKUPADO') return false;
	if (!Array.isArray(d.players) || !d.players.every(isValidPlayer)) return false;
	if (!Array.isArray(d.history) || !d.history.every(isValidHistoryEntry)) return false;
	if (d.preferences !== undefined) {
		if (!Array.isArray(d.preferences) || !d.preferences.every(isValidPreferences)) return false;
	}
	if (d.gameState !== undefined) {
		if (!Array.isArray(d.gameState) || !d.gameState.every(isValidGameState)) return false;
	}
	return true;
};
