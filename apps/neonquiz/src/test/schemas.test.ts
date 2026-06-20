import { describe, expect, it } from 'vitest';
import { RAW_QUESTION_SEED } from '../data/questions';
import { filterValidQuestions, isValidQuestion } from '../utils/schemas';

const valid = {
	category: 'CRIMSON_HIST',
	targetAudience: 'BOTH',
	questionText: '¿Año del descubrimiento de América?',
	option0: '1482',
	option1: '1492',
	option2: '1502',
	option3: '1498',
	correctAnswerIndex: 1,
};

describe('isValidQuestion', () => {
	it('accepts a well-formed question', () => {
		expect(isValidQuestion(valid)).toBe(true);
	});

	it('rejects an unknown category', () => {
		expect(isValidQuestion({ ...valid, category: 'PURPLE_MUSIC' })).toBe(false);
	});

	it('rejects an out-of-range answer index', () => {
		expect(isValidQuestion({ ...valid, correctAnswerIndex: 4 })).toBe(false);
		expect(isValidQuestion({ ...valid, correctAnswerIndex: -1 })).toBe(false);
	});

	it('rejects a missing option and non-objects', () => {
		const { option2: _omit, ...missing } = valid;
		expect(isValidQuestion(missing)).toBe(false);
		expect(isValidQuestion(null)).toBe(false);
		expect(isValidQuestion('nope')).toBe(false);
	});
});

describe('the bundled question seed', () => {
	it('contains roughly 1,200 records and every one is valid', () => {
		const filtered = filterValidQuestions(RAW_QUESTION_SEED);
		expect(RAW_QUESTION_SEED.length).toBeGreaterThanOrEqual(1190);
		expect(filtered.length).toBe(RAW_QUESTION_SEED.length);
	});
});
