import { db, USAGE_ID } from './database';

/** Loads the persisted set of used question ids (empty when none). */
export const loadUsedIds = async (): Promise<number[]> => {
	const row = await db.questionUsage.get(USAGE_ID);
	return row?.ids ?? [];
};

export const persistUsedIds = async (ids: number[]): Promise<void> => {
	try {
		await db.questionUsage.put({ id: USAGE_ID, ids });
	} catch (err) {
		console.error('Failed to persist question usage:', err);
	}
};

export const clearUsedIds = async (): Promise<void> => {
	await db.questionUsage.delete(USAGE_ID);
};
