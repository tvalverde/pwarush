import { createDatabase } from '@pwarush/core/persistence';
import type { Table } from 'dexie';
import type { FailedQuestionEntry, GameSession, Question } from '../types';

interface NeonquizTables {
	questions: Table<Question, number>;
	gameSession: Table<GameSession, number>;
	failedQuestions: Table<FailedQuestionEntry, number>;
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

export const SESSION_ID = 1;

export const db = createDatabase<NeonquizTables>({
	name: 'NeonquizDB',
	versions: [{ stores: V1 }, { stores: V2 }],
	exposeAs: { key: '__db', enabled: import.meta.env.VITE_E2E === '1' },
});
