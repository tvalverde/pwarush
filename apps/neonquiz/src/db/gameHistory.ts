import type { GameHistoryEntry } from '../types';
import { db } from './database';

export const logGameResult = async (entry: Omit<GameHistoryEntry, 'id'>): Promise<void> => {
	try {
		await db.gameHistory.add(entry);
	} catch (err) {
		console.error('Failed to log game result:', err);
	}
};

/** Returns finished games, most recent first. */
export const getGameHistory = async (): Promise<GameHistoryEntry[]> =>
	db.gameHistory.orderBy('date').reverse().toArray();

export const clearGameHistory = async (): Promise<void> => {
	await db.gameHistory.clear();
};
