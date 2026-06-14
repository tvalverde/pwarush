import { sameCell } from './grid';
import { deduce } from './solver';
import type { CellRef, Clue, PersonId, Placement, Scene } from './types';

export interface HintResult {
	personId: PersonId;
	cell: CellRef;
	// true: the placement is logically forced from what the player already has right;
	// false: nothing was deducible, so an unplaced person's solution cell is revealed.
	deduced: boolean;
}

/**
 * The next help step for the player. Propagates from the player's CORRECT
 * placements (wrong ones are ignored so they don't poison the deduction) and
 * returns the first suspect whose cell is then forced — the logical next step.
 * If none is forced by propagation, it falls back to revealing an unplaced
 * suspect's solution cell, so a hint is always actionable. Returns null when the
 * board already matches the solution.
 */
export function nextHint(
	scene: Scene,
	clues: Clue[],
	solution: Placement,
	placement: Placement,
): HintResult | null {
	const committed = new Map<PersonId, CellRef>();
	for (const person of scene.cast) {
		const placed = placement[person.id];
		const correct = solution[person.id];
		if (placed && correct && sameCell(placed, correct)) {
			committed.set(person.id, placed);
		}
	}
	if (committed.size === scene.cast.length) return null;

	const deduced = deduce(scene, clues, committed);
	for (const person of scene.cast) {
		if (committed.has(person.id)) continue;
		const cell = deduced.get(person.id);
		if (cell) return { personId: person.id, cell, deduced: true };
	}

	for (const person of scene.cast) {
		if (committed.has(person.id)) continue;
		const cell = solution[person.id];
		if (cell) return { personId: person.id, cell, deduced: false };
	}
	return null;
}
