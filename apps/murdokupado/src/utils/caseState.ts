import { SCENES } from '../data/scenes';
import { evaluateClue } from '../engine/evaluate';
import type { Case, ClueEvaluation, PersonId, Placement, Scene } from '../engine/types';

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
