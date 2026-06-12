import { describe, expect, it } from 'vitest';
import { evaluateClue, neighbours, occupantsOfRoom, roomOf } from '../engine/evaluate';
import type { Clue, Placement, Scene } from '../engine/types';

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

function evaluate(clue: Clue, placement: Placement) {
	return evaluateClue(clue, testScene, placement);
}

describe('helpers', () => {
	it('roomOf finds the owning room', () => {
		expect(roomOf(testScene, { r: 0, c: 0 })?.id).toBe('roomA');
		expect(roomOf(testScene, { r: 2, c: 2 })?.id).toBe('roomB');
		expect(roomOf(testScene, { r: 2, c: 1 })?.id).toBe('roomC');
	});

	it('neighbours returns orthogonal in-bounds cells', () => {
		expect(neighbours(testScene, { r: 0, c: 0 })).toEqual([
			{ r: 1, c: 0 },
			{ r: 0, c: 1 },
		]);
		expect(neighbours(testScene, { r: 1, c: 1 })).toHaveLength(4);
	});

	it('occupantsOfRoom lists placed people of a room', () => {
		const placement: Placement = { p1: { r: 0, c: 0 }, p2: { r: 1, c: 1 }, p3: { r: 2, c: 0 } };
		const roomA = testScene.rooms[0];
		expect(occupantsOfRoom(roomA, placement).sort()).toEqual(['p1', 'p2']);
	});
});

describe('in_row', () => {
	const clue: Clue = { type: 'in_row', person: 'p1', row: 1 };
	it('undecided before placement', () => {
		expect(evaluate(clue, {})).toBe('undecided');
	});
	it('satisfied when in the row', () => {
		expect(evaluate(clue, { p1: { r: 1, c: 0 } })).toBe('satisfied');
	});
	it('violated when in another row', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 } })).toBe('violated');
	});
});

describe('in_column', () => {
	const clue: Clue = { type: 'in_column', person: 'p1', col: 2 };
	it('undecided before placement', () => {
		expect(evaluate(clue, {})).toBe('undecided');
	});
	it('satisfied when in the column', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 2 } })).toBe('satisfied');
	});
	it('violated when in another column', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 } })).toBe('violated');
	});
});

describe('in_room', () => {
	const clue: Clue = { type: 'in_room', person: 'p1', room: 'roomB' };
	it('undecided before placement', () => {
		expect(evaluate(clue, {})).toBe('undecided');
	});
	it('satisfied when in the room', () => {
		expect(evaluate(clue, { p1: { r: 1, c: 2 } })).toBe('satisfied');
	});
	it('violated when in another room', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 } })).toBe('violated');
	});
});

describe('not_in_room', () => {
	const clue: Clue = { type: 'not_in_room', person: 'p1', room: 'roomB' };
	it('undecided before placement', () => {
		expect(evaluate(clue, {})).toBe('undecided');
	});
	it('satisfied when outside the room', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 } })).toBe('satisfied');
	});
	it('violated when inside the room', () => {
		expect(evaluate(clue, { p1: { r: 1, c: 2 } })).toBe('violated');
	});
});

describe('beside_object', () => {
	const clue: Clue = { type: 'beside_object', person: 'p1', object: 'register' };
	it('undecided before placement', () => {
		expect(evaluate(clue, {})).toBe('undecided');
	});
	it('satisfied when a same-room neighbour holds the object', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 } })).toBe('satisfied');
	});
	it('violated when no neighbour holds the object', () => {
		expect(evaluate(clue, { p1: { r: 2, c: 0 } })).toBe('violated');
	});
});

describe('adjacent_to_person vs beside room semantics', () => {
	it('adjacent_to_person is room-independent (satisfied across a room boundary)', () => {
		const clue: Clue = { type: 'adjacent_to_person', a: 'p1', b: 'p2' };
		const placement: Placement = { p1: { r: 0, c: 1 }, p2: { r: 0, c: 2 } };
		expect(evaluate(clue, placement)).toBe('satisfied');
	});

	it('beside_object requires SAME room: object neighbour in another room does NOT satisfy', () => {
		const clue: Clue = { type: 'beside_object', person: 'p1', object: 'register' };
		const placement: Placement = { p1: { r: 0, c: 2 } };
		expect(roomOf(testScene, { r: 0, c: 2 })?.id).toBe('roomB');
		expect(roomOf(testScene, { r: 0, c: 1 })?.id).toBe('roomA');
		expect(evaluate(clue, placement)).toBe('violated');
	});

	it('adjacent_to_person undecided until both placed, violated when apart', () => {
		const clue: Clue = { type: 'adjacent_to_person', a: 'p1', b: 'p2' };
		expect(evaluate(clue, { p1: { r: 0, c: 0 } })).toBe('undecided');
		expect(evaluate(clue, { p1: { r: 0, c: 0 }, p2: { r: 2, c: 1 } })).toBe('violated');
	});
});

