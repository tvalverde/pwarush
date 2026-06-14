import {
	casino,
	clinic,
	courtroom,
	gallery,
	hotel,
	mansion,
	museum,
	theater,
} from '../data/scenes';
import { evaluateClue, occupantsOfRoom } from './evaluate';
import { isOccupiable } from './grid';
import { createRng, pick, type Rng, shuffleInPlace } from './rng';
import { countSolutions } from './solver';
import type { Case, CellRef, Clue, Difficulty, PersonId, Placement, Scene } from './types';

const PLACEMENT_RESAMPLE_LIMIT = 100;
const GENERATION_ATTEMPT_LIMIT = 50;
const OFFSET_BOUND = 2;

interface VictimAssignment {
	victimId: PersonId;
	murdererId: PersonId;
}

interface SolvedScene extends VictimAssignment {
	placement: Placement;
}

// Difficulty maps to board size: bigger boards mean more people and more space to
// reason about. Each tier has one or more scenes of that size; a case picks one by
// seed for variety. (shop 5×5 stays authored as a fixture / for old saves, untiered.)
const SCENES_BY_DIFFICULTY: Record<Difficulty, Scene[]> = {
	beginner: [courtroom, gallery], // 4×4
	intermediate: [mansion, clinic], // 6×6
	expert: [theater, museum], // 7×7
	master: [hotel, casino], // 9×9
};

export function sceneForDifficulty(difficulty: Difficulty, seed?: number): Scene {
	const scenes = SCENES_BY_DIFFICULTY[difficulty];
	return seed === undefined ? scenes[0] : scenes[Math.abs(seed) % scenes.length];
}

/**
 * Backtracking assignment of one occupiable cell per row with distinct columns,
 * exploring columns in a shuffled order so the resulting permutation is random
 * yet reproducible for a given RNG stream.
 */
function sampleAssignment(scene: Scene, rng: Rng): CellRef[] | null {
	const usedCols = new Set<number>();
	const assignment: CellRef[] = [];

	const backtrack = (row: number): boolean => {
		if (row === scene.size) {
			return true;
		}
		const columns = shuffleInPlace(
			Array.from({ length: scene.size }, (_, c) => c),
			rng,
		);
		for (const c of columns) {
			if (usedCols.has(c) || !isOccupiable(scene, { r: row, c })) {
				continue;
			}
			usedCols.add(c);
			assignment[row] = { r: row, c };
			if (backtrack(row + 1)) {
				return true;
			}
			usedCols.delete(c);
		}
		return false;
	};

	return backtrack(0) ? assignment : null;
}

export function samplePlacement(scene: Scene, rng: Rng): Placement {
	const assignment = sampleAssignment(scene, rng);
	if (!assignment) {
		throw new Error(`Scene "${scene.id}" admits no permutation placement.`);
	}
	const people = shuffleInPlace(scene.cast.slice(), rng);
	const placement: Placement = {};
	people.forEach((person, index) => {
		placement[person.id] = assignment[index];
	});
	return placement;
}

/**
 * Lone-murderer invariant (§4.4): the victim must share a room with exactly one
 * other person, who becomes the murderer. Returns every valid (victim, murderer)
 * pairing so the caller can choose one uniformly.
 */
function victimAssignments(scene: Scene, placement: Placement): VictimAssignment[] {
	const assignments: VictimAssignment[] = [];
	for (const room of scene.rooms) {
		const occupants = occupantsOfRoom(room, placement);
		if (occupants.length === 2) {
			assignments.push({ victimId: occupants[0], murdererId: occupants[1] });
			assignments.push({ victimId: occupants[1], murdererId: occupants[0] });
		}
	}
	return assignments;
}

function sampleSolvedScene(scene: Scene, rng: Rng): SolvedScene {
	for (let attempt = 0; attempt < PLACEMENT_RESAMPLE_LIMIT; attempt++) {
		const placement = samplePlacement(scene, rng);
		const assignments = victimAssignments(scene, placement);
		if (assignments.length > 0) {
			return { placement, ...pick(assignments, rng) };
		}
	}
	throw new Error(
		`Scene "${scene.id}" never yielded a lone-murderer placement in ${PLACEMENT_RESAMPLE_LIMIT} samples.`,
	);
}

