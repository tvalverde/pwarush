import { SCENES } from '../data/scenes';
import { evaluateClue } from '../engine/evaluate';
import type { Case, ClueEvaluation, PersonId, Placement, Scene } from '../engine/types';

// Clue types the current catalogue can evaluate and render. A case persisted by
// an older version may carry retired types (in_row / in_column); such a case can
// no longer be shown, so callers (e.g. resuming a saved game) must skip it.
const SUPPORTED_CLUE_TYPES = new Set<string>([
	'in_room',
	'not_in_room',
	'beside_object',
	'adjacent_to_person',
	'alone',
	'alone_with',
	'same_room',
	'offset',
]);

export function isCaseRenderable(activeCase: Case): boolean {
	// Older saves predate per-clue narrators; without a narrator per clue the grouped
	// clue panel cannot render, so treat such a case as not resumable.
	if (
		!Array.isArray(activeCase.narrators) ||
		activeCase.narrators.length !== activeCase.clues.length
	) {
		return false;
	}
	return activeCase.clues.every((clue) => SUPPORTED_CLUE_TYPES.has(clue.type));
}

export function sceneOf(activeCase: Case): Scene {
	const scene = SCENES[activeCase.sceneId];
	if (!scene) {
		throw new Error(`Unknown scene "${activeCase.sceneId}".`);
	}
	return scene;
}

export function evaluateAllClues(activeCase: Case, placement: Placement): ClueEvaluation[] {
	const scene = sceneOf(activeCase);
	return activeCase.clues.map((clue) => evaluateClue(clue, scene, placement));
}

export function violatedClueCount(activeCase: Case, placement: Placement): number {
	return evaluateAllClues(activeCase, placement).filter((state) => state === 'violated').length;
}

export function placedCount(placement: Placement): number {
	return Object.values(placement).filter((cell) => cell !== undefined).length;
}

export function hasUserInput(placement: Placement): boolean {
	return placedCount(placement) > 0;
}

export function personAt(placement: Placement, r: number, c: number): PersonId | null {
	for (const [personId, cell] of Object.entries(placement)) {
		if (cell && cell.r === r && cell.c === c) {
			return personId;
		}
	}
	return null;
}

export function isCaseSolved(activeCase: Case, placement: Placement): boolean {
	const everyonePlaced = activeCase.people.every((person) => placement[person.id]);
	if (!everyonePlaced) {
		return false;
	}
	return evaluateAllClues(activeCase, placement).every((state) => state === 'satisfied');
}
