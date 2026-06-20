import { describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { seedQuestions } from '../db/seed';
import type { Question } from '../types';

const kidOnly = (id: number): Question => ({
	id,
	category: 'CYAN_SCI',
	targetAudience: 'KID',
	questionText: `legacy ${id}`,
	option0: 'a',
	option1: 'b',
	option2: 'c',
	option3: 'd',
	correctAnswerIndex: 0,
});

describe('question bank seed/migration', () => {
	it('reseeds the full bank when a legacy DB is missing ADULT questions', async () => {
		// Simulate a pre-ADULT DB: populated, but with no ADULT-audience questions.
		await db.questions.clear();
		await db.questions.bulkAdd([kidOnly(1), kidOnly(2)]);
		expect(await db.questions.where('targetAudience').equals('ADULT').count()).toBe(0);

		await seedQuestions();

		expect(await db.questions.where('targetAudience').equals('ADULT').count()).toBeGreaterThan(0);
	});
});
