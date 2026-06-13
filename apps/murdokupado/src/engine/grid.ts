import type { CellRef, Scene } from './types';

export function sameCell(a: CellRef, b: CellRef): boolean {
	return a.r === b.r && a.c === b.c;
}

export function cellKey(cell: CellRef): string {
	return `${cell.r},${cell.c}`;
}

export function inBounds(scene: Scene, cell: CellRef): boolean {
	return cell.r >= 0 && cell.r < scene.size && cell.c >= 0 && cell.c < scene.size;
}

export function isOccupiable(scene: Scene, cell: CellRef): boolean {
	const blocked = scene.blockedCells.some((b) => sameCell(b, cell));
	const hasObject = scene.objects.some((o) => sameCell(o.cell, cell));
	return !blocked && !hasObject;
}

export function occupiableCells(scene: Scene): CellRef[] {
	const cells: CellRef[] = [];
	for (let r = 0; r < scene.size; r++) {
		for (let c = 0; c < scene.size; c++) {
			const cell = { r, c };
			if (isOccupiable(scene, cell)) {
				cells.push(cell);
			}
		}
	}
	return cells;
}
