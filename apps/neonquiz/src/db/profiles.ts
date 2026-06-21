import type { GameResult, PlayerProfile } from '../types';
import { db } from './database';

/** Saved profiles, most recently played first. */
export const getProfiles = async (): Promise<PlayerProfile[]> =>
	db.profiles.orderBy('lastPlayedAt').reverse().toArray();

/** Creates a profile (no id) or updates an existing one; returns its id. */
export const upsertProfile = async (profile: PlayerProfile): Promise<number> => {
	if (profile.id != null) {
		await db.profiles.put(profile);
		return profile.id;
	}
	return db.profiles.add(profile);
};

export const deleteProfile = async (id: number): Promise<void> => {
	await db.profiles.delete(id);
};

export const clearProfiles = async (): Promise<void> => {
	await db.profiles.clear();
};

/** Folds a finished match into the lifetime aggregates of every participating profile. */
export const applyGameResultToProfiles = async (result: GameResult): Promise<void> => {
	await db.transaction('rw', db.profiles, async () => {
		for (const player of result.players) {
			if (player.profileId == null) continue;
			const profile = await db.profiles.get(player.profileId);
			if (!profile) continue;

			const currentStreak = player.winner ? profile.currentStreak + 1 : 0;
			await db.profiles.put({
				...profile,
				gamesPlayed: profile.gamesPlayed + 1,
				gamesWon: profile.gamesWon + (player.winner ? 1 : 0),
				totalCorrect: profile.totalCorrect + player.correct,
				totalWrong: profile.totalWrong + player.wrong,
				totalPlayMs: profile.totalPlayMs + result.durationMs,
				currentStreak,
				bestStreak: Math.max(profile.bestStreak, currentStreak),
				lastPlayedAt: Date.now(),
			});
		}
	});
};
