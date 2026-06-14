import { describe, expect, it } from 'vitest';
import {
	casino,
	clinic,
	courtroom,
	gallery,
	hotel,
	mansion,
	museum,
	SCENES,
	shop,
	theater,
} from '../data/scenes';
import type { CellRef, Scene } from '../engine/types';
import { validateScene } from '../engine/validateScene';

function isOccupiable(scene: Scene, cell: CellRef): boolean {
	const blocked = scene.blockedCells.some((b) => b.r === cell.r && b.c === cell.c);
	const hasObject = scene.objects.some((o) => o.cell.r === cell.r && o.cell.c === cell.c);
	return !blocked && !hasObject;
}

function admitsPermutationPlacement(scene: Scene): boolean {
	const occupiableByRow: CellRef[][] = [];
	for (let r = 0; r < scene.size; r++) {
		const row: CellRef[] = [];
		for (let c = 0; c < scene.size; c++) {
			if (isOccupiable(scene, { r, c })) row.push({ r, c });
		}
		occupiableByRow.push(row);
	}

	const usedColumns = new Set<number>();
	const search = (row: number): boolean => {
		if (row === scene.size) return true;
		for (const cell of occupiableByRow[row]) {
			if (usedColumns.has(cell.c)) continue;
			usedColumns.add(cell.c);
			if (search(row + 1)) return true;
			usedColumns.delete(cell.c);
		}
		return false;
	};

	return search(0);
}

describe.each([
	['courtroom', courtroom],
	['shop', shop],
	['mansion', mansion],
	['theater', theater],
	['hotel', hotel],
	['gallery', gallery],
	['clinic', clinic],
	['museum', museum],
	['casino', casino],
])('scene %s', (_name, scene) => {
	it('passes validateScene', () => {
		expect(validateScene(scene)).toEqual([]);
	});

	it('admits at least one permutation placement on occupiable cells', () => {
		expect(admitsPermutationPlacement(scene)).toBe(true);
	});

	it('keeps object and blocked cells off occupiable space (counts sane)', () => {
		const totalCells = scene.size * scene.size;
		const reserved = scene.objects.length + scene.blockedCells.length;
		expect(reserved).toBeGreaterThan(0);
		expect(reserved).toBeLessThan(totalCells - scene.size);
		for (const object of scene.objects) {
			expect(isOccupiable(scene, object.cell)).toBe(false);
		}
		for (const blocked of scene.blockedCells) {
			expect(isOccupiable(scene, blocked)).toBe(false);
		}
	});
});

describe('SCENES record', () => {
	it('exposes every authored scene keyed by id', () => {
		expect(Object.keys(SCENES).sort()).toEqual([
			'casino',
			'clinic',
			'courtroom',
			'gallery',
			'hotel',
			'mansion',
			'museum',
			'shop',
			'theater',
		]);
		expect(SCENES.courtroom).toBe(courtroom);
		expect(SCENES.mansion).toBe(mansion);
		expect(SCENES.theater).toBe(theater);
		expect(SCENES.hotel).toBe(hotel);
		expect(SCENES.gallery).toBe(gallery);
		expect(SCENES.clinic).toBe(clinic);
		expect(SCENES.museum).toBe(museum);
		expect(SCENES.casino).toBe(casino);
	});
});
