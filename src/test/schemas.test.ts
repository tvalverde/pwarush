import { describe, expect, it } from 'vitest';
import {
	isValidBackup,
	isValidDifficulty,
	isValidGameState,
	isValidHistoryEntry,
	isValidPlayer,
	isValidPreferences,
} from '../utils/schemas';

describe('isValidDifficulty', () => {
	it('accepts valid difficulty values', () => {
		expect(isValidDifficulty('beginner')).toBe(true);
		expect(isValidDifficulty('intermediate')).toBe(true);
		expect(isValidDifficulty('expert')).toBe(true);
		expect(isValidDifficulty('master')).toBe(true);
	});

	it('rejects invalid values', () => {
		expect(isValidDifficulty('easy')).toBe(false);
		expect(isValidDifficulty(1)).toBe(false);
		expect(isValidDifficulty(null)).toBe(false);
		expect(isValidDifficulty(undefined)).toBe(false);
	});
});

describe('isValidPlayer', () => {
	it('accepts a valid player', () => {
		expect(isValidPlayer({ name: 'Alice', createdAt: 1000, isDeleted: 0 })).toBe(true);
		expect(isValidPlayer({ id: 1, name: 'Bob', createdAt: 2000, isDeleted: 1 })).toBe(true);
	});

	it('rejects missing or wrong-typed fields', () => {
		expect(isValidPlayer({ name: 42, createdAt: 1000, isDeleted: 0 })).toBe(false);
		expect(isValidPlayer({ name: 'Alice', createdAt: '2024', isDeleted: 0 })).toBe(false);
		expect(isValidPlayer({ name: 'Alice', createdAt: 1000, isDeleted: 2 })).toBe(false);
		expect(isValidPlayer(null)).toBe(false);
	});
});

describe('isValidPreferences', () => {
	it('accepts the canonical maxMistakes values (-1, 0, 3, 5) combined with valid maxHints', () => {
		for (const maxMistakes of [-1, 0, 3, 5]) {
			expect(
				isValidPreferences({
					playerId: 1,
					difficulty: 'expert',
					allowNotes: true,
					maxMistakes,
					maxHints: 3,
				}),
			).toBe(true);
		}
		for (const maxHints of [0, 3, 5]) {
			expect(
				isValidPreferences({
					playerId: 1,
					difficulty: 'beginner',
					allowNotes: false,
					maxMistakes: 0,
					maxHints,
				}),
			).toBe(true);
		}
	});

	it('rejects maxMistakes outside the canonical set', () => {
		for (const bad of [-2, 1, 2, 4, 6]) {
			expect(
				isValidPreferences({
					playerId: 1,
					difficulty: 'beginner',
					allowNotes: true,
					maxMistakes: bad,
					maxHints: 3,
				}),
			).toBe(false);
		}
	});

	it('rejects maxHints outside the canonical set', () => {
		for (const bad of [-1, 1, 2, 4, 6]) {
			expect(
				isValidPreferences({
					playerId: 1,
					difficulty: 'beginner',
					allowNotes: true,
					maxMistakes: 3,
					maxHints: bad,
				}),
			).toBe(false);
		}
	});

	it('rejects preferences missing maxHints (post v2 schema)', () => {
		expect(
			isValidPreferences({ playerId: 1, difficulty: 'expert', allowNotes: true, maxMistakes: 3 }),
		).toBe(false);
	});

	it('rejects invalid difficulty', () => {
		expect(
			isValidPreferences({
				playerId: 1,
				difficulty: 'easy',
				allowNotes: true,
				maxMistakes: 3,
				maxHints: 3,
			}),
		).toBe(false);
	});
});

describe('isValidHistoryEntry', () => {
	const valid = {
		playerId: 1,
		difficulty: 'master',
		score: 5000,
		timeElapsed: 120,
		mistakes: 1,
		date: Date.now(),
	};

	it('accepts a valid history entry', () => {
		expect(isValidHistoryEntry(valid)).toBe(true);
	});

	it('rejects missing numeric fields', () => {
		expect(isValidHistoryEntry({ ...valid, score: '5000' })).toBe(false);
		expect(isValidHistoryEntry({ ...valid, date: null })).toBe(false);
	});

	it('rejects out-of-range numeric fields', () => {
		expect(isValidHistoryEntry({ ...valid, score: -1 })).toBe(false);
		expect(isValidHistoryEntry({ ...valid, timeElapsed: -1 })).toBe(false);
		expect(isValidHistoryEntry({ ...valid, mistakes: -1 })).toBe(false);
		expect(isValidHistoryEntry({ ...valid, mistakes: 1000 })).toBe(false);
		expect(isValidHistoryEntry({ ...valid, mistakes: 999 })).toBe(true);
	});
});