function cellOf(placement: Placement, person: PersonId): CellRef {
	const cell = placement[person];
	if (!cell) {
		throw new Error(`Placement is missing person "${person}".`);
	}
	return cell;
}

/**
 * Every catalog clue that holds in the (complete) solution, bounded as in §4.2:
 * offsets only within |d| <= 2, ordered pairs taken once (a before b in cast
 * order). Absolute row/column clues were removed from the catalogue, so the full
 * set is no longer guaranteed to pin the placement uniquely; generateCase
 * verifies uniqueness explicitly via the countSolutions guard.
 */
export function enumerateTrueClues(
	scene: Scene,
	placement: Placement,
	victimId?: PersonId,
): Clue[] {
	const clues: Clue[] = [];
	const cast = scene.cast;

	for (const person of cast) {
		const cell = cellOf(placement, person.id);
		// Exoneration clue: only ever about the victim (every non-murderer is "not
		// alone with the victim"), so it points the player away from a suspect.
		if (victimId && person.id !== victimId) {
			const exonerate: Clue = { type: 'not_alone_with', a: person.id, b: victimId };
			if (evaluateClue(exonerate, scene, placement) === 'satisfied') {
				clues.push(exonerate);
			}
		}
		for (const room of scene.rooms) {
			const inside = room.cells.some((c) => c.r === cell.r && c.c === cell.c);
			clues.push(
				inside
					? { type: 'in_room', person: person.id, room: room.id }
					: { type: 'not_in_room', person: person.id, room: room.id },
			);
		}
		for (const object of scene.objects) {
			const candidate: Clue = { type: 'beside_object', person: person.id, object: object.kind };
			if (evaluateClue(candidate, scene, placement) === 'satisfied') {
				clues.push(candidate);
			}
		}
		const aloneCandidate: Clue = { type: 'alone', person: person.id };
		if (evaluateClue(aloneCandidate, scene, placement) === 'satisfied') {
			clues.push(aloneCandidate);
		}
	}

	for (let i = 0; i < cast.length; i++) {
		for (let j = i + 1; j < cast.length; j++) {
			const a = cast[i].id;
			const b = cast[j].id;
			const cellA = cellOf(placement, a);
			const cellB = cellOf(placement, b);

			const pairCandidates: Clue[] = [
				{ type: 'adjacent_to_person', a, b },
				{ type: 'same_room', a, b },
				{ type: 'alone_with', a, b },
			];
			for (const candidate of pairCandidates) {
				if (evaluateClue(candidate, scene, placement) === 'satisfied') {
					clues.push(candidate);
				}
			}

			const dRow = cellA.r - cellB.r;
			const dCol = cellA.c - cellB.c;
			if (Math.abs(dRow) <= OFFSET_BOUND && Math.abs(dCol) <= OFFSET_BOUND) {
				clues.push({ type: 'offset', a, b, dRow, dCol });
			}
		}
	}

	return clues;
}

/**
 * A `same_room` or `alone_with` clue between the murderer and the victim would
 * name the solution outright, so it is never included in a case (§4.4).
 */
function revealsKiller(clue: Clue, assignment: VictimAssignment): boolean {
	if (clue.type !== 'same_room' && clue.type !== 'alone_with') {
		return false;
	}
	const pair = new Set([clue.a, clue.b]);
	return pair.has(assignment.murdererId) && pair.has(assignment.victimId);
}

/**
 * Greedy pruning over a shuffled clue order: a clue is dropped iff the remaining
 * set still admits exactly one solution. Passes repeat to a fixpoint so the
 * result is locally minimal — no surviving clue can be removed on its own
 * without losing uniqueness.
 */
