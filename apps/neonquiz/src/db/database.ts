import { createDatabase } from '@pwarush/core/persistence';
import type { Table } from 'dexie';
import type { GameSession, Question } from '../types';

interface NeonquizTables {
	questions: Table<Question, number>;
	gameSession: Table<GameSession, number>;
}

const SCHEMA = {
	questions: '++id, category, targetAudience',
	gameSession: 'id',
};

export const SESSION_ID = 1;

export const db = createDatabase<NeonquizTables>({
	name: 'NeonquizDB',
	versions: [{ stores: SCHEMA }],
	exposeAs: { key: '__db', enabled: import.meta.env.VITE_E2E === '1' },
});
