import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Regression: Erase Button Functionality', () => {
	beforeEach(() => {
		const store = useGameStore.getState();
		const initial = [
			[5, 3, 0, 0, 7, 0, 0, 0, 0],
			[6, 0, 0, 1, 9, 5, 0, 0, 0],
			[0, 9, 8, 0, 0, 0, 0, 6, 0],
			[8, 0, 0, 0, 6, 0, 0, 0, 3],
			[4, 0, 0, 8, 0, 3, 0, 0, 1],
			[7, 0, 0, 0, 2, 0, 0, 0, 6],
			[0, 6, 0, 0, 0, 0, 2, 8, 0],
			[0, 0, 0, 4, 1, 9, 0, 0, 5],
			[0, 0, 0, 0, 8, 0, 0, 7, 9],
		];
		const solution = [
			[5, 3, 4, 6, 7, 8, 9, 1, 2],
			[6, 7, 2, 1, 9, 5, 3, 4, 8],
			[1, 9, 8, 3, 4, 2, 5, 6, 7],
			[8, 5, 9, 7, 6, 1, 4, 2, 3],
			[4, 2, 6, 8, 5, 3, 7, 9, 1],
			[7, 1, 3, 9, 2, 4, 8, 5, 6],
			[9, 6, 1, 5, 3, 7, 2, 8, 4],
			[2, 8, 7, 4, 1, 9, 6, 3, 5],
			[3, 4, 5, 2, 8, 6, 1, 7, 9],
		];
		store.initGame(initial, solution, 'beginner');
	});

	it('should have a way to erase a cell value in the store', () => {
		const store = useGameStore.getState();

		// 1. Seleccionar una celda vacía (0, 2)
		store.setSelectedCell(0, 2);

		// 2. Poner un valor correcto (4)
		store.setCellValue(0, 2, 4);
		expect(useGameStore.getState().grid[0][2]).toBe(4);

		// 3. Borrar el valor usando la nueva acción eraseCell
		store.eraseCell(0, 2);

		// El valor debería ser 0 después de borrar
		expect(useGameStore.getState().grid[0][2]).toBe(0);
	});

	it('should not erase an initial cell value', () => {
		const store = useGameStore.getState();

		// La celda (0, 0) es inicial (valor 5)
		expect(store.grid[0][0]).toBe(5);

		store.eraseCell(0, 0);

		// Debería seguir siendo 5
		expect(useGameStore.getState().grid[0][0]).toBe(5);
	});
});
