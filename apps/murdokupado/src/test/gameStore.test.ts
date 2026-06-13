import { beforeEach, describe, expect, it } from 'vitest';
import { courtroom } from '../data/scenes';
import { generateCase } from '../engine/generator';
import type { Case } from '../engine/types';
import { useGameStore } from '../store/gameStore';

// Fully pinned manual case: in_row + in_column for everyone, so the solution is
// unique and reached only when each person sits on their solution cell. mara and
// bo share the courtroom (victim + murderer); gemma and dee share the hallway.
const manualCase: Case = {
	sceneId: 'courtroom',
	people: courtroom.cast,
	victimId: 'mara',
	murdererId: 'bo',
	difficulty: 'beginner',
	solution: {
		mara: { r: 0, c: 0 },
		bo: { r: 1, c: 1 },
		gemma: { r: 2, c: 2 },
		dee: { r: 3, c: 3 },
	},
	clues: [
		{ type: 'in_row', person: 'mara', row: 0 },
		{ type: 'in_column', person: 'mara', col: 0 },
		{ type: 'in_row', person: 'bo', row: 1 },
		{ type: 'in_column', person: 'bo', col: 1 },
		{ type: 'in_row', person: 'gemma', row: 2 },
		{ type: 'in_column', person: 'gemma', col: 2 },
		{ type: 'in_row', person: 'dee', row: 3 },
		{ type: 'in_column', person: 'dee', col: 3 },
	],
};

beforeEach(() => {
	useGameStore.getState().initGame(structuredClone(manualCase));
});

describe('initGame', () => {
	it('starts a clean game on the game screen', () => {
		const state = useGameStore.getState();
		expect(state.activeScreen).toBe('game');
		expect(state.hasActiveGame).toBe(true);
		expect(state.activeCase?.sceneId).toBe('courtroom');
		expect(state.placement).toEqual({});
		expect(state.mistakes).toBe(0);
		expect(state.revealedMurderer).toBeNull();
	});
});

describe('placePerson — placement and swap', () => {
	it('places a person on a free cell', () => {
		useGameStore.getState().placePerson('mara', { r: 0, c: 0 });
		expect(useGameStore.getState().placement.mara).toEqual({ r: 0, c: 0 });
		expect(useGameStore.getState().selectedPersonId).toBeNull();
	});

	it('swaps two placed people when targeting an occupied cell', () => {
		const { placePerson } = useGameStore.getState();
		placePerson('mara', { r: 0, c: 0 });
		placePerson('bo', { r: 1, c: 1 });
		placePerson('mara', { r: 1, c: 1 });
		const { placement } = useGameStore.getState();
		expect(placement.mara).toEqual({ r: 1, c: 1 });
		expect(placement.bo).toEqual({ r: 0, c: 0 });
	});

	it('displaces a tray-placed occupant back to the tray', () => {
		const { placePerson } = useGameStore.getState();
		placePerson('mara', { r: 0, c: 0 });
		placePerson('bo', { r: 0, c: 0 });
		const { placement } = useGameStore.getState();
		expect(placement.bo).toEqual({ r: 0, c: 0 });
		expect(placement.mara).toBeUndefined();
	});
});

describe('placePerson — mistakes and victory', () => {
	it('flags a mistake when a placement violates a clue', () => {
		const result = useGameStore.getState().placePerson('mara', { r: 0, c: 2 });
		expect(result.violates).toBe(true);
		expect(useGameStore.getState().mistakes).toBe(1);
	});

	it('solves the case and reveals the murderer', () => {
		const { placePerson } = useGameStore.getState();
		placePerson('mara', { r: 0, c: 0 });
		placePerson('bo', { r: 1, c: 1 });
		placePerson('gemma', { r: 2, c: 2 });
		const result = placePerson('dee', { r: 3, c: 3 });
		const state = useGameStore.getState();
		expect(result.isSolved).toBe(true);
		expect(state.mistakes).toBe(0);
		expect(state.revealedMurderer).toBe('bo');
		expect(state.lastResult).toMatchObject({ murdererId: 'bo', victimId: 'mara' });
		expect(state.hasActiveGame).toBe(false);
	});
});

describe('erase actions', () => {
	it('eraseCell removes whoever sits on the cell', () => {
		useGameStore.getState().placePerson('mara', { r: 0, c: 0 });
		useGameStore.getState().eraseCell({ r: 0, c: 0 });
		expect(useGameStore.getState().placement.mara).toBeUndefined();
	});

	it('erasePerson removes the named person', () => {
		useGameStore.getState().placePerson('bo', { r: 1, c: 1 });
		useGameStore.getState().erasePerson('bo');
		expect(useGameStore.getState().placement.bo).toBeUndefined();
	});
});

describe('toggleClueCheck', () => {
	it('toggles a clue checkmark on and off', () => {
		useGameStore.getState().toggleClueCheck(2);
		expect(useGameStore.getState().checkedClues).toEqual([2]);
		useGameStore.getState().toggleClueCheck(2);
		expect(useGameStore.getState().checkedClues).toEqual([]);
	});
});

describe('store with a generated case', () => {
	it('solves a real generated case by placing its solution', () => {
		const generated = generateCase(courtroom, 'beginner', 11);
		useGameStore.getState().initGame(generated);
		const { placePerson } = useGameStore.getState();
		let solved = false;
		for (const person of generated.people) {
			const cell = generated.solution[person.id];
			if (!cell) throw new Error('generated solution is incomplete');
			solved = placePerson(person.id, cell).isSolved;
		}
		expect(solved).toBe(true);
		expect(useGameStore.getState().revealedMurderer).toBe(generated.murdererId);
	});
});
