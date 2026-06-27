import { describe, expect, it } from 'vitest';
import {
	ARCADE_BASE_POINTS,
	ARCADE_COMBO_MULTIPLIER,
	ARCADE_SPEED_BONUS_POINTS,
	ARCADE_SPEED_BONUS_THRESHOLD_MS,
	calculateArcadeScore,
} from '../engine/scoring';

describe('Scoring Engine', () => {
	describe('calculateArcadeScore', () => {
		it('returns 0 score delta and 0 combo when answer is wrong', () => {
			const result = calculateArcadeScore(false, 3, 5, true, 5000);
			expect(result).toEqual({
				scoreDelta: 0,
				newCombo: 0,
				newMaxCombo: 5,
			});
		});

		it('increments combo and calculates base points + combo multiplier when correct', () => {
			// Current combo: 0. New combo: 1.
			// Score: 100 + (1 * 50) = 150
			const result = calculateArcadeScore(true, 0, 0, false, null);
			expect(result).toEqual({
				scoreDelta: ARCADE_BASE_POINTS + 1 * ARCADE_COMBO_MULTIPLIER, // 150
				newCombo: 1,
				newMaxCombo: 1,
			});
		});

		it('calculates correctly for higher combos', () => {
			// Current combo: 2. New combo: 3.
			// Score: 100 + (3 * 50) = 250
			const result = calculateArcadeScore(true, 2, 2, false, null);
			expect(result).toEqual({
				scoreDelta: ARCADE_BASE_POINTS + 3 * ARCADE_COMBO_MULTIPLIER, // 250
				newCombo: 3,
				newMaxCombo: 3,
			});
		});

		it('updates maxCombo if newCombo exceeds it', () => {
			const result = calculateArcadeScore(true, 4, 4, false, null);
			expect(result.newMaxCombo).toBe(5);
		});

		it('does not update maxCombo if newCombo does not exceed it', () => {
			const result = calculateArcadeScore(true, 1, 5, false, null);
			expect(result.newMaxCombo).toBe(5);
		});

		it('applies speed bonus for adults who answer within the threshold', () => {
			const answerTimeMs = ARCADE_SPEED_BONUS_THRESHOLD_MS - 1000; // 9 seconds
			const result = calculateArcadeScore(true, 0, 0, true, answerTimeMs);

			const expectedScoreDelta =
				ARCADE_BASE_POINTS + 1 * ARCADE_COMBO_MULTIPLIER + ARCADE_SPEED_BONUS_POINTS; // 150 + 200 = 350
			expect(result.scoreDelta).toBe(expectedScoreDelta);
		});

		it('does not apply speed bonus for adults who answer slower than the threshold', () => {
			const answerTimeMs = ARCADE_SPEED_BONUS_THRESHOLD_MS + 1000; // 11 seconds
			const result = calculateArcadeScore(true, 0, 0, true, answerTimeMs);

			const expectedScoreDelta = ARCADE_BASE_POINTS + 1 * ARCADE_COMBO_MULTIPLIER; // 150
			expect(result.scoreDelta).toBe(expectedScoreDelta);
		});

		it('does not apply speed bonus for kids, even if answerTimeMs is provided and fast', () => {
			const answerTimeMs = 5000;
			const result = calculateArcadeScore(true, 0, 0, false, answerTimeMs);

			const expectedScoreDelta = ARCADE_BASE_POINTS + 1 * ARCADE_COMBO_MULTIPLIER; // 150
			expect(result.scoreDelta).toBe(expectedScoreDelta);
		});

		it('handles exact threshold match for speed bonus', () => {
			const result = calculateArcadeScore(true, 0, 0, true, ARCADE_SPEED_BONUS_THRESHOLD_MS);

			const expectedScoreDelta =
				ARCADE_BASE_POINTS + 1 * ARCADE_COMBO_MULTIPLIER + ARCADE_SPEED_BONUS_POINTS; // 350
			expect(result.scoreDelta).toBe(expectedScoreDelta);
		});
	});
});