describe('offset', () => {
	const clue: Clue = { type: 'offset', a: 'p1', b: 'p2', dRow: -1, dCol: 0 };
	it('undecided until both placed', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 } })).toBe('undecided');
	});
	it('satisfied when pos(a) = pos(b) + offset exactly', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 }, p2: { r: 1, c: 0 } })).toBe('satisfied');
	});
	it('violated otherwise', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 }, p2: { r: 2, c: 0 } })).toBe('violated');
	});
});

describe('same_room', () => {
	const clue: Clue = { type: 'same_room', a: 'p1', b: 'p2' };
	it('undecided until both placed', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 } })).toBe('undecided');
	});
	it('satisfied when both share a room', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 }, p2: { r: 1, c: 1 } })).toBe('satisfied');
	});
	it('violated when in different rooms', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 }, p2: { r: 0, c: 2 } })).toBe('violated');
	});
});

describe('alone', () => {
	const clue: Clue = { type: 'alone', person: 'p1' };
	it('undecided before placement', () => {
		expect(evaluate(clue, {})).toBe('undecided');
	});
	it('violated early when another person shares the known room', () => {
		const placement: Placement = { p1: { r: 0, c: 0 }, p2: { r: 1, c: 1 } };
		expect(evaluate(clue, placement)).toBe('violated');
	});
	it('undecided when alone but the room can still receive someone', () => {
		const placement: Placement = { p1: { r: 0, c: 0 } };
		expect(evaluate(clue, placement)).toBe('undecided');
	});
	it('satisfied only once the room is sealed by full placement', () => {
		const placement: Placement = { p1: { r: 2, c: 0 } };
		expect(evaluate(clue, placement)).toBe('undecided');
		const full: Placement = { p1: { r: 2, c: 0 }, p2: { r: 0, c: 0 }, p3: { r: 0, c: 2 } };
		expect(evaluate(clue, full)).toBe('satisfied');
	});

	it('satisfied early when the room is sealed by occupiable-cell exhaustion', () => {
		const sealedScene: Scene = {
			...testScene,
			rooms: [
				{ id: 'solo', nameKey: 'room.solo', cells: [{ r: 2, c: 0 }] },
				{
					id: 'rest',
					nameKey: 'room.rest',
					cells: testScene.rooms
						.flatMap((room) => room.cells)
						.filter((cell) => !(cell.r === 2 && cell.c === 0)),
				},
			],
		};
		const placement: Placement = { p1: { r: 2, c: 0 } };
		expect(evaluateClue(clue, sealedScene, placement)).toBe('satisfied');
	});
});

describe('alone_with', () => {
	const clue: Clue = { type: 'alone_with', a: 'p1', b: 'p2' };
	it('undecided before both placed', () => {
		expect(evaluate(clue, { p1: { r: 0, c: 0 } })).toBe('undecided');
	});
	it('violated early when a third person sits in a known room', () => {
		const placement: Placement = { p1: { r: 0, c: 0 }, p3: { r: 1, c: 1 } };
		expect(evaluate(clue, placement)).toBe('violated');
	});
	it('violated early when a and b are placed in different rooms', () => {
		const placement: Placement = { p1: { r: 0, c: 0 }, p2: { r: 0, c: 2 } };
		expect(evaluate(clue, placement)).toBe('violated');
	});
	it('undecided when the pair shares an open room that could still fill', () => {
		const placement: Placement = { p1: { r: 0, c: 0 }, p2: { r: 1, c: 1 } };
		expect(evaluate(clue, placement)).toBe('undecided');
	});
	it('satisfied when exactly the pair occupies a sealed room (full placement)', () => {
		const placement: Placement = {
			p1: { r: 2, c: 0 },
			p2: { r: 2, c: 1 },
			p3: { r: 0, c: 2 },
		};
		expect(evaluate(clue, placement)).toBe('satisfied');
	});
});
