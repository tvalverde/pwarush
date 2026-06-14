import { describe, expect, it } from 'vitest';
import { courtroom, hotel, mansion, theater } from '../data/scenes';
import { evaluateClue, occupantsOfRoom, roomOf } from '../engine/evaluate';
import { enumerateTrueClues, generateCase, sceneForDifficulty } from '../engine/generator';
import { countSolutions } from '../engine/solver';
import type { Case, Clue, Difficulty, Placement, Scene } from '../engine/types';

const TIERS: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];

function allCluesSatisfied(scene: Scene, clues: Clue[], placement: Placement): boolean {
	return clues.every((clue) => evaluateClue(clue, scene, placement) === 'satisfied');
}

function isLoneMurderer(scene: Scene, generated: Case): boolean {
	const victimCell = generated.solution[generated.victimId];
	if (!victimCell) {
		return false;
	}
	const room = roomOf(scene, victimCell);
	if (!room) {
		return false;
	}
	const occupants = occupantsOfRoom(room, generated.solution);
	return (
		occupants.length === 2 &&
		occupants.includes(generated.victimId) &&
		occupants.includes(generated.murdererId)
	);
}

function revealsKillerPair(clue: Clue, generated: Case): boolean {
	if (clue.type !== 'same_room' && clue.type !== 'alone_with') {
		return false;
	}
	const pair = new Set([clue.a, clue.b]);
	return pair.has(generated.murdererId) && pair.has(generated.victimId);
}

describe('sceneForDifficulty', () => {
	it('maps beginner to the 4x4 courtroom', () => {
		expect(sceneForDifficulty('beginner')).toBe(courtroom);
	});

	it('maps each higher tier to its own larger scene', () => {
		expect(sceneForDifficulty('intermediate')).toBe(mansion); // 6×6
		expect(sceneForDifficulty('expert')).toBe(theater); // 7×7
		expect(sceneForDifficulty('master')).toBe(hotel); // 9×9
	});
});

describe('enumerateTrueClues', () => {
	it('pins the placement uniquely (countSolutions === 1)', () => {
		const placement: Placement = {
			mara: { r: 0, c: 0 },
			bo: { r: 1, c: 1 },
			gemma: { r: 2, c: 2 },
			dee: { r: 3, c: 3 },
		};
		const clues = enumerateTrueClues(courtroom, placement);
		expect(allCluesSatisfied(courtroom, clues, placement)).toBe(true);
		expect(countSolutions(courtroom, clues, 2)).toBe(1);
	});

	it('no longer emits absolute row/column clues', () => {
		const placement: Placement = {
			mara: { r: 0, c: 0 },
			bo: { r: 1, c: 1 },
			gemma: { r: 2, c: 2 },
			dee: { r: 3, c: 3 },
		};
		const clues = enumerateTrueClues(courtroom, placement);
		expect(clues.some((clue) => clue.type === ('in_row' as Clue['type']))).toBe(false);
		expect(clues.some((clue) => clue.type === ('in_column' as Clue['type']))).toBe(false);
	});

	it('emits offsets only within the |d| <= 2 bound', () => {
		const placement: Placement = {
			mara: { r: 0, c: 0 },
			bo: { r: 1, c: 1 },
			gemma: { r: 2, c: 2 },
			dee: { r: 3, c: 3 },
		};
		const offsets = enumerateTrueClues(courtroom, placement).filter(
			(clue): clue is Extract<Clue, { type: 'offset' }> => clue.type === 'offset',
		);
		for (const offset of offsets) {
			expect(Math.abs(offset.dRow)).toBeLessThanOrEqual(2);
			expect(Math.abs(offset.dCol)).toBeLessThanOrEqual(2);
			expect(offset.dRow === 0 && offset.dCol === 0).toBe(false);
		}
		// (0,0)->(3,3) spans 3 cells, so that pair must be absent.
		expect(offsets.some((o) => o.a === 'mara' && o.b === 'dee')).toBe(false);
	});

	it('emits exoneration clues only about the victim, never about the murderer', () => {
		const generated = generateCase(mansion, 'intermediate', 3);
		const trueClues = enumerateTrueClues(mansion, generated.solution, generated.victimId);
		const exonerations = trueClues.filter(
			(clue): clue is Extract<Clue, { type: 'not_alone_with' }> => clue.type === 'not_alone_with',
		);
		expect(exonerations.length).toBeGreaterThan(0);
		for (const exoneration of exonerations) {
			expect(exoneration.b).toBe(generated.victimId); // always about the victim
			expect(exoneration.a).not.toBe(generated.murdererId); // never clears the killer
			expect(exoneration.a).not.toBe(generated.victimId);
		}
	});
});

describe('generateCase — determinism', () => {
	it('reproduces the same case for a given seed', () => {
		const first = generateCase(courtroom, 'beginner', 7);
		const second = generateCase(courtroom, 'beginner', 7);
		expect(first).toEqual(second);
	});

	it('different seeds explore different cases', () => {
		const a = generateCase(mansion, 'intermediate', 1);
		const b = generateCase(mansion, 'intermediate', 2);
		expect(a).not.toEqual(b);
	});
});

describe('generateCase — property run across tiers', () => {
	// Kept small: the master tier is a 9×9 scene (~1 s/case), so a large sweep would
	// dominate the unit run. 8 seeds × 4 tiers still exercises every scene broadly.
	const SEEDS = Array.from({ length: 8 }, (_, i) => i + 1);

	for (const tier of TIERS) {
		const scene = sceneForDifficulty(tier);

		describe(`tier "${tier}"`, () => {
			for (const seed of SEEDS) {
				it(`seed ${seed} yields a sound, unique, minimal case`, () => {
					const generated = generateCase(scene, tier, seed);

					expect(generated.sceneId).toBe(scene.id);
					expect(generated.people).toHaveLength(scene.size);

					// Unique solution that the stored solution satisfies.
					expect(allCluesSatisfied(scene, generated.clues, generated.solution)).toBe(true);
					expect(countSolutions(scene, generated.clues, 2)).toBe(1);

					// Lone-murderer invariant.
					expect(isLoneMurderer(scene, generated)).toBe(true);
					expect(generated.murdererId).not.toBe(generated.victimId);

					// The clue set never names the killer pair directly.
					expect(generated.clues.some((clue) => revealsKillerPair(clue, generated))).toBe(false);

					// Difficulty is the requested tier (set by board size, not classified).
					expect(generated.difficulty).toBe(tier);

					// Narrators: one per clue, the victim never narrates, and every
					// living suspect gives at least one testimony (coverage).
					expect(generated.narrators).toHaveLength(generated.clues.length);
					expect(generated.narrators).not.toContain(generated.victimId);
					const living = scene.cast
						.map((person) => person.id)
						.filter((id) => id !== generated.victimId);
					for (const id of living) {
						expect(generated.narrators).toContain(id);
					}
				});
			}
		});
	}
});
