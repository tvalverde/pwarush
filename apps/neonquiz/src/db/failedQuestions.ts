import type { Question } from '../types';
import { db } from './database';

/** Records a failed question once (idempotent by questionId) for later review. */
export const logFailedQuestion = async (questionId: number): Promise<void> => {
	try {
		const already = await db.failedQuestions.where('questionId').equals(questionId).count();
		if (already > 0) return;
		await db.failedQuestions.add({ questionId, failedAt: Date.now() });
	} catch (err) {
		console.error('Failed to log failed question:', err);
	}
};

/** Returns the distinct questions that have been failed, most recent first. */
export const getFailedQuestions = async (): Promise<Question[]> => {
	const entries = await db.failedQuestions.orderBy('id').reverse().toArray();
	const questions = await Promise.all(entries.map((entry) => db.questions.get(entry.questionId)));
	return questions.filter((q): q is Question => q !== undefined);
};

export const clearFailedQuestions = async (): Promise<void> => {
	await db.failedQuestions.clear();
};
