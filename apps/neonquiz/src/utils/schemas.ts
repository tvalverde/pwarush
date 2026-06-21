import { isOneOf } from '@pwarush/core/utils';
import {
	CATEGORIES,
	PLAYER_SHAPES,
	type PlayerLevel,
	type PlayerProfile,
	type PlayerShape,
	type Question,
	type TargetAudience,
	type TriviaCategory,
} from '../types';

const isCategory = isOneOf<TriviaCategory>(CATEGORIES);
const isAudience = isOneOf<TargetAudience>(['KID', 'ADULT', 'BOTH']);
const isPlayerShape = isOneOf<PlayerShape>(PLAYER_SHAPES);
const isPlayerLevel = isOneOf<PlayerLevel>(['KID', 'ADULT']);

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

export const isValidPlayerProfile = (v: unknown): v is PlayerProfile => {
	if (typeof v !== 'object' || v === null) return false;
	const p = v as Record<string, unknown>;
	return (
		typeof p.name === 'string' &&
		p.name.length > 0 &&
		isPlayerShape(p.shape) &&
		typeof p.accentColor === 'string' &&
		p.accentColor.length > 0 &&
		isPlayerLevel(p.preferredLevel) &&
		typeof p.gamesPlayed === 'number' &&
		typeof p.gamesWon === 'number' &&
		typeof p.totalCorrect === 'number' &&
		typeof p.totalWrong === 'number' &&
		typeof p.totalPlayMs === 'number' &&
		typeof p.currentStreak === 'number' &&
		typeof p.bestStreak === 'number' &&
		typeof p.createdAt === 'number' &&
		typeof p.lastPlayedAt === 'number'
	);
};
