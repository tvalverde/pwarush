import { sameCell } from './grid';
import type { CellRef, ObjectKind, Scene } from './types';

export interface FloorTile {
	r: number;
	c: number;
	roomIndex: number;
}

export interface WallSegment {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

export interface FloorObject {
	kind: ObjectKind;
	r: number;
	c: number;
}

export interface FloorPlan {
	size: number;
	floors: FloorTile[];
	walls: WallSegment[];
	objects: FloorObject[];
	blocked: { r: number; c: number }[];
}

type Region = 'outside' | 'blocked' | number;

function regionOf(scene: Scene, cell: CellRef): Region {
	if (cell.r < 0 || cell.r >= scene.size || cell.c < 0 || cell.c >= scene.size) {
		return 'outside';
	}
	if (scene.blockedCells.some((blocked) => sameCell(blocked, cell))) {
		return 'blocked';
	}
	const roomIndex = scene.rooms.findIndex((room) =>
		room.cells.some((roomCell) => sameCell(roomCell, cell)),
	);
	return roomIndex;
}

function needsWall(a: Region, b: Region): boolean {
	if (a === 'outside' && b === 'outside') {
		return false;
	}
	return a !== b;
}

export function computeFloorPlan(scene: Scene): FloorPlan {
	const { size } = scene;

	// A cell has floor when it belongs to a room and is not blocked; this includes
	// cells holding an object (the object is drawn on top of its floor tile). Only
	// blocked cells (rubble) are left without floor.
	const floors: FloorTile[] = [];
	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			const region = regionOf(scene, { r, c });
			if (typeof region === 'number' && region !== -1) {
				floors.push({ r, c, roomIndex: region });
			}
		}
	}

	const walls: WallSegment[] = [];
	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			const here = regionOf(scene, { r, c });

			const top = regionOf(scene, { r: r - 1, c });
			if (needsWall(here, top)) {
				walls.push({ x1: c, y1: r, x2: c + 1, y2: r });
			}

			const left = regionOf(scene, { r, c: c - 1 });
			if (needsWall(here, left)) {
				walls.push({ x1: c, y1: r, x2: c, y2: r + 1 });
			}

			if (r === size - 1) {
				const bottom = regionOf(scene, { r: r + 1, c });
				if (needsWall(here, bottom)) {
					walls.push({ x1: c, y1: r + 1, x2: c + 1, y2: r + 1 });
				}
			}

			if (c === size - 1) {
				const right = regionOf(scene, { r, c: c + 1 });
				if (needsWall(here, right)) {
					walls.push({ x1: c + 1, y1: r, x2: c + 1, y2: r + 1 });
				}
			}
		}
	}

	const objects: FloorObject[] = scene.objects.map((object) => ({
		kind: object.kind,
		r: object.cell.r,
		c: object.cell.c,
	}));

	const blocked = scene.blockedCells.map((cell) => ({ r: cell.r, c: cell.c }));

	return { size, floors, walls, objects, blocked };
}
