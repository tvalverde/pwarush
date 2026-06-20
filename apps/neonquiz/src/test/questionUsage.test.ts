import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { clearUsedIds, loadUsedIds, persistUsedIds } from '../db/questionUsage';

describe('question usage persistence', () => {
	beforeEach(async () => {
		await db.questionUsage.clear();
	});

	it('persists and reloads the used-id list', async () => {
		expect(await loadUsedIds()).toEqual([]);
		await persistUsedIds([3, 7, 12]);
		expect(await loadUsedIds()).toEqual([3, 7, 12]);
	});

	it('overwrites the list on each persist', async () => {
		await persistUsedIds([1, 2]);
		await persistUsedIds([9]);
		expect(await loadUsedIds()).toEqual([9]);
	});

	it('clears the usage log', async () => {
		await persistUsedIds([1, 2, 3]);
		await clearUsedIds();
		expect(await loadUsedIds()).toEqual([]);
	});
});
