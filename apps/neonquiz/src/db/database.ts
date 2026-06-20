import { createDatabase } from '@pwarush/core/persistence';
import type { Table } from 'dexie';
import type { FailedQuestionEntry, GameSession, Question } from '../types';

export interface QuestionUsageRow {
	id: number;
	ids: number[];
}

interface NeonquizTables {
	questions: Table<Question, number>;
	gameSession: Table<GameSession, number>;
	failedQuestions: Table<FailedQuestionEntry, number>;
	questionUsage: Table<QuestionUsageRow, number>;
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

export const SESSION_ID = 1;
export const USAGE_ID = 1;

export const db = createDatabase<NeonquizTables>({
	name: 'NeonquizDB',
	versions: [{ stores: V1 }, { stores: V2 }, { stores: V3 }],
	exposeAs: { key: '__db', enabled: import.meta.env.VITE_E2E === '1' },
});
