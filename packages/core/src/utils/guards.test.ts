import { describe, expect, it } from 'vitest';
import { createBackupGuard, isArrayOf, isNotesGrid, isNumberGrid, isOneOf } from './guards';

const isNumber = (v: unknown): v is number => typeof v === 'number';
const isString = (v: unknown): v is string => typeof v === 'string';

describe('isOneOf', () => {
	const isColor = isOneOf(['red', 'green', 'blue'] as const);

	it('accepts a member of the set', () => {
		expect(isColor('green')).toBe(true);
	});

	it('rejects a value outside the set', () => {
		expect(isColor('yellow')).toBe(false);
	});

	it('rejects a value of a different type', () => {
		expect(isColor(1)).toBe(false);
	});
});

describe('isArrayOf', () => {
	const isStringArray = isArrayOf(isString);

	it('accepts an array where every item matches', () => {
		expect(isStringArray(['a', 'b'])).toBe(true);
	});

	it('rejects an array with a non-matching item', () => {
		expect(isStringArray(['a', 1])).toBe(false);
	});

	it('rejects a non-array', () => {
		expect(isStringArray('a')).toBe(false);
	});
});

describe('isNumberGrid', () => {
	const isGrid = isNumberGrid(2, 0, 9);

	it('accepts a well-formed grid within range', () => {
		expect(
			isGrid([
				[0, 9],
				[3, 4],
			]),
		).toBe(true);
	});

	it('rejects a grid of the wrong size', () => {
		expect(isGrid([[1, 2]])).toBe(false);
	});

	it('rejects a cell out of range', () => {
		expect(
			isGrid([
				[0, 10],
				[3, 4],
			]),
		).toBe(false);
	});

	it('rejects a non-array', () => {
		expect(isGrid(null)).toBe(false);
	});
});

describe('isNotesGrid', () => {
	const isNotes = isNotesGrid(2, 1, 9);

	it('accepts a well-formed notes grid', () => {
		expect(
			isNotes([
				[[1], [2, 3]],
				[[], [9]],
			]),
		).toBe(true);
	});

	it('rejects a cell that is not an array', () => {
		expect(
			isNotes([
				[1, [2]],
				[[], [9]],
			]),
		).toBe(false);
	});

	it('rejects a note value out of range', () => {
		expect(
			isNotes([
				[[1], [10]],
				[[], [9]],
			]),
		).toBe(false);
	});
});

describe('createBackupGuard', () => {
	const isValidBackup = createBackupGuard({
		appName: 'TESTAPP',
		required: { items: isNumber },
		optional: { extra: isNumber },
	});

	it('accepts a backup with the expected appName and valid required fields', () => {
		expect(isValidBackup({ appName: 'TESTAPP', items: [1, 2] })).toBe(true);
	});

	it('accepts a valid optional field', () => {
		expect(isValidBackup({ appName: 'TESTAPP', items: [1], extra: [5] })).toBe(true);
	});

	it('rejects a wrong appName', () => {
		expect(isValidBackup({ appName: 'OTHER', items: [1] })).toBe(false);
	});

	it('rejects a missing required field', () => {
		expect(isValidBackup({ appName: 'TESTAPP' })).toBe(false);
	});

	it('rejects a required field that is not an array', () => {
		expect(isValidBackup({ appName: 'TESTAPP', items: 1 })).toBe(false);
	});

	it('rejects an invalid optional field when present', () => {
		expect(isValidBackup({ appName: 'TESTAPP', items: [1], extra: ['bad'] })).toBe(false);
	});

	it('rejects non-object values', () => {
		expect(isValidBackup(null)).toBe(false);
		expect(isValidBackup('backup')).toBe(false);
	});
});
