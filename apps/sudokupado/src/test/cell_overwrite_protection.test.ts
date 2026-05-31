import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';

type CellResult = { isCorrect: boolean; isFinished: boolean; isCellOccupied?: boolean };

describe('Regression: Cell Overwrite Protection', () => {
	const initial = Array(9)
		.fill(null)
		.map(() => Array(9).fill(0));
	const solution = Array(9)
		.fill(null)
		.map((_, r) => Array(9).fill(r + 1));

	beforeEach(() => {
		act(() => {
			useGameStore.getState().initGame(initial, solution, 'beginner');
		});
	});

	it('should not increment mistakes when overwriting a correctly filled cell', () => {
		act(() => {
			useGameStore.getState().setCellValue(0, 0, 1); // correct value for row 0
		});

		expect(useGameStore.getState().mistakes).toBe(0);

		let result: CellResult = { isCorrect: false, isFinished: false };
		act(() => {
			result = useGameStore.getState().setCellValue(0, 0, 3); // wrong number on already-correct cell
		});

		expect(useGameStore.getState().mistakes).toBe(0);
		expect(result.isCellOccupied).toBe(true);
	});

	it('should not increment mistakes when re-entering the same correct value', () => {
		act(() => {
			useGameStore.getState().setCellValue(0, 0, 1); // correct
		});

		let result: CellResult = { isCorrect: false, isFinished: false };
		act(() => {
			result = useGameStore.getState().setCellValue(0, 0, 1); // same correct value again
		});

		expect(useGameStore.getState().mistakes).toBe(0);
		expect(result.isCellOccupied).toBe(true);
	});

	it('should allow retrying after an error (error cell is not protected)', () => {
		act(() => {
			useGameStore.getState().setCellValue(0, 0, 5); // wrong value — becomes an error
		});

		expect(useGameStore.getState().mistakes).toBe(1);

		let result: CellResult = { isCorrect: false, isFinished: false };
		act(() => {
			result = useGameStore.getState().setCellValue(0, 0, 1); // correct retry
		});

		expect(result.isCorrect).toBe(true);
		expect(result.isCellOccupied).toBeUndefined();
	});

	it('should protect initial puzzle cells (regression)', () => {
		const puzzleInitial = Array(9)
			.fill(null)
			.map((_, r) => Array(9).fill(r + 1));
		const puzzleSolution = puzzleInitial.map((row) => [...row]);

		act(() => {
			useGameStore.getState().initGame(puzzleInitial, puzzleSolution, 'beginner');
		});

		let result: CellResult = { isCorrect: false, isFinished: false };
		act(() => {
			result = useGameStore.getState().setCellValue(0, 0, 3); // any number on initial cell
		});

		expect(useGameStore.getState().mistakes).toBe(0);
		expect(result.isCellOccupied).toBe(true);
	});
});
