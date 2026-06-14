import { describe, expect, it } from 'vitest';
import { courtroom, shop } from '../data/scenes';
import { evaluateClue, occupantsOfRoom, roomOf } from '../engine/evaluate';
import {
	classifyDifficulty,
	enumerateTrueClues,
	generateCase,
	sceneForDifficulty,
} from '../engine/generator';
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

	it('maps the higher tiers to the 5x5 shop', () => {
		expect(sceneForDifficulty('intermediate')).toBe(shop);
		expect(sceneForDifficulty('expert')).toBe(shop);
		expect(sceneForDifficulty('master')).toBe(shop);
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
});

describe('generateCase — determinism', () => {
	it('reproduces the same case for a given seed', () => {
		const first = generateCase(courtroom, 'beginner', 7);
		const second = generateCase(courtroom, 'beginner', 7);
		expect(first).toEqual(second);
	});

	it('different seeds explore different cases', () => {
		const a = generateCase(shop, 'intermediate', 1);
		const b = generateCase(shop, 'intermediate', 2);
		expect(a).not.toEqual(b);
	});
});

describe('generateCase — property run across tiers', () => {
	const SEEDS = Array.from({ length: 25 }, (_, i) => i + 1);

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

					// Stored difficulty is the genuine classification of the clue set.
					expect(generated.difficulty).toBe(classifyDifficulty(scene, generated.clues));
					expect(TIERS).toContain(generated.difficulty);

					// Locally minimal: removing any single clue breaks uniqueness.
					for (const clue of generated.clues) {
						const without = generated.clues.filter((c) => c !== clue);
						expect(countSolutions(scene, without, 2)).not.toBe(1);
					}
				});
			}
		});
	}
});

describe('classifyDifficulty', () => {
	it('keeps beginner reachable from the spatial/relative catalogue and recognises it', () => {
		// Removing absolute row/column clues must not make the easiest tier
		// unreachable: some seed still classifies as beginner, and the classifier
		// agrees on its clue set.
		const beginner = Array.from({ length: 60 }, (_, i) => i + 1)
			.map((seed) => generateCase(courtroom, 'beginner', seed))
			.find((generated) => generated.difficulty === 'beginner');
		expect(beginner).toBeDefined();
		if (beginner) {
			expect(classifyDifficulty(courtroom, beginner.clues)).toBe('beginner');
		}
	});
});
