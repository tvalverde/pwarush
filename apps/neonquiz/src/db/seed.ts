import { RAW_QUESTION_SEED } from '../data/questions';
import type { Question } from '../types';
import { filterValidQuestions } from '../utils/schemas';
import { db } from './database';

let seedPromise: Promise<void> | null = null;

/**
 * Seeds the full question bank (every audience) on first launch, validating each record
 * before the bulk write (rule 17). Migration: a bank seeded by a pre-ADULT version only
 * holds KID/BOTH; if ADULT questions are missing it re-seeds the whole bank (and clears the
 * failed-question log, whose ids reference the old rows).
 */
export const seedQuestions = async (): Promise<void> => {
	if (seedPromise) return seedPromise;
	seedPromise = (async () => {
		const valid = filterValidQuestions(RAW_QUESTION_SEED) as Question[];
		const count = await db.questions.count();
		if (count === 0) {
			await db.questions.bulkAdd(valid);
			return;
		}
		const hasAdultInBank = valid.some((q) => q.targetAudience === 'ADULT');
		const adultInDb = await db.questions.where('targetAudience').equals('ADULT').count();
		if (hasAdultInBank && adultInDb === 0) {
			await db.questions.clear();
			await db.failedQuestions.clear();
			await db.questions.bulkAdd(valid);
		}
	})();
	return seedPromise;
};

export const loadQuestionBank = async (): Promise<Question[]> => {
	await seedQuestions();
	return db.questions.toArray();
};
