import { beforeEach, describe, expect, it } from 'vitest';
import { courtroom } from '../data/scenes';
import { generateCase } from '../engine/generator';
import type { Case } from '../engine/types';
import { useGameStore } from '../store/gameStore';

// Manual case with spatial clues, all true in the diagonal solution. mara and bo
// share the courtroom (victim + murderer); gemma and dee share the hallway. Every
// clue is satisfied when each person sits on their solution cell, so placing the
// solution wins with no mistakes; mara's room clue is violated by an off-room cell.
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
		{ type: 'in_room', person: 'mara', room: 'courtroom' },
		{ type: 'in_room', person: 'bo', room: 'courtroom' },
		{ type: 'in_room', person: 'gemma', room: 'hallway' },
		{ type: 'same_room', a: 'gemma', b: 'dee' },
	],
	narrators: ['bo', 'gemma', 'dee', 'bo'],
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

describe('hints', () => {
	it('requestHint computes and counts a hint without placing anyone', () => {
		useGameStore.getState().requestHint();
		const state = useGameStore.getState();
		expect(state.hintsUsed).toBe(1);
		expect(state.currentHint).not.toBeNull();
		expect(state.placement).toEqual({});
	});

	it('requestHint is a no-op while a hint is already pending', () => {
		const { requestHint } = useGameStore.getState();
		requestHint();
		const first = useGameStore.getState().currentHint;
		requestHint();
		const state = useGameStore.getState();
		expect(state.hintsUsed).toBe(1);
		expect(state.currentHint).toBe(first);
	});

	it('applyHint places the hinted suspect on its cell and clears the hint', () => {
		const { requestHint, applyHint } = useGameStore.getState();
		requestHint();
		const hint = useGameStore.getState().currentHint;
		expect(hint).not.toBeNull();
		applyHint();
		const state = useGameStore.getState();
		expect(state.placement[hint?.personId as string]).toEqual(hint?.cell);
		expect(state.currentHint).toBeNull();
		expect(state.hintsUsed).toBe(1);
	});

	it('clearHint discards the hint without placing anyone', () => {
		const { requestHint, clearHint } = useGameStore.getState();
		requestHint();
		clearHint();
		const state = useGameStore.getState();
		expect(state.currentHint).toBeNull();
		expect(state.placement).toEqual({});
		expect(state.hintsUsed).toBe(1);
	});

	it('resets hint state on initGame', () => {
		useGameStore.getState().requestHint();
		useGameStore.getState().initGame(structuredClone(manualCase));
		const state = useGameStore.getState();
		expect(state.hintsUsed).toBe(0);
		expect(state.currentHint).toBeNull();
	});

	it('records hintsUsed in lastResult when the case is solved', () => {
		const { requestHint, placePerson } = useGameStore.getState();
		requestHint();
		placePerson('mara', { r: 0, c: 0 });
		placePerson('bo', { r: 1, c: 1 });
		placePerson('gemma', { r: 2, c: 2 });
		placePerson('dee', { r: 3, c: 3 });
		expect(useGameStore.getState().lastResult?.hintsUsed).toBe(1);
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
