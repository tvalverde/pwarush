import 'fake-indexeddb/auto';
import type { Table } from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase } from './createDatabase';

interface Item {
	id?: number;
	value: string;
	migrated?: boolean;
}

type ItemTables = { items: Table<Item> };

describe('createDatabase', () => {
	afterEach(() => {
		delete (window as unknown as Record<string, unknown>).__test_db;
	});

	it('creates a database with the given name and declared tables', async () => {
		const db = createDatabase<ItemTables>({
			name: 'CreateDbNameTest',
			versions: [{ stores: { items: '++id, value' } }],
		});

		await db.open();
		expect(db.name).toBe('CreateDbNameTest');
		expect(db.tables.map((table) => table.name)).toContain('items');

		const id = await db.items.add({ value: 'hello' });
		expect(await db.items.get(id)).toMatchObject({ value: 'hello' });
		db.close();
	});

	it('runs the upgrade callback when opening a higher version', async () => {
		const name = 'CreateDbUpgradeTest';

		const v1 = createDatabase<ItemTables>({
			name,
			versions: [{ stores: { items: '++id, value' } }],
		});
		await v1.open();
		const id = await v1.items.add({ value: 'legacy' });
		v1.close();

		const v2 = createDatabase<ItemTables>({
			name,
			versions: [
				{ stores: { items: '++id, value' } },
				{
					stores: { items: '++id, value' },
					upgrade: (tx) =>
						tx
							.table<Item>('items')
							.toCollection()
							.modify((item) => {
								if (item.migrated === undefined) item.migrated = true;
							}),
				},
			],
		});
		await v2.open();
		expect(await v2.items.get(id)).toMatchObject({ value: 'legacy', migrated: true });
		v2.close();
	});

	it('exposes the instance on window under the given key when enabled', () => {
		const db = createDatabase<ItemTables>({
			name: 'CreateDbExposeTest',
			versions: [{ stores: { items: '++id' } }],
			exposeAs: { key: '__test_db', enabled: true },
		});

		expect((window as unknown as Record<string, unknown>).__test_db).toBe(db);
	});

	it('does not expose the instance when disabled', () => {
		createDatabase<ItemTables>({
			name: 'CreateDbNoExposeTest',
			versions: [{ stores: { items: '++id' } }],
			exposeAs: { key: '__test_db', enabled: false },
		});

		expect((window as unknown as Record<string, unknown>).__test_db).toBeUndefined();
	});
});
