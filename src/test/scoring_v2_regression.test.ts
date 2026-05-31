import { describe, expect, it } from 'vitest';
import { calculateScore } from '../utils/scoring';

describe('Scoring v2 Regression', () => {
	it('perfect game bonus: perfectBonus gives ×1.2 over an equivalent game with 1 hint', () => {
		const perfect = calculateScore('expert', 0, 0, 0);
		const withHint = calculateScore('expert', 0, 0, 1);
		// perfect = base×1.2, withHint = base×0.9 → ratio = 1.2/0.9 = 4/3
		expect(perfect / withHint).toBeCloseTo(4 / 3, 5);
	});

	it('perfect game bonus: perfectBonus gives ×1.2 over an equivalent game with 1 mistake', () => {
		const perfect = calculateScore('expert', 0, 0, 0);
		const withMistake = calculateScore('expert', 0, 1, 0);
		// perfect = base×1.2, withMistake = base×0.95 → ratio = 1.2/0.95
		expect(perfect / withMistake).toBeCloseTo(1.2 / 0.95, 5);
	});

	it('errors always penalize less than hints (beginner, fast game)', () => {
		const baseScore = calculateScore('beginner', 60, 0, 0);
		const withOneError = calculateScore('beginner', 60, 1, 0);
		const withOneHint = calculateScore('beginner', 60, 0, 1);
		const errorPenalty = baseScore - withOneError;
		const hintPenalty = baseScore - withOneHint;
		expect(errorPenalty).toBeLessThan(hintPenalty);
	});

	it('errors always penalize less than hints (expert, slow game)', () => {
		const baseScore = calculateScore('expert', 3600, 0, 0);
		const withOneError = calculateScore('expert', 3600, 1, 0);
		const withOneHint = calculateScore('expert', 3600, 0, 1);
		const errorPenalty = baseScore - withOneError;
		const hintPenalty = baseScore - withOneHint;
		expect(errorPenalty).toBeLessThan(hintPenalty);
	});

	it('no perfect bonus when only mistakes exist', () => {
		const withMistake = calculateScore('master', 0, 1, 0);
		const withoutPenalties = calculateScore('master', 0, 0, 0);
		// withMistake must use multiplier 0.95, not 1.2, so it must be strictly less
		expect(withMistake).toBeLessThan(withoutPenalties);
	});

	it('no perfect bonus when only hints exist', () => {
		const withHint = calculateScore('master', 0, 0, 1);
		const withoutPenalties = calculateScore('master', 0, 0, 0);
		expect(withHint).toBeLessThan(withoutPenalties);
	});

	it('score is always non-negative regardless of extreme inputs', () => {
		expect(calculateScore('beginner', 999999, 999, 3)).toBeGreaterThanOrEqual(0);
	});

	it('error multiplier is 0.95 per mistake', () => {
		const base = calculateScore('intermediate', 0, 0, 0);
		const oneError = calculateScore('intermediate', 0, 1, 0);
		// oneError = base × (0.95/1.2) since base includes perfectBonus
		expect(oneError / base).toBeCloseTo(0.95 / 1.2, 5);
	});

	it('hint multiplier is 0.90 per hint', () => {
		const base = calculateScore('intermediate', 0, 0, 0);
		const oneHint = calculateScore('intermediate', 0, 0, 1);
		expect(oneHint / base).toBeCloseTo(0.9 / 1.2, 5);
	});
});