describe('isValidGameState', () => {
	const makeGrid = () =>
		Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
	const makeNotes = (): number[][][] =>
		Array(9)
			.fill(null)
			.map(() =>
				Array(9)
					.fill(null)
					.map(() => [] as number[]),
			);

	const valid = {
		playerId: 1,
		grid: makeGrid(),
		initialGrid: makeGrid(),
		solution: makeGrid(),
		notes: makeNotes(),
		timeElapsed: 60,
		mistakes: 0,
		hintsUsed: 0,
		isPaused: false,
		difficulty: 'intermediate',
	};

	it('accepts a valid game state', () => {
		expect(isValidGameState(valid)).toBe(true);
	});

	it('rejects a grid with wrong dimensions', () => {
		const shortGrid = Array(8)
			.fill(null)
			.map(() => Array(9).fill(0));
		expect(isValidGameState({ ...valid, grid: shortGrid })).toBe(false);

		const shortRowGrid = Array(9)
			.fill(null)
			.map(() => Array(8).fill(0));
		expect(isValidGameState({ ...valid, initialGrid: shortRowGrid })).toBe(false);
	});

	it('rejects notes with values out of range', () => {
		const badNotes = makeNotes();
		badNotes[0][0] = [0, 10];
		expect(isValidGameState({ ...valid, notes: badNotes })).toBe(false);
	});

	it('rejects grid cells out of range (0-9)', () => {
		const badGrid = makeGrid();
		badGrid[0][0] = -1;
		expect(isValidGameState({ ...valid, grid: badGrid })).toBe(false);

		const badGrid2 = makeGrid();
		badGrid2[4][4] = 10;
		expect(isValidGameState({ ...valid, solution: badGrid2 })).toBe(false);
	});

	it('rejects out-of-range numeric fields', () => {
		expect(isValidGameState({ ...valid, timeElapsed: -5 })).toBe(false);
		expect(isValidGameState({ ...valid, mistakes: -1 })).toBe(false);
		expect(isValidGameState({ ...valid, hintsUsed: -1 })).toBe(false);
	});
});

describe('isValidBackup', () => {
	const makeValidBackup = () => ({
		appName: 'SUDOKUPADO',
		version: 1,
		exportDate: Date.now(),
		players: [{ name: 'Alice', createdAt: 1000, isDeleted: 0 }],
		preferences: [
			{ playerId: 1, difficulty: 'beginner', allowNotes: true, maxMistakes: 3, maxHints: 3 },
		],
		history: [
			{
				playerId: 1,
				difficulty: 'beginner',
				score: 1000,
				timeElapsed: 90,
				mistakes: 0,
				date: Date.now(),
			},
		],
		gameState: [],
	});

	it('accepts a fully valid backup', () => {
		expect(isValidBackup(makeValidBackup())).toBe(true);
	});

	it('accepts a backup without optional gameState and preferences', () => {
		const { gameState: _gs, preferences: _pref, ...minimal } = makeValidBackup();
		expect(isValidBackup(minimal)).toBe(true);
	});

	it('rejects wrong appName', () => {
		expect(isValidBackup({ ...makeValidBackup(), appName: 'OTHER' })).toBe(false);
	});

	it('rejects a player with invalid fields', () => {
		const bad = makeValidBackup();
		bad.players = [{ name: 42, createdAt: 1000, isDeleted: 0 } as any];
		expect(isValidBackup(bad)).toBe(false);
	});

	it('rejects corrupted preferences', () => {
		const bad = makeValidBackup();
		bad.preferences = [
			{ playerId: 1, difficulty: 'god_mode', allowNotes: true, maxMistakes: 3, maxHints: 3 } as any,
		];
		expect(isValidBackup(bad)).toBe(false);
	});

	it('rejects null', () => {
		expect(isValidBackup(null)).toBe(false);
	});
});
