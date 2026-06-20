import type { PlayerLevel, Question, TargetAudience, TriviaCategory } from '../types';

const isEligible = (audience: TargetAudience, level: PlayerLevel): boolean =>
	audience === 'BOTH' || audience === level;

export interface DrawResult {
	question: Question | null;
	used: Set<number>;
}

/**
 * Picks a random unused question of `category` eligible for `level`, tracking used questions
 * globally by id. When every eligible question of the category is used, that category's marks
 * are cleared (auto-reset) so play never runs dry. Pure: returns the chosen question and the
 * next `used` set (the input is not mutated).
 */
export const drawQuestion = (
	bank: readonly Question[],
	category: TriviaCategory,
	level: PlayerLevel,
	used: ReadonlySet<number>,
	rng: () => number = Math.random,
): DrawResult => {
	const eligible = bank.filter(
		(q) => q.category === category && isEligible(q.targetAudience, level) && q.id !== undefined,
	);
	if (eligible.length === 0) return { question: null, used: new Set(used) };

	let next = new Set(used);
	let available = eligible.filter((q) => !next.has(q.id as number));
	if (available.length === 0) {
		// Auto-reset: clear used marks for the whole category, then everything is available again.
		const categoryIds = new Set(
			bank.filter((q) => q.category === category).map((q) => q.id as number),
		);
		next = new Set([...next].filter((id) => !categoryIds.has(id)));
		available = eligible;
	}

	const pick = available[Math.floor(rng() * available.length)];
	next.add(pick.id as number);
	return { question: pick, used: next };
};
