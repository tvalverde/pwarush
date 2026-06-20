import { describe, expect, it } from 'vitest';
import { createQuestionPool } from '../engine/questionPool';
import { createRng } from '../engine/rng';
import type { Question, TargetAudience } from '../types';

const makeQuestion = (id: number, audience: TargetAudience): Question => ({
	id,
	category: 'CYAN_SCI',
	targetAudience: audience,
	questionText: `Q${id}`,
	option0: 'a',
	option1: 'b',
	option2: 'c',
	option3: 'd',
	correctAnswerIndex: 0,
});

describe('createQuestionPool', () => {
	it('excludes ADULT-only questions for the KID flow', () => {
		const pool = createQuestionPool([
			makeQuestion(1, 'ADULT'),
			makeQuestion(2, 'KID'),
			makeQuestion(3, 'BOTH'),
		]);
		expect(pool.remaining('CYAN_SCI')).toBe(2);
	});

	it('does not repeat a question until the category pool is exhausted', () => {
		const questions = [makeQuestion(1, 'KID'), makeQuestion(2, 'KID'), makeQuestion(3, 'BOTH')];
		const pool = createQuestionPool(questions);
		const rng = createRng(42);
		const drawn = [
			pool.draw('CYAN_SCI', rng),
			pool.draw('CYAN_SCI', rng),
			pool.draw('CYAN_SCI', rng),
		];
		const ids = drawn.map((q) => q?.id).sort();
		expect(ids).toEqual([1, 2, 3]);
	});

	it('auto-resets the pool once depleted so play continues indefinitely', () => {
		const pool = createQuestionPool([makeQuestion(1, 'KID'), makeQuestion(2, 'KID')]);
		const rng = createRng(7);
		pool.draw('CYAN_SCI', rng);
		pool.draw('CYAN_SCI', rng);
		expect(pool.remaining('CYAN_SCI')).toBe(0);
		const next = pool.draw('CYAN_SCI', rng);
		expect(next).not.toBeNull();
		expect(pool.remaining('CYAN_SCI')).toBe(1);
	});

	it('returns null for a category with no eligible questions', () => {
		const pool = createQuestionPool([makeQuestion(1, 'ADULT')]);
		expect(pool.draw('CYAN_SCI')).toBeNull();
		expect(pool.draw('GOLD_ENT')).toBeNull();
	});
});
