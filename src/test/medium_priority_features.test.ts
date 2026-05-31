import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { calculateScore } from '../utils/scoring';

describe('Audit Fixes & Regression', () => {
	it('Scoring Utility: should match asymptotic decay formula with perfect bonus', () => {
		// 20 minutes (1200s): timeFactor=0.5, perfectBonus=1.2 → 2000×0.5×1.2 = 1200
		expect(calculateScore('beginner', 1200, 0, 0)).toBe(1200);
		// 1 hour (3600s): timeFactor=0.25 → 2000×0.25×1.2 = 600
		expect(calculateScore('beginner', 3600, 0, 0)).toBe(600);
		// 10 hours: score is clamped to ≥0 but never reaches 0
		expect(calculateScore('beginner', 36000, 0, 0)).toBeGreaterThan(0);
	});

	it('Hints UX: should increment hintsUsed when triggerHint is called with a hint', async () => {
		act(() => {
			useGameStore.setState({ hintsUsed: 0, currentHint: null });
		});

		const mockHint = { r: 0, c: 0, value: 5, type: 'naked_single' as const };

		act(() => {
			useGameStore.getState().useHint(mockHint);
		});

		expect(useGameStore.getState().hintsUsed).toBe(1);
		expect(useGameStore.getState().currentHint).toEqual(mockHint);
	});

	it('Error UX: should show error in grid and clear it on next input', async () => {
		const store = useGameStore.getState();

		act(() => {
			store.initGame(
				Array(9)
					.fill(0)
					.map(() => Array(9).fill(0)),
				Array(9)
					.fill(1)
					.map(() => Array(9).fill(1)),
				'beginner',
			);
		});

		// 1. Input wrong number at 0,0
		act(() => {
			useGameStore.getState().setCellValue(0, 0, 5); // Correct is 1
		});

		expect(useGameStore.getState().grid[0][0]).toBe(5);
		expect(useGameStore.getState().mistakes).toBe(1);

		// 2. Input another number at 1,1
		act(() => {
			useGameStore.getState().setCellValue(1, 1, 1);
		});

		expect(useGameStore.getState().grid[0][0]).toBe(0);
	});
});
