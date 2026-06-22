import type { Question } from '../types';

/**
 * A stable, content-derived key for a question, independent of Dexie's auto-increment id
 * (which is reassigned whenever the bank is re-seeded). Combines the category with the
 * normalised question text so audience overrides survive re-seeds and never collide across
 * categories. Pure and deterministic.
 */
export const questionKey = (q: Pick<Question, 'category' | 'questionText'>): string => {
	const normalised = q.questionText.trim().toLowerCase().replace(/\s+/g, ' ');
	return `${q.category}::${normalised}`;
};
