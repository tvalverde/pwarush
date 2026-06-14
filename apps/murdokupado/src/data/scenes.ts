import type { Scene } from '../engine/types';

export const courtroom: Scene = {
	id: 'courtroom',
	size: 4,
	rooms: [
		{
			id: 'courtroom',
			nameKey: 'room.courtroom',
			cells: [
				{ r: 0, c: 0 },
				{ r: 0, c: 1 },
				{ r: 1, c: 0 },
				{ r: 1, c: 1 },
			],
		},
		{
			id: 'hallway',
			nameKey: 'room.hallway',
			cells: [
				{ r: 0, c: 2 },
				{ r: 0, c: 3 },
				{ r: 1, c: 2 },
				{ r: 1, c: 3 },
				{ r: 2, c: 2 },
				{ r: 2, c: 3 },
				{ r: 3, c: 2 },
				{ r: 3, c: 3 },
			],
		},
		{
			id: 'office',
			nameKey: 'room.office',
			cells: [
				{ r: 2, c: 0 },
				{ r: 2, c: 1 },
				{ r: 3, c: 0 },
				{ r: 3, c: 1 },
			],
		},
	],
	objects: [
		{ kind: 'desk', nameKey: 'object.desk', cell: { r: 0, c: 1 } },
		{ kind: 'bench', nameKey: 'object.bench', cell: { r: 1, c: 3 } },
		{ kind: 'flag', nameKey: 'object.flag', cell: { r: 3, c: 0 } },
	],
	blockedCells: [
		{ r: 0, c: 3 },
		{ r: 2, c: 0 },
	],
	cast: [
		{ id: 'mara', name: 'Mara', gender: 'feminine' },
		{ id: 'bo', name: 'Bo', gender: 'masculine' },
		{ id: 'gemma', name: 'Gemma', gender: 'feminine' },
		{ id: 'dee', name: 'Dee', gender: 'feminine' },
	],
};

export const shop: Scene = {
	id: 'shop',
	size: 5,
	rooms: [
		{
			id: 'salesfloor',
			nameKey: 'room.salesfloor',
			cells: [
				{ r: 0, c: 0 },
				{ r: 0, c: 1 },
				{ r: 0, c: 2 },
				{ r: 1, c: 0 },
				{ r: 1, c: 1 },
				{ r: 1, c: 2 },
			],
		},
		{
			id: 'storage',
			nameKey: 'room.storage',
			cells: [
				{ r: 0, c: 3 },
				{ r: 0, c: 4 },
				{ r: 1, c: 3 },
				{ r: 1, c: 4 },
			],
		},
		{
			id: 'checkout',
			nameKey: 'room.checkout',
			cells: [
				{ r: 2, c: 0 },
				{ r: 2, c: 1 },
				{ r: 2, c: 2 },
				{ r: 2, c: 3 },
				{ r: 2, c: 4 },
				{ r: 3, c: 0 },
				{ r: 3, c: 1 },
				{ r: 3, c: 2 },
			],
		},
		{
			id: 'street',
			nameKey: 'room.street',
			cells: [
				{ r: 3, c: 3 },
				{ r: 3, c: 4 },
				{ r: 4, c: 0 },
				{ r: 4, c: 1 },
				{ r: 4, c: 2 },
				{ r: 4, c: 3 },
				{ r: 4, c: 4 },
			],
		},
	],
	objects: [
		{ kind: 'register', nameKey: 'object.register', cell: { r: 0, c: 1 } },
		{ kind: 'shelf', nameKey: 'object.shelf', cell: { r: 1, c: 3 } },
		{ kind: 'plant', nameKey: 'object.plant', cell: { r: 3, c: 1 } },
		{ kind: 'puddle', nameKey: 'object.puddle', cell: { r: 4, c: 2 } },
	],
	blockedCells: [
		{ r: 0, c: 4 },
		{ r: 2, c: 0 },
	],
	cast: [
		{ id: 'rex', name: 'Rex', gender: 'masculine' },
		{ id: 'ash', name: 'Ash', gender: 'masculine' },
		{ id: 'vera', name: 'Vera', gender: 'feminine' },
		{ id: 'nell', name: 'Nell', gender: 'feminine' },
		{ id: 'otto', name: 'Otto', gender: 'masculine' },
	],
};

export const SCENES: Record<string, Scene> = {
	courtroom,
	shop,
};
