import { describe, expect, it } from 'vitest';
import { courtroom } from '../data/scenes';
import { generateCase } from '../engine/generator';
import { sameCell } from '../engine/grid';
import { nextHint } from '../engine/hint';
import type { Placement } from '../engine/types';

describe('nextHint', () => {
	const generated = generateCase(courtroom, 'beginner', 1);

	it('returns null when the board already matches the solution', () => {
		expect(nextHint(courtroom, generated.clues, generated.solution, generated.solution)).toBeNull();
	});

	it('from an empty board points a suspect to their solution cell', () => {
		const hint = nextHint(courtroom, generated.clues, generated.solution, {});
		expect(hint).not.toBeNull();
		if (hint) {
			const cell = generated.solution[hint.personId];
			expect(cell && sameCell(hint.cell, cell)).toBe(true);
		}
	});

	it('ignores a wrong placement and still hints a correct cell', () => {
		const wrong: Placement = { [courtroom.cast[0].id]: { r: 99, c: 99 } };
		const hint = nextHint(courtroom, generated.clues, generated.solution, wrong);
		expect(hint).not.toBeNull();
		if (hint) {
			const cell = generated.solution[hint.personId];
			expect(cell && sameCell(hint.cell, cell)).toBe(true);
		}
	});
});
