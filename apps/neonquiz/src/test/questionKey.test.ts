import { describe, expect, it } from 'vitest';
import type { Question } from '../types';
import { questionKey } from '../utils/questionKey';

const q = (over: Partial<Question>): Question => ({
	category: 'CYAN_SCI',
	targetAudience: 'KID',
	questionText: 'What is H2O?',
	option0: 'Water',
	option1: 'Air',
	option2: 'Fire',
	option3: 'Earth',
	correctAnswerIndex: 0,
	...over,
});

describe('questionKey', () => {
	it('is stable for the same content regardless of id', () => {
		expect(questionKey(q({ id: 1 }))).toBe(questionKey(q({ id: 999 })));
	});

	it('ignores case and surrounding/duplicate whitespace', () => {
		expect(questionKey(q({ questionText: '  What   is H2O? ' }))).toBe(
			questionKey(q({ questionText: 'what is h2o?' })),
		);
	});

	it('differs across categories even with identical text', () => {
		expect(questionKey(q({ category: 'CYAN_SCI' }))).not.toBe(
			questionKey(q({ category: 'GOLD_ENT' })),
		);
	});

	it('differs for different questions', () => {
		expect(questionKey(q({ questionText: 'A' }))).not.toBe(questionKey(q({ questionText: 'B' })));
	});
});
