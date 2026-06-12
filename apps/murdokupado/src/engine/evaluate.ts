import type { CellRef, Clue, ClueEvaluation, PersonId, Placement, Room, Scene } from './types';

function sameCell(a: CellRef, b: CellRef): boolean {
	return a.r === b.r && a.c === b.c;
}

export function roomOf(scene: Scene, cell: CellRef): Room | undefined {
	return scene.rooms.find((room) => room.cells.some((c) => sameCell(c, cell)));
}

export function neighbours(scene: Scene, cell: CellRef): CellRef[] {
	const deltas: CellRef[] = [
		{ r: -1, c: 0 },
		{ r: 1, c: 0 },
		{ r: 0, c: -1 },
		{ r: 0, c: 1 },
	];
	return deltas
		.map((d) => ({ r: cell.r + d.r, c: cell.c + d.c }))
		.filter((n) => n.r >= 0 && n.r < scene.size && n.c >= 0 && n.c < scene.size);
}

export function occupantsOfRoom(room: Room, placement: Placement): PersonId[] {
	const occupants: PersonId[] = [];
	for (const [personId, cell] of Object.entries(placement)) {
		if (cell && room.cells.some((c) => sameCell(c, cell))) {
			occupants.push(personId);
		}
	}
	return occupants;
}

function objectAt(scene: Scene, cell: CellRef): boolean {
	return scene.objects.some((object) => sameCell(object.cell, cell));
}

function isRoomSealed(scene: Scene, room: Room, placement: Placement): boolean {
	const everyonePlaced = scene.cast.every((person) => placement[person.id]);
	if (everyonePlaced) {
		return true;
	}
	const occupiableCells = room.cells.filter(
		(cell) => !objectAt(scene, cell) && !scene.blockedCells.some((b) => sameCell(b, cell)),
	);
	const occupiedCells = Object.values(placement).filter(
		(cell): cell is CellRef => cell !== undefined && room.cells.some((c) => sameCell(c, cell)),
	);
	return occupiedCells.length >= occupiableCells.length;
}

function evaluateBesideObject(
	clue: Extract<Clue, { type: 'beside_object' }>,
	scene: Scene,
	placement: Placement,
): ClueEvaluation {
	const cell = placement[clue.person];
	if (!cell) {
		return 'undecided';
	}
	const room = roomOf(scene, cell);
	const found = neighbours(scene, cell).some((neighbour) => {
		const sameRoom = room?.cells.some((c) => sameCell(c, neighbour)) ?? false;
		const hasObject = scene.objects.some(
			(object) => object.kind === clue.object && sameCell(object.cell, neighbour),
		);
		return sameRoom && hasObject;
	});
	return found ? 'satisfied' : 'violated';
}

export function evaluateClue(clue: Clue, scene: Scene, placement: Placement): ClueEvaluation {
	switch (clue.type) {
		case 'in_row': {
			const cell = placement[clue.person];
			if (!cell) return 'undecided';
			return cell.r === clue.row ? 'satisfied' : 'violated';
		}
		case 'in_column': {
			const cell = placement[clue.person];
			if (!cell) return 'undecided';
			return cell.c === clue.col ? 'satisfied' : 'violated';
		}
		case 'in_room': {
			const cell = placement[clue.person];
			if (!cell) return 'undecided';
			return roomOf(scene, cell)?.id === clue.room ? 'satisfied' : 'violated';
		}
		case 'not_in_room': {
			const cell = placement[clue.person];
			if (!cell) return 'undecided';
			return roomOf(scene, cell)?.id === clue.room ? 'violated' : 'satisfied';
		}
		case 'beside_object':
			return evaluateBesideObject(clue, scene, placement);
		case 'adjacent_to_person': {
			const cellA = placement[clue.a];
			const cellB = placement[clue.b];
			if (!cellA || !cellB) return 'undecided';
			const adjacent = neighbours(scene, cellA).some((n) => sameCell(n, cellB));
			return adjacent ? 'satisfied' : 'violated';
		}
		case 'offset': {
			const cellA = placement[clue.a];
			const cellB = placement[clue.b];
			if (!cellA || !cellB) return 'undecided';
			const matches = cellA.r === cellB.r + clue.dRow && cellA.c === cellB.c + clue.dCol;
			return matches ? 'satisfied' : 'violated';
		}
		case 'same_room': {
			const cellA = placement[clue.a];
			const cellB = placement[clue.b];
			if (!cellA || !cellB) return 'undecided';
			const roomA = roomOf(scene, cellA);
			const roomB = roomOf(scene, cellB);
			return roomA && roomB && roomA.id === roomB.id ? 'satisfied' : 'violated';
		}
		case 'alone': {
			const cell = placement[clue.person];
			if (!cell) return 'undecided';
			const room = roomOf(scene, cell);
			if (!room) return 'undecided';
			const occupants = occupantsOfRoom(room, placement);
			if (occupants.length > 1) return 'violated';
			return isRoomSealed(scene, room, placement) ? 'satisfied' : 'undecided';
		}
		case 'alone_with': {
			const cellA = placement[clue.a];
			const cellB = placement[clue.b];
			if (cellA) {
				const roomA = roomOf(scene, cellA);
				if (roomA) {
					const occupants = occupantsOfRoom(roomA, placement);
					const intruder = occupants.some((personId) => personId !== clue.a && personId !== clue.b);
					if (intruder) return 'violated';
				}
			}
			if (cellA && cellB) {
				const roomA = roomOf(scene, cellA);
				const roomB = roomOf(scene, cellB);
				if (roomA && roomB && roomA.id !== roomB.id) return 'violated';
			}
			if (!cellA || !cellB) return 'undecided';
			const room = roomOf(scene, cellA);
			if (!room) return 'undecided';
			const occupants = occupantsOfRoom(room, placement);
			const exactPair =
				occupants.length === 2 && occupants.includes(clue.a) && occupants.includes(clue.b);
			if (!exactPair) return 'violated';
			return isRoomSealed(scene, room, placement) ? 'satisfied' : 'undecided';
		}
	}
}
