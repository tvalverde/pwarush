export type PersonId = string;
export type RoomId = string;

export type ObjectKind = 'bench' | 'desk' | 'flag' | 'register' | 'shelf' | 'plant' | 'puddle';

export interface CellRef {
	r: number;
	c: number;
}

export type Gender = 'masculine' | 'feminine';

export interface Person {
	id: PersonId;
	name: string;
	// Grammatical gender for clue agreement (e.g. Spanish "solo"/"sola"). Optional:
	// when absent, renderers fall back to the masculine form.
	gender?: Gender;
}

export interface Room {
	id: RoomId;
	nameKey: string;
	cells: CellRef[];
}

export interface SceneObject {
	kind: ObjectKind;
	nameKey: string;
	cell: CellRef;
}

export interface Scene {
	id: string;
	size: number;
	rooms: Room[];
	objects: SceneObject[];
	blockedCells: CellRef[];
	cast: Person[];
}

export type Placement = Partial<Record<PersonId, CellRef>>;

export type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'master';

export type Clue =
	| { type: 'in_room'; person: PersonId; room: RoomId }
	| { type: 'not_in_room'; person: PersonId; room: RoomId }
	| { type: 'beside_object'; person: PersonId; object: ObjectKind }
	| { type: 'adjacent_to_person'; a: PersonId; b: PersonId }
	| { type: 'alone'; person: PersonId }
	| { type: 'alone_with'; a: PersonId; b: PersonId }
	| { type: 'not_alone_with'; a: PersonId; b: PersonId }
	| { type: 'same_room'; a: PersonId; b: PersonId }
	| { type: 'offset'; a: PersonId; b: PersonId; dRow: number; dCol: number };

export interface Case {
	sceneId: string;
	people: Person[];
	victimId: PersonId;
	clues: Clue[];
	solution: Placement;
	difficulty: Difficulty;
	murdererId: PersonId;
}

export type ClueEvaluation = 'satisfied' | 'violated' | 'undecided';
