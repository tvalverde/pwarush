import type { Difficulty } from '../types';

/**
 * Calculates the Sudoku score using asymptotic time decay and multiplicative penalty/bonus.
 * Formula: base × timeMultiplier × perfectBonus × (0.95 ^ mistakes) × (0.90 ^ hintsUsed)
 * - perfectBonus = 1.2 when mistakes === 0 && hintsUsed === 0
 * - Errors always penalize less than hints (-5% vs -10%) at any difficulty/time combination.
 */
export const calculateScore = (
	difficulty: Difficulty,
	timeElapsed: number,
	mistakes: number,
	hintsUsed: number,
): number => {
	const baseScores = { beginner: 2000, intermediate: 4000, expert: 6000, master: 8000 };
	const base = baseScores[difficulty] || 2000;

	const timeMultiplier = 1200 / (1200 + timeElapsed);
	const perfectBonus = mistakes === 0 && hintsUsed === 0 ? 1.2 : 1.0;
	const score = base * timeMultiplier * perfectBonus * 0.95 ** mistakes * 0.9 ** hintsUsed;

	return Math.max(0, Math.floor(score));
};
