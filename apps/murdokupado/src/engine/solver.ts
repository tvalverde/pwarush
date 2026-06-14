import { evaluateClue, neighbours, roomOf } from './evaluate';
import { cellKey, occupiableCells, sameCell } from './grid';
import type { CellRef, Clue, PersonId, Placement, Scene } from './types';

export type PropagationLevel = 'unary' | 'arc';

export interface SolveOptions {
	techniques?: PropagationLevel;
	propagateOnly?: boolean;
}

export interface SolveOutcome {
	placement: Placement | null;
	usedSearch: boolean;
	maxGuessDepth: number;
}

function besideObjectCells(scene: Scene, cells: CellRef[], object: string): CellRef[] {
	return cells.filter((cell) => {
		const room = roomOf(scene, cell);
		return neighbours(scene, cell).some((neighbour) => {
			const sameRoom = room?.cells.some((rc) => sameCell(rc, neighbour)) ?? false;
			const hasObject = scene.objects.some((o) => o.kind === object && sameCell(o.cell, neighbour));
			return sameRoom && hasObject;
		});
	});
}

/**
 * A candidate set is the ordered list of occupiable cells a person may still
 * occupy. Order is row-major and never mutated, so the deterministic search
 * order is a stable property of the scene, not of the propagation history.
 */
type CandidateSets = Map<PersonId, CellRef[]>;

function cloneCandidates(candidates: CandidateSets): CandidateSets {
	const copy: CandidateSets = new Map();
	for (const [person, cells] of candidates) {
		copy.set(person, cells.slice());
	}
	return copy;
}

function intersect(cells: CellRef[], allowed: CellRef[]): CellRef[] {
	const allowedKeys = new Set(allowed.map(cellKey));
	return cells.filter((cell) => allowedKeys.has(cellKey(cell)));
}

function applyUnaryFilters(scene: Scene, clues: Clue[], candidates: CandidateSets): void {
	const all = occupiableCells(scene);
	for (const clue of clues) {
		switch (clue.type) {
			case 'in_room': {
				const set = candidates.get(clue.person);
				if (set) {
					candidates.set(
						clue.person,
						set.filter((cell) => roomOf(scene, cell)?.id === clue.room),
					);
				}
				break;
			}
			case 'not_in_room': {
				const set = candidates.get(clue.person);
				if (set) {
					candidates.set(
						clue.person,
						set.filter((cell) => roomOf(scene, cell)?.id !== clue.room),
					);
				}
				break;
			}
			case 'beside_object': {
				const set = candidates.get(clue.person);
				if (set) {
					candidates.set(clue.person, intersect(set, besideObjectCells(scene, all, clue.object)));
				}
				break;
			}
		}
	}
}

function pairCompatible(
	scene: Scene,
	clue: Clue,
	personA: PersonId,
	cellA: CellRef,
	cellB: CellRef,
): boolean {
	if (sameCell(cellA, cellB) || cellA.r === cellB.r || cellA.c === cellB.c) {
		return false;
	}
	switch (clue.type) {
		case 'offset': {
			// Compatibility is directional: clue fixes pos(a) = pos(b) + delta.
			const [a, b] = personA === clue.a ? [cellA, cellB] : [cellB, cellA];
			return a.r === b.r + clue.dRow && a.c === b.c + clue.dCol;
		}
		case 'adjacent_to_person':
			return neighbours(scene, cellA).some((n) => sameCell(n, cellB));
		case 'same_room':
		case 'alone_with':
			return roomOf(scene, cellA)?.id === roomOf(scene, cellB)?.id;
		default:
			return true;
	}
}

function applyArcFilters(scene: Scene, clues: Clue[], candidates: CandidateSets): void {
	for (const clue of clues) {
		if (
			clue.type !== 'offset' &&
			clue.type !== 'adjacent_to_person' &&
			clue.type !== 'same_room' &&
			clue.type !== 'alone_with'
		) {
			continue;
		}
		const setA = candidates.get(clue.a);
		const setB = candidates.get(clue.b);
		if (!setA || !setB) continue;
		candidates.set(
			clue.a,
			setA.filter((cellA) =>
				setB.some((cellB) => pairCompatible(scene, clue, clue.a, cellA, cellB)),
			),
		);
		const prunedA = candidates.get(clue.a);
		if (!prunedA) continue;
		candidates.set(
			clue.b,
			setB.filter((cellB) =>
				prunedA.some((cellA) => pairCompatible(scene, clue, clue.a, cellA, cellB)),
			),
		);
	}
}

