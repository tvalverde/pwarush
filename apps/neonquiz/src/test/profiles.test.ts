import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import {
	applyGameResultToProfiles,
	clearProfiles,
	deleteProfile,
	getProfiles,
	upsertProfile,
} from '../db/profiles';
import type { GameResult, MatchPlayerStat, PlayerProfile } from '../types';

const newProfile = (name: string, overrides: Partial<PlayerProfile> = {}): PlayerProfile => ({
	name,
	shape: 'TRIANGLE',
	accentColor: 'var(--color-cat-cyan)',
	preferredLevel: 'KID',
	gamesPlayed: 0,
	gamesWon: 0,
	totalCorrect: 0,
	totalWrong: 0,
	totalPlayMs: 0,
	currentStreak: 0,
	bestStreak: 0,
	createdAt: 1000,
	lastPlayedAt: 1000,
	...overrides,
});

const stat = (
	profileId: number | undefined,
	overrides: Partial<MatchPlayerStat> = {},
): MatchPlayerStat => ({
	profileId,
	name: 'Ada',
	shape: 'TRIANGLE',
	color: 'var(--color-cat-cyan)',
	level: 'KID',
	sparks: 0,
	correct: 0,
	wrong: 0,
	winner: false,
	...overrides,
});

const result = (players: MatchPlayerStat[], overrides: Partial<GameResult> = {}): GameResult => ({
	durationMs: 60_000,
	turns: 10,
	players,
	...overrides,
});

describe('profiles', () => {
	beforeEach(() => db.profiles.clear());

	describe('upsertProfile', () => {
		it('creates a new profile and returns a numeric id', async () => {
			const id = await upsertProfile(newProfile('Ada'));
			expect(typeof id).toBe('number');
			const [saved] = await getProfiles();
			expect(saved.id).toBe(id);
			expect(saved.name).toBe('Ada');
		});

		it('updates an existing profile when called with its id', async () => {
			const id = await upsertProfile(newProfile('Ada'));
			await upsertProfile({ ...newProfile('Ada'), id, accentColor: 'var(--color-cat-gold)' });

			const all = await getProfiles();
			expect(all).toHaveLength(1);
			expect(all[0].accentColor).toBe('var(--color-cat-gold)');
		});
	});

	describe('getProfiles', () => {
		it('returns profiles most-recently-played first', async () => {
			await upsertProfile(newProfile('Older', { lastPlayedAt: 1000 }));
			await upsertProfile(newProfile('Newer', { lastPlayedAt: 5000 }));
			await upsertProfile(newProfile('Middle', { lastPlayedAt: 3000 }));

			const names = (await getProfiles()).map((p) => p.name);
			expect(names).toEqual(['Newer', 'Middle', 'Older']);
		});
	});

	describe('deleteProfile and clearProfiles', () => {
		it('deletes a single profile by id', async () => {
			const idA = await upsertProfile(newProfile('Ada'));
			await upsertProfile(newProfile('Bob'));

			await deleteProfile(idA);

			const remaining = await getProfiles();
			expect(remaining.map((p) => p.name)).toEqual(['Bob']);
		});

		it('clears every profile', async () => {
			await upsertProfile(newProfile('Ada'));
			await upsertProfile(newProfile('Bob'));

			await clearProfiles();

			expect(await getProfiles()).toHaveLength(0);
		});
	});

	describe('applyGameResultToProfiles', () => {
		it('accumulates gamesPlayed, correct/wrong, and totalPlayMs across two matches', async () => {
			const id = await upsertProfile(newProfile('Ada'));

			await applyGameResultToProfiles(
				result([stat(id, { correct: 5, wrong: 2, winner: false })], { durationMs: 30_000 }),
			);
			await applyGameResultToProfiles(
				result([stat(id, { correct: 3, wrong: 1, winner: false })], { durationMs: 20_000 }),
			);

			const [profile] = await getProfiles();
			expect(profile.gamesPlayed).toBe(2);
			expect(profile.totalCorrect).toBe(8);
			expect(profile.totalWrong).toBe(3);
			expect(profile.totalPlayMs).toBe(50_000);
		});

		it('increments currentStreak and raises bestStreak on a win', async () => {
			const id = await upsertProfile(newProfile('Ada'));

			await applyGameResultToProfiles(result([stat(id, { winner: true })]));
			await applyGameResultToProfiles(result([stat(id, { winner: true })]));

			const [profile] = await getProfiles();
			expect(profile.gamesWon).toBe(2);
			expect(profile.currentStreak).toBe(2);
			expect(profile.bestStreak).toBe(2);
		});

		it('resets currentStreak to 0 on a loss after a win streak, while keeping bestStreak', async () => {
			const id = await upsertProfile(newProfile('Ada'));

			await applyGameResultToProfiles(result([stat(id, { winner: true })]));
			await applyGameResultToProfiles(result([stat(id, { winner: true })]));
			await applyGameResultToProfiles(result([stat(id, { winner: false })]));

			const [profile] = await getProfiles();
			expect(profile.currentStreak).toBe(0);
			expect(profile.bestStreak).toBe(2);
		});

		it('ignores match entries without a profileId', async () => {
			await applyGameResultToProfiles(result([stat(undefined, { winner: true })]));

			expect(await getProfiles()).toHaveLength(0);
		});

		it('skips a profileId pointing at a deleted profile without throwing', async () => {
			const id = await upsertProfile(newProfile('Ghost'));
			await deleteProfile(id);

			await expect(
				applyGameResultToProfiles(result([stat(id, { winner: true })])),
			).resolves.toBeUndefined();
			expect(await getProfiles()).toHaveLength(0);
		});

		it('updates lastPlayedAt and skips deleted profiles while still applying valid ones', async () => {
			const idA = await upsertProfile(newProfile('Ada', { lastPlayedAt: 1 }));
			const idGhost = await upsertProfile(newProfile('Ghost'));
			await deleteProfile(idGhost);

			const before = Date.now();
			await applyGameResultToProfiles(
				result([stat(idA, { winner: true }), stat(idGhost, { winner: true })]),
			);

			const [profile] = await getProfiles();
			expect(profile.lastPlayedAt).toBeGreaterThanOrEqual(before);
			expect(profile.gamesPlayed).toBe(1);
		});
	});
});
