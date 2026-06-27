import { describe, expect, it } from 'vitest';
import type { Player } from '../types';
import { buildMatchSummary, type MatchSummaryInput } from '../utils/gameResult';

const wildcards = (
	overrides: Partial<Record<'fiftyFifty' | 'change' | 'secondChance', boolean>> = {},
) => ({
	fiftyFifty: false,
	change: false,
	secondChance: false,
	...overrides,
});

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
	id: 'p0-TRIANGLE',
	name: 'Ada',
	shape: 'TRIANGLE',
	level: 'KID',
	position: 0,
	sparks: [],
	usedWildcards: wildcards(),
	pendingConclaveCategory: null,
	correct: 0,
	wrong: 0,
	...overrides,
});

const baseState = (overrides: Partial<MatchSummaryInput> = {}): MatchSummaryInput => ({
	players: [makePlayer(), makePlayer({ id: 'p1-SQUARE', name: 'Bob', shape: 'SQUARE' })],
	winnerIndex: 0,
	turnCount: 10,
	startedAt: Date.now() - 5000,
	conclaveFails: 0,
	pausedAccumMs: 0,
	mode: 'FAMILY',
	...overrides,
});

describe('buildMatchSummary', () => {
	it('returns null when there is no winner', () => {
		expect(buildMatchSummary(baseState({ winnerIndex: null }))).toBeNull();
	});

	it('returns null when the winner index does not match any player', () => {
		expect(buildMatchSummary(baseState({ winnerIndex: 5 }))).toBeNull();
	});

	it('builds a roster with per-player stats and marks the winner', () => {
		const state = baseState({
			players: [
				makePlayer({ sparks: ['CYAN_SCI', 'GOLD_ENT'], correct: 4, wrong: 1 }),
				makePlayer({ id: 'p1-SQUARE', name: 'Bob', shape: 'SQUARE', correct: 2, wrong: 3 }),
			],
			winnerIndex: 0,
		});

		const summary = buildMatchSummary(state);
		expect(summary).not.toBeNull();
		expect(summary!.entry.roster).toEqual([
			expect.objectContaining({ name: 'Ada', sparks: 2, correct: 4, wrong: 1, winner: true }),
			expect.objectContaining({ name: 'Bob', sparks: 0, correct: 2, wrong: 3, winner: false }),
		]);
	});

	it('sums correct, wrong and wildcardsUsed across every player', () => {
		const state = baseState({
			players: [
				makePlayer({
					correct: 4,
					wrong: 1,
					usedWildcards: wildcards({ fiftyFifty: true, change: true }),
				}),
				makePlayer({
					id: 'p1-SQUARE',
					name: 'Bob',
					shape: 'SQUARE',
					correct: 2,
					wrong: 3,
					usedWildcards: wildcards({ secondChance: true }),
				}),
			],
		});

		const summary = buildMatchSummary(state);
		expect(summary!.entry.correct).toBe(6);
		expect(summary!.entry.wrong).toBe(4);
		expect(summary!.entry.wildcardsUsed).toBe(3);
	});

	it('carries the conclaveFails count from state into the entry', () => {
		const summary = buildMatchSummary(baseState({ conclaveFails: 3 }));
		expect(summary!.entry.conclaveFails).toBe(3);
	});

	it('computes durationMs from startedAt to now', () => {
		const startedAt = Date.now() - 12345;
		const summary = buildMatchSummary(baseState({ startedAt }));
		expect(summary!.entry.durationMs).toBeGreaterThanOrEqual(12345);
		expect(summary!.entry.durationMs).toBeLessThan(12345 + 1000);
		expect(summary!.result.durationMs).toBe(summary!.entry.durationMs);
	});

	it('falls back to a near-zero duration when startedAt is null', () => {
		const summary = buildMatchSummary(baseState({ startedAt: null }));
		expect(summary!.entry.durationMs).toBeLessThan(50);
	});

	it("uses the winner's pinned accentColor for winnerColor when present", () => {
		const state = baseState({
			players: [
				makePlayer({ accentColor: '#ff00ff' }),
				makePlayer({ id: 'p1-SQUARE', name: 'Bob', shape: 'SQUARE' }),
			],
			winnerIndex: 0,
		});
		const summary = buildMatchSummary(state);
		expect(summary!.entry.winnerColor).toBe('#ff00ff');
		expect(summary!.entry.roster?.[0]?.color).toBe('#ff00ff');
	});

	it('falls back to the legacy index accent when the winner has no accentColor', () => {
		const summary = buildMatchSummary(baseState({ winnerIndex: 1 }));
		expect(summary!.entry.winnerColor).toBe('var(--color-cat-crimson)');
	});

	it('copies the winner name and shape into the entry', () => {
		const summary = buildMatchSummary(baseState());
		expect(summary!.entry.winnerName).toBe('Ada');
		expect(summary!.entry.winnerShape).toBe('TRIANGLE');
		expect(summary!.entry.players).toBe(2);
		expect(summary!.entry.turns).toBe(10);
	});

	it('mirrors the roster into the result for profile aggregation', () => {
		const summary = buildMatchSummary(baseState());
		expect(summary!.result.players).toBe(summary!.entry.roster);
		expect(summary!.result.turns).toBe(10);
	});

	it('defaults the entry mode to FAMILY and omits arcade stats from the roster', () => {
		const summary = buildMatchSummary(baseState());
		expect(summary!.entry.mode).toBe('FAMILY');
		expect(summary!.entry.roster?.[0]).not.toHaveProperty('arcadeScore');
	});

	it('stamps the Arcade mode and copies arcade stats into the roster', () => {
		const state = baseState({
			mode: 'ARCADE',
			players: [makePlayer({ arcadeScore: 750, arcadeMaxCombo: 4 })],
			winnerIndex: 0,
		});
		const summary = buildMatchSummary(state);
		expect(summary!.entry.mode).toBe('ARCADE');
		expect(summary!.entry.roster?.[0]).toMatchObject({ arcadeScore: 750, arcadeMaxCombo: 4 });
	});
});
