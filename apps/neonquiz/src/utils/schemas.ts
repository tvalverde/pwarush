import { isOneOf } from '@pwarush/core/utils';
import { CATEGORIES, type Question, type TargetAudience, type TriviaCategory } from '../types';

const isCategory = isOneOf<TriviaCategory>(CATEGORIES);
const isAudience = isOneOf<TargetAudience>(['KID', 'ADULT', 'BOTH']);

export const isValidQuestion = (v: unknown): v is Question => {
	if (typeof v !== 'object' || v === null) return false;
	const q = v as Record<string, unknown>;
	return (
		isCategory(q.category) &&
		isAudience(q.targetAudience) &&
		typeof q.questionText === 'string' &&
		q.questionText.length > 0 &&
		typeof q.option0 === 'string' &&
		typeof q.option1 === 'string' &&
		typeof q.option2 === 'string' &&
		typeof q.option3 === 'string' &&
		typeof q.correctAnswerIndex === 'number' &&
		Number.isInteger(q.correctAnswerIndex) &&
		q.correctAnswerIndex >= 0 &&
		q.correctAnswerIndex <= 3
	);
};

export const filterValidQuestions = (raw: readonly unknown[]): Question[] =>
	raw.filter(isValidQuestion);
