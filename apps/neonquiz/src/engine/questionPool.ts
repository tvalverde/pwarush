import type { Question, TargetAudience, TriviaCategory } from '../types';

const isEligibleForKid = (audience: TargetAudience): boolean =>
	audience === 'KID' || audience === 'BOTH';

export interface QuestionPool {
	draw: (category: TriviaCategory, rng?: () => number) => Question | null;
	remaining: (category: TriviaCategory) => number;
}

/**
 * In-memory pool of KID-eligible questions (audience KID or BOTH). Draws a random
 * unused question per category and silently resets that category's used set once it
 * is exhausted, granting infinite replayability within a session.
 */
export const createQuestionPool = (questions: readonly Question[]): QuestionPool => {
	const byCategory = new Map<TriviaCategory, Question[]>();
	for (const question of questions) {
		if (!isEligibleForKid(question.targetAudience)) continue;
		const bucket = byCategory.get(question.category) ?? [];
		bucket.push(question);
		byCategory.set(question.category, bucket);
	}

	const usedIndices = new Map<TriviaCategory, Set<number>>();

	const draw = (category: TriviaCategory, rng: () => number = Math.random): Question | null => {
		const bucket = byCategory.get(category);
		if (!bucket || bucket.length === 0) return null;

		let used = usedIndices.get(category);
		if (!used) {
			used = new Set();
			usedIndices.set(category, used);
		}
		if (used.size >= bucket.length) used.clear();

		const available = bucket.map((_, index) => index).filter((index) => !used.has(index));
		const pick = available[Math.floor(rng() * available.length)];
		used.add(pick);
		return bucket[pick];
	};

	const remaining = (category: TriviaCategory): number => {
		const total = byCategory.get(category)?.length ?? 0;
		const used = usedIndices.get(category)?.size ?? 0;
		return total - used;
	};

	return { draw, remaining };
};
