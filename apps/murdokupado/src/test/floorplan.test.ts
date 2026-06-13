import { describe, expect, it } from 'vitest';
import { courtroom, shop } from '../data/scenes';
import { computeFloorPlan, type WallSegment } from '../engine/floorplan';
import type { Scene } from '../engine/types';

function hasSegment(walls: WallSegment[], segment: WallSegment): boolean {
	return walls.some(
		(wall) =>
			wall.x1 === segment.x1 &&
			wall.y1 === segment.y1 &&
			wall.x2 === segment.x2 &&
			wall.y2 === segment.y2,
	);
}

describe('computeFloorPlan floors', () => {
	it('produces a floor tile for every cell except blocked ones', () => {
		for (const scene of [courtroom, shop]) {
			const plan = computeFloorPlan(scene);
			expect(plan.floors).toHaveLength(scene.size * scene.size - scene.blockedCells.length);
		}
	});

	it('assigns the correct roomIndex to known cells', () => {
		const courtroomPlan = computeFloorPlan(courtroom);
		const courtroomTile = courtroomPlan.floors.find((tile) => tile.r === 0 && tile.c === 0);
		expect(courtroomTile?.roomIndex).toBe(0);
		const officeTile = courtroomPlan.floors.find((tile) => tile.r === 3 && tile.c === 1);
		expect(officeTile?.roomIndex).toBe(2);

		const shopPlan = computeFloorPlan(shop);
		// (1,3) holds the shelf object yet still belongs to the storage room, so it
		// must have a floor tile (the object is rendered on top of it).
		const storageTile = shopPlan.floors.find((tile) => tile.r === 1 && tile.c === 3);
		expect(storageTile?.roomIndex).toBe(1);
		const checkoutTile = shopPlan.floors.find((tile) => tile.r === 2 && tile.c === 2);
		expect(checkoutTile?.roomIndex).toBe(2);
		const streetTile = shopPlan.floors.find((tile) => tile.r === 4 && tile.c === 4);
		expect(streetTile?.roomIndex).toBe(3);
	});
});

describe('computeFloorPlan walls', () => {
	it('emits no duplicate segments', () => {
		for (const scene of [courtroom, shop]) {
			const plan = computeFloorPlan(scene);
			const keys = plan.walls.map((wall) => `${wall.x1},${wall.y1},${wall.x2},${wall.y2}`);
			expect(new Set(keys).size).toBe(keys.length);
		}
	});

	it('traces the full perimeter of an L-shaped room', () => {
		const lShaped: Scene = {
			id: 'l-test',
			size: 3,
			rooms: [
				{
					id: 'l',
					nameKey: 'room.l',
					cells: [
						{ r: 0, c: 0 },
						{ r: 1, c: 0 },
						{ r: 2, c: 0 },
						{ r: 2, c: 1 },
					],
				},
				{
					id: 'rest',
					nameKey: 'room.rest',
					cells: [
						{ r: 0, c: 1 },
						{ r: 0, c: 2 },
						{ r: 1, c: 1 },
						{ r: 1, c: 2 },
						{ r: 2, c: 2 },
					],
				},
			],
			objects: [],
			blockedCells: [],
			cast: [],
		};

		const plan = computeFloorPlan(lShaped);

		const lBoundary: WallSegment[] = [
			{ x1: 0, y1: 0, x2: 1, y2: 0 },
			{ x1: 0, y1: 0, x2: 0, y2: 1 },
			{ x1: 1, y1: 0, x2: 1, y2: 1 },
			{ x1: 0, y1: 1, x2: 0, y2: 2 },
			{ x1: 1, y1: 1, x2: 1, y2: 2 },
			{ x1: 0, y1: 2, x2: 0, y2: 3 },
			{ x1: 0, y1: 3, x2: 1, y2: 3 },
			{ x1: 1, y1: 3, x2: 2, y2: 3 },
			{ x1: 2, y1: 2, x2: 2, y2: 3 },
			{ x1: 1, y1: 2, x2: 2, y2: 2 },
		];

		for (const segment of lBoundary) {
			expect(hasSegment(plan.walls, segment)).toBe(true);
		}
		expect(lBoundary).toHaveLength(10);
	});

	it('surrounds an interior blocked cell with four walls', () => {
		const plan = computeFloorPlan(shop);
		const blocked = { r: 2, c: 0 };
		expect(
			hasSegment(plan.walls, { x1: blocked.c, y1: blocked.r, x2: blocked.c + 1, y2: blocked.r }),
		).toBe(true);
		expect(
			hasSegment(plan.walls, {
				x1: blocked.c,
				y1: blocked.r + 1,
				x2: blocked.c + 1,
				y2: blocked.r + 1,
			}),
		).toBe(true);
		expect(
			hasSegment(plan.walls, { x1: blocked.c, y1: blocked.r, x2: blocked.c, y2: blocked.r + 1 }),
		).toBe(true);
		expect(
			hasSegment(plan.walls, {
				x1: blocked.c + 1,
				y1: blocked.r,
				x2: blocked.c + 1,
				y2: blocked.r + 1,
			}),
		).toBe(true);
	});

	it('emits the outer-border edge for occupiable cells on the boundary', () => {
		const plan = computeFloorPlan(courtroom);
		expect(hasSegment(plan.walls, { x1: 0, y1: 0, x2: 1, y2: 0 })).toBe(true);
		expect(hasSegment(plan.walls, { x1: 0, y1: 0, x2: 0, y2: 1 })).toBe(true);
		expect(hasSegment(plan.walls, { x1: 0, y1: 4, x2: 1, y2: 4 })).toBe(true);
		expect(hasSegment(plan.walls, { x1: 4, y1: 0, x2: 4, y2: 1 })).toBe(true);
	});
});

describe('computeFloorPlan objects and blocked', () => {
	it('mirrors scene objects and blocked cells', () => {
		const plan = computeFloorPlan(shop);
		expect(plan.size).toBe(shop.size);
		expect(plan.objects).toEqual(
			shop.objects.map((object) => ({ kind: object.kind, r: object.cell.r, c: object.cell.c })),
		);
		expect(plan.blocked).toEqual(shop.blockedCells.map((cell) => ({ r: cell.r, c: cell.c })));
	});
});
