import { createDatabase } from '@pwarush/core/persistence';
import type { Table } from 'dexie';
import type { GameSnapshot, HistoryEntry, Player, Preferences } from '../types';

interface MurdokupadoTables {
	players: Table<Player>;
	preferences: Table<Preferences>;
	history: Table<HistoryEntry>;
	gameState: Table<GameSnapshot>;
}

const SCHEMA = {
	players: '++id, name, createdAt, isDeleted',
	preferences: '++id, playerId, difficulty',
	history: '++id, playerId, difficulty, date',
	gameState: '++id, playerId',
};

export const db = createDatabase<MurdokupadoTables>({
	name: 'MurdokupadoDB',
	versions: [{ stores: SCHEMA }],
	exposeAs: { key: '__db', enabled: import.meta.env.VITE_E2E === '1' },
});
