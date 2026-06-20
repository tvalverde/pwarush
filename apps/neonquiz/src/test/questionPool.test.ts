import { describe, expect, it } from 'vitest';
import { drawQuestion } from '../engine/questionPool';
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

describe('drawQuestion', () => {
	it('marks questions used and does not repeat until the category is exhausted', () => {
		const bank = [makeQuestion(1, 'KID'), makeQuestion(2, 'KID'), makeQuestion(3, 'BOTH')];
		const rng = createRng(42);
		let used = new Set<number>();
		const ids: number[] = [];
		for (let i = 0; i < 3; i++) {
			const result = drawQuestion(bank, 'CYAN_SCI', 'KID', used, rng);
			used = result.used;
			ids.push(result.question?.id as number);
		}
		expect(ids.slice().sort()).toEqual([1, 2, 3]);
		expect(used.size).toBe(3);
	});

	it('auto-resets the category once every eligible question is used', () => {
		const bank = [makeQuestion(1, 'KID'), makeQuestion(2, 'KID')];
		const rng = createRng(7);
		let used = new Set<number>([1, 2]); // both already used
		const result = drawQuestion(bank, 'CYAN_SCI', 'KID', used, rng);
		used = result.used;
		expect(result.question).not.toBeNull();
		// after reset, only the freshly drawn one is marked used again
		expect(used.size).toBe(1);
	});

	it('respects audience eligibility', () => {
		const bank = [makeQuestion(1, 'KID'), makeQuestion(2, 'ADULT')];
		expect(drawQuestion(bank, 'CYAN_SCI', 'ADULT', new Set()).question?.id).toBe(2);
		expect(drawQuestion(bank, 'CYAN_SCI', 'KID', new Set()).question?.id).toBe(1);
	});

	it('returns null when no eligible question exists', () => {
		const bank = [makeQuestion(1, 'ADULT')];
		expect(drawQuestion(bank, 'CYAN_SCI', 'KID', new Set()).question).toBeNull();
		expect(drawQuestion(bank, 'GOLD_ENT', 'ADULT', new Set()).question).toBeNull();
	});
});
