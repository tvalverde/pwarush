import { createDatabase } from '@pwarush/core/persistence';
import type { Table } from 'dexie';
import type {
	FailedQuestionEntry,
	GameHistoryEntry,
	GameSession,
	PlayerProfile,
	Question,
} from '../types';

export interface QuestionUsageRow {
	id: number;
	ids: number[];
}

interface NeonquizTables {
	questions: Table<Question, number>;
	gameSession: Table<GameSession, number>;
	failedQuestions: Table<FailedQuestionEntry, number>;
	questionUsage: Table<QuestionUsageRow, number>;
	gameHistory: Table<GameHistoryEntry, number>;
	profiles: Table<PlayerProfile, number>;
}

const V1 = {
	questions: '++id, category, targetAudience',
	gameSession: 'id',
};

// v2 adds the global failed-question log that powers the Flashcards review.
const V2 = {
	...V1,
	failedQuestions: '++id, questionId',
};

// v3 adds the persistent question-usage log (a single row holding the used-id list).
const V3 = {
	...V2,
	questionUsage: 'id',
};

// v4 adds the game-history log (Hall of Fame).
const V4 = {
	...V3,
	gameHistory: '++id, date',
};

// v5 adds persistent, reusable player profiles with lifetime aggregates.
const V5 = {
	...V4,
	profiles: '++id, name, lastPlayedAt',
};

export const SESSION_ID = 1;
export const USAGE_ID = 1;

export const db = createDatabase<NeonquizTables>({
	name: 'NeonquizDB',
	versions: [{ stores: V1 }, { stores: V2 }, { stores: V3 }, { stores: V4 }, { stores: V5 }],
	exposeAs: { key: '__db', enabled: import.meta.env.VITE_E2E === '1' },
});
