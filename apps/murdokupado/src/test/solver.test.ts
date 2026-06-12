import { describe, expect, it } from 'vitest';
import { evaluateClue } from '../engine/evaluate';
import { countSolutions, solve } from '../engine/solver';
import type { CellRef, Clue, Placement, Scene } from '../engine/types';

const testScene: Scene = {
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

function allSatisfied(clues: Clue[], placement: Placement): boolean {
	return clues.every((clue) => evaluateClue(clue, testScene, placement) === 'satisfied');
}

function rowsOf(placement: Placement): number[] {
	return Object.values(placement)
		.filter((c): c is CellRef => c !== undefined)
		.map((c) => c.r);
}

function colsOf(placement: Placement): number[] {
	return Object.values(placement)
		.filter((c): c is CellRef => c !== undefined)
		.map((c) => c.c);
}

function expectPermutation(placement: Placement): void {
	const rows = rowsOf(placement);
	const cols = colsOf(placement);
	expect(new Set(rows).size).toBe(rows.length);
	expect(new Set(cols).size).toBe(cols.length);
}

describe('solve — unique solution', () => {
	// Solution: p1=(0,0)A, p2=(1,2)B, p3=(2,1)C.
	const clues: Clue[] = [
		{ type: 'in_row', person: 'p1', row: 0 },
		{ type: 'in_row', person: 'p2', row: 1 },
		{ type: 'beside_object', person: 'p1', object: 'register' },
		{ type: 'in_room', person: 'p2', room: 'roomB' },
	];

	it('finds the unique placement', () => {
		const outcome = solve(testScene, clues);
		expect(outcome.placement).not.toBeNull();
		expect(allSatisfied(clues, outcome.placement as Placement)).toBe(true);
	});

	it('returned placement is a valid permutation', () => {
		const outcome = solve(testScene, clues);
		expectPermutation(outcome.placement as Placement);
	});

	it('countSolutions reports exactly one', () => {
		expect(countSolutions(testScene, clues)).toBe(1);
	});
});

describe('solve — contradictory clues', () => {
	const clues: Clue[] = [
		{ type: 'in_row', person: 'p1', row: 0 },
		{ type: 'in_column', person: 'p1', col: 1 },
		// (0,1) holds the register object, so it is not occupiable: no placement.
	];

	it('countSolutions is zero', () => {
		expect(countSolutions(testScene, clues)).toBe(0);
	});

	it('solve returns null placement', () => {
		const outcome = solve(testScene, clues);
		expect(outcome.placement).toBeNull();
	});
});

describe('countSolutions — weak clues stop early', () => {
	// No clues at all: the scene admits 18 permutation placements.
	it('returns exactly 2 with limit 2 (proves early stop)', () => {
		expect(countSolutions(testScene, [], 2)).toBe(2);
	});

	it('respects a higher limit', () => {
		expect(countSolutions(testScene, [], 5)).toBe(5);
	});
});

describe('propagateOnly — beginner solved by unary techniques', () => {
	// Pin each person to a distinct row and column with unary clues only.
	const clues: Clue[] = [
		{ type: 'in_row', person: 'p1', row: 0 },
		{ type: 'in_column', person: 'p1', col: 0 },
		{ type: 'in_row', person: 'p2', row: 1 },
		{ type: 'in_column', person: 'p2', col: 2 },
	];

	it('solves with unary + propagateOnly, no search', () => {
		const outcome = solve(testScene, clues, { techniques: 'unary', propagateOnly: true });
		expect(outcome.placement).not.toBeNull();
		expect(outcome.usedSearch).toBe(false);
		expect(outcome.maxGuessDepth).toBe(0);
		expect(allSatisfied(clues, outcome.placement as Placement)).toBe(true);
		expectPermutation(outcome.placement as Placement);
	});
});

describe('propagateOnly — arc consistency required', () => {
	// A pure `offset` clue: unary filters cannot exploit it at all (it never
	// touches a single candidate set), so unary propagation stalls. Arc
	// consistency links the two candidate sets and, with exclusivity, fully
	// determines this unique placement (p1=(0,0), p2=(1,2), p3=(2,1)).
	const clues: Clue[] = [{ type: 'offset', a: 'p1', b: 'p2', dRow: -1, dCol: -2 }];

	it('unary + propagateOnly cannot finish', () => {
		const outcome = solve(testScene, clues, { techniques: 'unary', propagateOnly: true });
		expect(outcome.placement).toBeNull();
	});

	it('arc + propagateOnly finishes', () => {
		const outcome = solve(testScene, clues, { techniques: 'arc', propagateOnly: true });
		expect(outcome.placement).not.toBeNull();
		expect(outcome.usedSearch).toBe(false);
		expect(outcome.maxGuessDepth).toBe(0);
		expect(allSatisfied(clues, outcome.placement as Placement)).toBe(true);
	});

	it('the unique solution agrees with countSolutions', () => {
		expect(countSolutions(testScene, clues)).toBe(1);
	});
});

describe('solve — real search needed', () => {
	// An `offset` clue whose arc-consistency does NOT collapse the candidate sets
	// to singletons: propagation alone cannot finish, yet the placement is unique
	// and is reached through backtracking.
	const clues: Clue[] = [{ type: 'offset', a: 'p1', b: 'p2', dRow: -1, dCol: 2 }];

	it('cannot be solved by arc propagation alone', () => {
		const outcome = solve(testScene, clues, { techniques: 'arc', propagateOnly: true });
		expect(outcome.placement).toBeNull();
	});

	it('uses search with guess depth >= 1 and stays unique', () => {
		const outcome = solve(testScene, clues);
		expect(outcome.placement).not.toBeNull();
		expect(outcome.usedSearch).toBe(true);
		expect(outcome.maxGuessDepth).toBeGreaterThanOrEqual(1);
		expect(allSatisfied(clues, outcome.placement as Placement)).toBe(true);
		expect(countSolutions(testScene, clues)).toBe(1);
	});
});

describe('determinism', () => {
	const clues: Clue[] = [
		{ type: 'in_row', person: 'p1', row: 0 },
		{ type: 'in_room', person: 'p2', room: 'roomB' },
	];

	it('solve twice yields deeply equal outcomes', () => {
		const first = solve(testScene, clues);
		const second = solve(testScene, clues);
		expect(first).toEqual(second);
	});

	it('countSolutions twice yields the same number', () => {
		expect(countSolutions(testScene, clues)).toBe(countSolutions(testScene, clues));
	});
});

describe('row/column exclusivity', () => {
	it('every returned solution places one person per row and column', () => {
		const cluesPerCase: Clue[][] = [
			[],
			[{ type: 'in_room', person: 'p1', room: 'roomA' }],
			[{ type: 'offset', a: 'p1', b: 'p2', dRow: -1, dCol: -2 }],
		];
		for (const clues of cluesPerCase) {
			const outcome = solve(testScene, clues);
			expect(outcome.placement).not.toBeNull();
			expectPermutation(outcome.placement as Placement);
		}
	});
});

describe('alone / alone_with room-population filtering (soundness)', () => {
	// In this scene every permutation places the three people in three distinct
	// rooms, so an `alone` clue is satisfied by all of them. The room-population
	// filter must therefore never prune a valid solution.
	it('alone keeps every otherwise-valid solution', () => {
		const clues: Clue[] = [{ type: 'alone', person: 'p1' }];
		expect(countSolutions(testScene, clues, 20)).toBe(18);
		const outcome = solve(testScene, clues);
		expect(outcome.placement).not.toBeNull();
		expect(allSatisfied(clues, outcome.placement as Placement)).toBe(true);
	});

	it('alone combined with in_room narrows without dropping valid solutions', () => {
		const clues: Clue[] = [
			{ type: 'alone', person: 'p1' },
			{ type: 'in_room', person: 'p1', room: 'roomB' },
		];
		const outcome = solve(testScene, clues);
		expect(outcome.placement).not.toBeNull();
		const placement = outcome.placement as Placement;
		expect(allSatisfied(clues, placement)).toBe(true);
		expectPermutation(placement);
		expect(countSolutions(testScene, clues, 20)).toBeGreaterThanOrEqual(1);
	});

	// `alone_with` requires two people in the same room on distinct row+column.
	// roomC is a single row and roomB a single column, while pairing inside roomA
	// strands the third person on the blocked cell — so this scene admits none.
	// The clue must yield zero solutions rather than a spurious one.
	it('alone_with with no feasible room yields zero solutions', () => {
		const clues: Clue[] = [{ type: 'alone_with', a: 'p1', b: 'p2' }];
		expect(countSolutions(testScene, clues, 5)).toBe(0);
		expect(solve(testScene, clues).placement).toBeNull();
	});
});
