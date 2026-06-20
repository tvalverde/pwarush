import { RAW_QUESTION_SEED } from '../data/questions';
import type { Question } from '../types';
import { filterValidQuestions } from '../utils/schemas';
import { db } from './database';

let seedPromise: Promise<void> | null = null;

/**
 * Idempotently seeds the question bank on first launch. Every record is validated by
 * `isValidQuestion` before the bulk write (rule 17); invalid rows are dropped rather
 * than corrupting the bank.
 */
export const seedQuestions = async (): Promise<void> => {
	if (seedPromise) return seedPromise;
	seedPromise = (async () => {
		const count = await db.questions.count();
		if (count > 0) return;
		const valid = filterValidQuestions(RAW_QUESTION_SEED);
		await db.questions.bulkAdd(valid as Question[]);
	})();
	return seedPromise;
};

export const loadQuestionBank = async (): Promise<Question[]> => {
	await seedQuestions();
	return db.questions.toArray();
};