/**
 * Removes an assigned person's cell, row and column from every other candidate
 * set (permutation exclusivity), then commits any naked single that appears as
 * a consequence, repeating until no further committed person is found.
 */
function applyExclusivity(candidates: CandidateSets, committed: Map<PersonId, CellRef>): boolean {
	let progressed = true;
	while (progressed) {
		progressed = false;
		for (const [person, cell] of committed) {
			for (const [other, cells] of candidates) {
				if (other === person) continue;
				const filtered = cells.filter(
					(c) => !(c.r === cell.r || c.c === cell.c || sameCell(c, cell)),
				);
				if (filtered.length !== cells.length) {
					candidates.set(other, filtered);
				}
			}
		}
		for (const [person, cells] of candidates) {
			if (cells.length === 1 && !committed.has(person)) {
				committed.set(person, cells[0]);
				progressed = true;
			}
		}
	}
	return true;
}

/**
 * Room-population filter for `alone` / `alone_with`: only once the clue person's
 * room is *determined* (the person is committed) may we exclude that room from
 * others. Excluding earlier would be unsound, since the person might still move.
 */
function applyRoomPopulation(
	scene: Scene,
	clues: Clue[],
	candidates: CandidateSets,
	committed: Map<PersonId, CellRef>,
): void {
	for (const clue of clues) {
		if (clue.type === 'alone') {
			const cell = committed.get(clue.person);
			if (!cell) continue;
			const room = roomOf(scene, cell);
			if (!room) continue;
			for (const [other, cells] of candidates) {
				if (other === clue.person) continue;
				candidates.set(
					other,
					cells.filter((c) => !room.cells.some((rc) => sameCell(rc, c))),
				);
			}
		} else if (clue.type === 'alone_with') {
			const cellA = committed.get(clue.a);
			if (!cellA) continue;
			const room = roomOf(scene, cellA);
			if (!room) continue;
			for (const [other, cells] of candidates) {
				if (other === clue.a || other === clue.b) continue;
				candidates.set(
					other,
					cells.filter((c) => !room.cells.some((rc) => sameCell(rc, c))),
				);
			}
		}
	}
}

function propagate(
	scene: Scene,
	clues: Clue[],
	candidates: CandidateSets,
	committed: Map<PersonId, CellRef>,
	level: PropagationLevel,
): boolean {
	let snapshot = '';
	let next = serialize(candidates, committed);
	while (snapshot !== next) {
		snapshot = next;
		applyUnaryFilters(scene, clues, candidates);
		applyExclusivity(candidates, committed);
		if (level === 'arc') {
			applyArcFilters(scene, clues, candidates);
			applyRoomPopulation(scene, clues, candidates, committed);
			applyExclusivity(candidates, committed);
		}
		for (const [, cells] of candidates) {
			if (cells.length === 0) return false;
		}
		if (hasColumnRowConflict(committed)) return false;
		next = serialize(candidates, committed);
	}
	return true;
}

function serialize(candidates: CandidateSets, committed: Map<PersonId, CellRef>): string {
	const parts: string[] = [];
	const people = [...candidates.keys()].sort();
	for (const person of people) {
		const cells = candidates.get(person) ?? [];
		const committedCell = committed.get(person);
		parts.push(
			`${person}:${cells.map(cellKey).join(',')}|${committedCell ? cellKey(committedCell) : '-'}`,
		);
	}
	return parts.join(';');
}

function hasColumnRowConflict(committed: Map<PersonId, CellRef>): boolean {
	const rows = new Set<number>();
	const cols = new Set<number>();
	for (const cell of committed.values()) {
		if (rows.has(cell.r) || cols.has(cell.c)) return true;
		rows.add(cell.r);
		cols.add(cell.c);
	}
	return false;
}

function allCluesSatisfied(scene: Scene, clues: Clue[], placement: Placement): boolean {
	return clues.every((clue) => evaluateClue(clue, scene, placement) === 'satisfied');
}

function toPlacement(committed: Map<PersonId, CellRef>): Placement {
	const placement: Placement = {};
	for (const [person, cell] of committed) {
		placement[person] = cell;
	}
	return placement;
}

interface SearchState {
	maxGuessDepth: number;
	usedSearch: boolean;
}

/**
 * Backtracking search. Returns the first verified solution found (deterministic
 * row-major order). `depth` counts nested guesses; the first level of guessing
 * is depth 1, so a placement solved by pure propagation reports depth 0.
 */