function pruneClues(scene: Scene, clues: Clue[], rng: Rng): Clue[] {
	let kept = shuffleInPlace(clues.slice(), rng);
	let removedSomething = true;
	while (removedSomething) {
		removedSomething = false;
		for (const clue of kept.slice()) {
			const candidate = kept.filter((c) => c !== clue);
			if (countSolutions(scene, candidate, 2) === 1) {
				kept = candidate;
				removedSomething = true;
			}
		}
	}
	return kept;
}

function clueSubjects(clue: Clue): PersonId[] {
	return 'person' in clue ? [clue.person] : [clue.a, clue.b];
}

function clueKey(clue: Clue): string {
	return JSON.stringify(clue);
}

/**
 * Assigns each clue a living-suspect narrator (the victim never narrates),
 * preferring narrators who are not the clue's subject and balancing the load. Every
 * living suspect must end up with at least one testimony; if the minimal clue set
 * leaves someone silent, a redundant true clue (also true, so uniqueness is intact)
 * is added for them to narrate.
 */
function assignNarrators(
	scene: Scene,
	clues: Clue[],
	trueClues: Clue[],
	victimId: PersonId,
	rng: Rng,
): { clues: Clue[]; narrators: PersonId[] } {
	const living = scene.cast.map((person) => person.id).filter((id) => id !== victimId);
	const count = new Map<PersonId, number>(living.map((id) => [id, 0]));

	const pickNarrator = (clue: Clue): PersonId => {
		const subjects = new Set(clueSubjects(clue));
		const shuffled = shuffleInPlace(living.slice(), rng);
		const nonSubjects = shuffled.filter((id) => !subjects.has(id));
		const pool = nonSubjects.length > 0 ? nonSubjects : shuffled;
		pool.sort((a, b) => (count.get(a) ?? 0) - (count.get(b) ?? 0));
		return pool[0];
	};

	const resultClues = clues.slice();
	const narrators: PersonId[] = [];
	for (const clue of resultClues) {
		const narrator = pickNarrator(clue);
		narrators.push(narrator);
		count.set(narrator, (count.get(narrator) ?? 0) + 1);
	}

	const used = new Set(resultClues.map(clueKey));
	for (const id of living) {
		if ((count.get(id) ?? 0) > 0) continue;
		const spare =
			trueClues.find((clue) => !used.has(clueKey(clue)) && !clueSubjects(clue).includes(id)) ??
			trueClues.find((clue) => !used.has(clueKey(clue)));
		if (!spare) continue;
		resultClues.push(spare);
		narrators.push(id);
		used.add(clueKey(spare));
		count.set(id, 1);
	}

	return { clues: resultClues, narrators };
}

export function generateCase(scene: Scene, difficulty: Difficulty, seed: number): Case {
	const rng = createRng(seed);

	for (let attempt = 0; attempt < GENERATION_ATTEMPT_LIMIT; attempt++) {
		const solved = sampleSolvedScene(scene, rng);
		const trueClues = enumerateTrueClues(scene, solved.placement, solved.victimId).filter(
			(clue) => !revealsKiller(clue, solved),
		);
		const clues = pruneClues(scene, trueClues, rng);
		// Difficulty is fixed by the scene's board size (see sceneForDifficulty), not
		// by solving technique, so we keep the first locally-minimal clue set that pins
		// a unique solution and tag it with the requested tier. Without absolute
		// row/column clues uniqueness is not structural, hence the explicit guard.
		if (countSolutions(scene, clues, 2) !== 1) {
			continue;
		}
		const { clues: testimonies, narrators } = assignNarrators(
			scene,
			clues,
			trueClues,
			solved.victimId,
			rng,
		);
		return {
			sceneId: scene.id,
			people: scene.cast.slice(),
			victimId: solved.victimId,
			clues: testimonies,
			narrators,
			solution: solved.placement,
			difficulty,
			murdererId: solved.murdererId,
		};
	}

	throw new Error(
		`Scene "${scene.id}" produced no unique case in ${GENERATION_ATTEMPT_LIMIT} attempts.`,
	);
}
