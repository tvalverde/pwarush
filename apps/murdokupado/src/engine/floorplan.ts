import { sameCell } from './grid';
import type { CellRef, FloorMaterial, ObjectKind, Scene } from './types';

// Deterministic fallback when a room declares no `floor`: cycles materials by room
// index so unannotated scenes still read as varied surfaces.
const FALLBACK_FLOOR: FloorMaterial[] = ['wood', 'tile', 'carpet', 'stone'];

export function resolveFloorMaterial(scene: Scene, roomIndex: number): FloorMaterial {
	return scene.rooms[roomIndex]?.floor ?? FALLBACK_FLOOR[roomIndex % FALLBACK_FLOOR.length];
}

export interface FloorTile {
	r: number;
	c: number;
	roomIndex: number;
	material: FloorMaterial;
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

export interface RoomCentroid {
	roomIndex: number;
	cx: number;
	cy: number;
}

export interface FloorPlan {
	size: number;
	floors: FloorTile[];
	walls: WallSegment[];
	objects: FloorObject[];
	blocked: { r: number; c: number }[];
	rooms: RoomCentroid[];
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
				floors.push({ r, c, roomIndex: region, material: resolveFloorMaterial(scene, region) });
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

	// Zone-label anchor: the centroid of a room's floor tiles (blocked cells
	// excluded so rubble does not skew it). Cell (r,c) centers at (c+0.5, r+0.5).
	const rooms: RoomCentroid[] = scene.rooms.map((_, roomIndex) => {
		const tiles = floors.filter((tile) => tile.roomIndex === roomIndex);
		const count = tiles.length || 1;
		const cx = tiles.reduce((sum, tile) => sum + tile.c + 0.5, 0) / count;
		const cy = tiles.reduce((sum, tile) => sum + tile.r + 0.5, 0) / count;
		return { roomIndex, cx, cy };
	});

	return { size, floors, walls, objects, blocked, rooms };
}
