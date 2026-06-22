import type { Question, TargetAudience } from '../types';
import { questionKey } from '../utils/questionKey';
import { db } from './database';

/** Loads every audience override as a map keyed by the stable content key. */
export const getAudienceOverrides = async (): Promise<Map<string, TargetAudience>> => {
	const rows = await db.questionAudienceOverrides.toArray();
	return new Map(rows.map((row) => [row.key, row.audience]));
};

/** Persists (upsert) the override for a content key. */
export const setAudienceOverride = async (key: string, audience: TargetAudience): Promise<void> => {
	try {
		await db.questionAudienceOverrides.put({ key, audience });
	} catch (err) {
		console.error('Failed to persist audience override:', err);
	}
};

/**
 * Returns a copy of the bank with each question's `targetAudience` replaced by its override,
 * if any. Pure: the input bank is not mutated. Because `drawQuestion` filters on
 * `targetAudience`, applying overrides to the in-memory bank is enough to reroute a question
 * between KID/ADULT/BOTH without touching the engine.
 */
export const applyAudienceOverrides = (
	bank: Question[],
	overrides: Map<string, TargetAudience>,
): Question[] => {
	if (overrides.size === 0) return bank;
	return bank.map((q) => {
		const override = overrides.get(questionKey(q));
		return override && override !== q.targetAudience ? { ...q, targetAudience: override } : q;
	});
};
