import { describe, expect, it } from 'vitest';
import type { Scene } from '../engine/types';
import { validateScene } from '../engine/validateScene';

function makeValidScene(): Scene {
	return {
		id: 'test',
		size: 3,
		rooms: [
			{
				id: 'roomA',
				nameKey: 'room.a',
				cells: [
					{ r: 0, c: 0 },
					{ r: 0, c: 1 },
					{ r: 1, c: 0 },
					{ r: 1, c: 1 },
				],
			},
			{
				id: 'roomB',
				nameKey: 'room.b',
				cells: [
					{ r: 0, c: 2 },
					{ r: 1, c: 2 },
					{ r: 2, c: 2 },
				],
			},
			{
				id: 'roomC',
				nameKey: 'room.c',
				cells: [
					{ r: 2, c: 0 },
					{ r: 2, c: 1 },
				],
			},
		],
		objects: [{ kind: 'register', nameKey: 'object.register', cell: { r: 0, c: 1 } }],
		blockedCells: [{ r: 2, c: 2 }],
		cast: [
			{ id: 'p1', name: 'Pim' },
			{ id: 'p2', name: 'Quin' },
			{ id: 'p3', name: 'Raf' },
		],
	};
}

describe('validateScene', () => {
	it('accepts a well-formed scene', () => {
		expect(validateScene(makeValidScene())).toEqual([]);
	});

	it('rejects rooms that overlap on a cell', () => {
		const scene = makeValidScene();
		scene.rooms[2].cells.push({ r: 0, c: 0 });
		const problems = validateScene(scene);
		expect(problems.some((p) => p.includes('multiple rooms'))).toBe(true);
	});

	it('rejects a grid with a missing (unassigned) cell', () => {
		const scene = makeValidScene();
		scene.rooms[2].cells = [{ r: 2, c: 0 }];
		const problems = validateScene(scene);
		expect(problems.some((p) => p.includes('not assigned to any room'))).toBe(true);
	});

	it('rejects out-of-bounds objects', () => {
		const scene = makeValidScene();
		scene.objects.push({ kind: 'shelf', nameKey: 'object.shelf', cell: { r: 9, c: 9 } });
		const problems = validateScene(scene);
		expect(problems.some((p) => p.includes('out of bounds'))).toBe(true);
	});

	it('rejects objects placed on a blocked cell', () => {
		const scene = makeValidScene();
		scene.objects.push({ kind: 'shelf', nameKey: 'object.shelf', cell: { r: 2, c: 2 } });
		const problems = validateScene(scene);
		expect(problems.some((p) => p.includes('blocked cell'))).toBe(true);
	});

	it('rejects a row with no occupiable cell', () => {
		const scene = makeValidScene();
		scene.blockedCells = [
			{ r: 2, c: 0 },
			{ r: 2, c: 2 },
		];
		scene.objects = [{ kind: 'register', nameKey: 'object.register', cell: { r: 2, c: 1 } }];
		const problems = validateScene(scene);
		expect(problems.some((p) => p.includes('Row 2 has no occupiable cell'))).toBe(true);
	});

	it('rejects a column with no occupiable cell', () => {
		const scene = makeValidScene();
		scene.blockedCells = [{ r: 0, c: 0 }];
		scene.objects = [
			{ kind: 'register', nameKey: 'object.register', cell: { r: 1, c: 0 } },
			{ kind: 'shelf', nameKey: 'object.shelf', cell: { r: 2, c: 0 } },
		];
		const problems = validateScene(scene);
		expect(problems.some((p) => p.includes('Column 0 has no occupiable cell'))).toBe(true);
	});

	it('rejects a wrong cast size', () => {
		const scene = makeValidScene();
		scene.cast = scene.cast.slice(0, 2);
		const problems = validateScene(scene);
		expect(problems.some((p) => p.includes('Cast size'))).toBe(true);
	});
});
