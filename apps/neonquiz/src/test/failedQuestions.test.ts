import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { clearFailedQuestions, getFailedQuestions, logFailedQuestion } from '../db/failedQuestions';
import type { Question } from '../types';

const sample = (text: string): Omit<Question, 'id'> => ({
	category: 'CYAN_SCI',
	targetAudience: 'KID',
	questionText: text,
	option0: 'a',
	option1: 'b',
	option2: 'c',
	option3: 'd',
	correctAnswerIndex: 0,
});

describe('failed-question log', () => {
	beforeEach(async () => {
		await db.failedQuestions.clear();
		await db.questions.clear();
	});

	it('logs a failed question and returns it for review', async () => {
		const id = await db.questions.add(sample('Q1') as Question);
		await logFailedQuestion(id);
		const review = await getFailedQuestions();
		expect(review).toHaveLength(1);
		expect(review[0].questionText).toBe('Q1');
	});

	it('is idempotent per question id', async () => {
		const id = await db.questions.add(sample('Q1') as Question);
		await logFailedQuestion(id);
		await logFailedQuestion(id);
		expect(await db.failedQuestions.count()).toBe(1);
	});

	it('clears the review log', async () => {
		const id = await db.questions.add(sample('Q1') as Question);
		await logFailedQuestion(id);
		await clearFailedQuestions();
		expect(await getFailedQuestions()).toHaveLength(0);
	});
});
