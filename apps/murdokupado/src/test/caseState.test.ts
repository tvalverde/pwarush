import { describe, expect, it } from 'vitest';
import type { Case } from '../engine/types';
import { isCaseRenderable } from '../utils/caseState';

const baseCase: Case = {
	sceneId: 'courtroom',
	people: [
		{ id: 'mara', name: 'Mara' },
		{ id: 'bo', name: 'Bo' },
	],
	victimId: 'mara',
	murdererId: 'bo',
	difficulty: 'beginner',
	solution: { mara: { r: 0, c: 0 }, bo: { r: 1, c: 1 } },
	clues: [
		{ type: 'in_room', person: 'mara', room: 'courtroom' },
		{ type: 'offset', a: 'mara', b: 'bo', dRow: -1, dCol: -1 },
	],
	narrators: ['bo', 'bo'],
};

describe('isCaseRenderable', () => {
	it('accepts a case whose clues are all in the current catalogue', () => {
		expect(isCaseRenderable(baseCase)).toBe(true);
	});

	it('rejects a case carrying a retired row/column clue (legacy snapshot)', () => {
		// Simulates a snapshot persisted before row/column clues were removed.
		const legacy = {
			...baseCase,
			clues: [{ type: 'in_row', person: 'mara', row: 0 }],
			narrators: ['bo'],
		} as unknown as Case;
		expect(isCaseRenderable(legacy)).toBe(false);
	});

	it('rejects a case without per-clue narrators (older save)', () => {
		const old = { ...baseCase, narrators: undefined } as unknown as Case;
		expect(isCaseRenderable(old)).toBe(false);
	});
});