function search(
	scene: Scene,
	clues: Clue[],
	candidates: CandidateSets,
	committed: Map<PersonId, CellRef>,
	level: PropagationLevel,
	depth: number,
	state: SearchState,
): Placement | null {
	if (!propagate(scene, clues, candidates, committed, level)) {
		return null;
	}
	const unassigned = [...candidates.keys()]
		.filter((person) => !committed.has(person))
		.sort((a, b) => {
			const lenDiff = (candidates.get(a)?.length ?? 0) - (candidates.get(b)?.length ?? 0);
			return lenDiff !== 0 ? lenDiff : a < b ? -1 : 1;
		});

	if (unassigned.length === 0) {
		const placement = toPlacement(committed);
		return allCluesSatisfied(scene, clues, placement) ? placement : null;
	}

	const person = unassigned[0];
	const cells = (candidates.get(person) ?? []).slice();
	state.usedSearch = true;
	state.maxGuessDepth = Math.max(state.maxGuessDepth, depth + 1);

	for (const cell of cells) {
		const branchCandidates = cloneCandidates(candidates);
		const branchCommitted = new Map(committed);
		branchCommitted.set(person, cell);
		branchCandidates.set(person, [cell]);
		const result = search(scene, clues, branchCandidates, branchCommitted, level, depth + 1, state);
		if (result) return result;
	}
	return null;
}

function initialCandidates(scene: Scene): CandidateSets {
	const cells = occupiableCells(scene);
	const candidates: CandidateSets = new Map();
	for (const person of scene.cast) {
		candidates.set(person.id, cells.slice());
	}
	return candidates;
}

export function solve(scene: Scene, clues: Clue[], options: SolveOptions = {}): SolveOutcome {
	const level = options.techniques ?? 'arc';
	const propagateOnly = options.propagateOnly ?? false;
	const candidates = initialCandidates(scene);
	const committed = new Map<PersonId, CellRef>();

	if (propagateOnly) {
		const consistent = propagate(scene, clues, candidates, committed, level);
		const everyoneCommitted = scene.cast.every((person) => committed.has(person.id));
		if (consistent && everyoneCommitted) {
			const placement = toPlacement(committed);
			if (allCluesSatisfied(scene, clues, placement)) {
				return { placement, usedSearch: false, maxGuessDepth: 0 };
			}
		}
		return { placement: null, usedSearch: false, maxGuessDepth: 0 };
	}

	const state: SearchState = { maxGuessDepth: 0, usedSearch: false };
	const placement = search(scene, clues, candidates, committed, level, 0, state);
	return {
		placement,
		usedSearch: placement ? state.usedSearch : false,
		maxGuessDepth: placement ? state.maxGuessDepth : 0,
	};
}

/**
 * Counts complete, clue-verified solutions, stopping as soon as `limit` is
 * reached. Deterministic: branches are explored in the same fixed order as
 * `solve`, so the returned count is reproducible.
 */
export function countSolutions(scene: Scene, clues: Clue[], limit = 2): number {
	const candidates = initialCandidates(scene);
	const committed = new Map<PersonId, CellRef>();
	let found = 0;

	const countFrom = (
		branchCandidates: CandidateSets,
		branchCommitted: Map<PersonId, CellRef>,
	): void => {
		if (found >= limit) return;
		if (!propagate(scene, clues, branchCandidates, branchCommitted, 'arc')) return;
		const unassigned = [...branchCandidates.keys()]
			.filter((person) => !branchCommitted.has(person))
			.sort((a, b) => {
				const lenDiff =
					(branchCandidates.get(a)?.length ?? 0) - (branchCandidates.get(b)?.length ?? 0);
				return lenDiff !== 0 ? lenDiff : a < b ? -1 : 1;
			});
		if (unassigned.length === 0) {
			if (allCluesSatisfied(scene, clues, toPlacement(branchCommitted))) {
				found += 1;
			}
			return;
		}
		const person = unassigned[0];
		for (const cell of (branchCandidates.get(person) ?? []).slice()) {
			if (found >= limit) return;
			const nextCandidates = cloneCandidates(branchCandidates);
			const nextCommitted = new Map(branchCommitted);
			nextCommitted.set(person, cell);
			nextCandidates.set(person, [cell]);
			countFrom(nextCandidates, nextCommitted);
		}
	};

	countFrom(candidates, committed);
	return Math.min(found, limit);
}
