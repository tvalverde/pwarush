import type { CellRef, Scene } from './types';

function sameCell(a: CellRef, b: CellRef): boolean {
	return a.r === b.r && a.c === b.c;
}

function inBounds(scene: Scene, cell: CellRef): boolean {
	return cell.r >= 0 && cell.r < scene.size && cell.c >= 0 && cell.c < scene.size;
}

function cellKey(cell: CellRef): string {
	return `${cell.r},${cell.c}`;
}

function validateRoomPartition(scene: Scene): string[] {
	const problems: string[] = [];
	const assignedTo = new Map<string, string>();

	for (const room of scene.rooms) {
		for (const cell of room.cells) {
			if (!inBounds(scene, cell)) {
				problems.push(`Room "${room.id}" has out-of-bounds cell (${cell.r}, ${cell.c}).`);
				continue;
			}
			const key = cellKey(cell);
			const existing = assignedTo.get(key);
			if (existing) {
				problems.push(
					`Cell (${cell.r}, ${cell.c}) belongs to multiple rooms ("${existing}" and "${room.id}").`,
				);
			} else {
				assignedTo.set(key, room.id);
			}
		}
	}

	for (let r = 0; r < scene.size; r++) {
		for (let c = 0; c < scene.size; c++) {
			if (!assignedTo.has(cellKey({ r, c }))) {
				problems.push(`Cell (${r}, ${c}) is not assigned to any room.`);
			}
		}
	}

	return problems;
}

function validateObjectsAndBlocked(scene: Scene): string[] {
	const problems: string[] = [];

	for (const blocked of scene.blockedCells) {
		if (!inBounds(scene, blocked)) {
			problems.push(`Blocked cell (${blocked.r}, ${blocked.c}) is out of bounds.`);
		}
	}

	for (const object of scene.objects) {
		if (!inBounds(scene, object.cell)) {
			problems.push(
				`Object "${object.kind}" is out of bounds at (${object.cell.r}, ${object.cell.c}).`,
			);
		}
		if (scene.blockedCells.some((b) => sameCell(b, object.cell))) {
			problems.push(
				`Object "${object.kind}" sits on a blocked cell (${object.cell.r}, ${object.cell.c}).`,
			);
		}
	}

	return problems;
}

function isOccupiable(scene: Scene, cell: CellRef): boolean {
	const blocked = scene.blockedCells.some((b) => sameCell(b, cell));
	const hasObject = scene.objects.some((o) => sameCell(o.cell, cell));
	return !blocked && !hasObject;
}

function validateOccupiableLines(scene: Scene): string[] {
	const problems: string[] = [];

	for (let r = 0; r < scene.size; r++) {
		let occupiable = false;
		for (let c = 0; c < scene.size; c++) {
			if (isOccupiable(scene, { r, c })) {
				occupiable = true;
				break;
			}
		}
		if (!occupiable) {
			problems.push(`Row ${r} has no occupiable cell.`);
		}
	}

	for (let c = 0; c < scene.size; c++) {
		let occupiable = false;
		for (let r = 0; r < scene.size; r++) {
			if (isOccupiable(scene, { r, c })) {
				occupiable = true;
				break;
			}
		}
		if (!occupiable) {
			problems.push(`Column ${c} has no occupiable cell.`);
		}
	}

	return problems;
}

export function validateScene(scene: Scene): string[] {
	const problems: string[] = [
		...validateRoomPartition(scene),
		...validateObjectsAndBlocked(scene),
		...validateOccupiableLines(scene),
	];

	if (scene.cast.length !== scene.size) {
		problems.push(`Cast size (${scene.cast.length}) must equal scene size (${scene.size}).`);
	}

	return problems;
}
