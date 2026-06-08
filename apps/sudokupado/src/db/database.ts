import { createDatabase } from '@pwarush/core/persistence';
import type { Table } from 'dexie';
import type { GameState, HistoryEntry, Player, Preferences } from '../types';

interface SudokupadoTables {
	players: Table<Player>;
	preferences: Table<Preferences>;
	history: Table<HistoryEntry>;
	gameState: Table<GameState>;
}

const SCHEMA = {
	players: '++id, name, createdAt, isDeleted',
	preferences: '++id, playerId, difficulty',
	history: '++id, playerId, difficulty, score, date',
	gameState: '++id, playerId',
};

// Singleton instance for the whole app
export const db = createDatabase<SudokupadoTables>({
	name: 'SudokupadoDB',
	versions: [
		{ stores: SCHEMA },
		{
			stores: SCHEMA,
			upgrade: (tx) =>
				tx
					.table<Preferences>('preferences')
					.toCollection()
					.modify((p) => {
						if (typeof p.maxHints !== 'number') p.maxHints = 3;
					}),
		},
	],
	exposeAs: { key: '__db', enabled: import.meta.env.VITE_E2E === '1' },
});
