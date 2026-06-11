import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { exportDatabaseToJson, importDatabaseFromJson } from '../utils/exportImport';

const validBackup = () => ({
	appName: 'SUDOKUPADO',
	version: 1,
	exportDate: Date.now(),
	players: [{ id: 1, name: 'Alice', createdAt: 1700000000000, isDeleted: 0 }],
	preferences: [
		{ id: 1, playerId: 1, difficulty: 'expert', allowNotes: false, maxMistakes: 5, maxHints: 5 },
	],
	history: [
		{
			id: 1,
			playerId: 1,
			difficulty: 'expert',
			score: 850,
			timeElapsed: 300,
			mistakes: 1,
			hintsUsed: 0,
			date: 1700000001000,
		},
	],
	gameState: [],
});

const backupAsFile = (payload: unknown): File =>
	({ text: async () => JSON.stringify(payload) }) as unknown as File;

// jsdom blobs do not implement Blob.text(), so read through FileReader instead.
const readBlobAsText = (blob: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsText(blob);
	});

describe('exportDatabaseToJson', () => {
	let capturedBlob: Blob | null;

	beforeEach(async () => {
		capturedBlob = null;
		vi.stubGlobal('URL', {
			createObjectURL: (blob: Blob) => {
				capturedBlob = blob;
				return 'blob:mock';
			},
			revokeObjectURL: vi.fn(),
		});
		if (!db.isOpen()) await db.open();
		await Promise.all([
			db.players.clear(),
			db.preferences.clear(),
			db.history.clear(),
			db.gameState.clear(),
		]);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('serializes all tables into a downloadable JSON backup and returns true', async () => {
		await db.players.add({ id: 7, name: 'Bob', createdAt: 1700000000000, isDeleted: 0 });
		await db.history.add({
			playerId: 7,
			difficulty: 'beginner',
			score: 120,
			timeElapsed: 90,
			mistakes: 0,
			hintsUsed: 1,
			date: 1700000002000,
		});

		const result = await exportDatabaseToJson();

		expect(result).toBe(true);
		expect(capturedBlob).not.toBeNull();
		const parsed = JSON.parse(await readBlobAsText(capturedBlob as Blob));
		expect(parsed.appName).toBe('SUDOKUPADO');
		expect(parsed.version).toBe(1);
		expect(parsed.players).toHaveLength(1);
		expect(parsed.players[0].name).toBe('Bob');
		expect(parsed.history).toHaveLength(1);
		expect(parsed.history[0].score).toBe(120);
	});

	it('returns false when reading the database fails', async () => {
		vi.spyOn(db.players, 'toArray').mockRejectedValueOnce(new Error('boom'));

		const result = await exportDatabaseToJson();

		expect(result).toBe(false);
	});
});

describe('importDatabaseFromJson', () => {
	beforeEach(async () => {
		if (!db.isOpen()) await db.open();
		await Promise.all([
			db.players.clear(),
			db.preferences.clear(),
			db.history.clear(),
			db.gameState.clear(),
		]);
	});

	it('replaces existing data with the backup contents', async () => {
		await db.players.add({ id: 99, name: 'Stale', createdAt: 1, isDeleted: 0 });

		const result = await importDatabaseFromJson(backupAsFile(validBackup()));

		expect(result).toBe(true);
		const players = await db.players.toArray();
		expect(players).toHaveLength(1);
		expect(players[0].name).toBe('Alice');
		const prefs = await db.preferences.toArray();
		expect(prefs[0].difficulty).toBe('expert');
		const history = await db.history.toArray();
		expect(history[0].score).toBe(850);
	});

	it('defaults maxHints to 3 for legacy backups created before the field existed', async () => {
		const legacy = validBackup();
		legacy.preferences = [
			{
				id: 1,
				playerId: 1,
				difficulty: 'beginner',
				allowNotes: true,
				maxMistakes: 3,
			} as (typeof legacy.preferences)[number],
		];

		await importDatabaseFromJson(backupAsFile(legacy));

		const prefs = await db.preferences.toArray();
		expect(prefs[0].maxHints).toBe(3);
	});

	it('rejects a backup from another app and keeps existing data untouched', async () => {
		await db.players.add({ id: 1, name: 'Keeper', createdAt: 1, isDeleted: 0 });
		const foreign = { ...validBackup(), appName: 'OTHERAPP' };

		await expect(importDatabaseFromJson(backupAsFile(foreign))).rejects.toThrow();

		const players = await db.players.toArray();
		expect(players[0].name).toBe('Keeper');
	});

	it('rejects structurally invalid payloads', async () => {
		await expect(importDatabaseFromJson(backupAsFile({ players: 'nope' }))).rejects.toThrow();
		await expect(importDatabaseFromJson(backupAsFile(null))).rejects.toThrow();
	});

	it('propagates JSON parse errors for corrupted files', async () => {
		const corrupted = { text: async () => '{not json' } as unknown as File;
		await expect(importDatabaseFromJson(corrupted)).rejects.toThrow();
	});
});
