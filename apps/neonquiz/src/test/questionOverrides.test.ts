import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import {
	applyAudienceOverrides,
	getAudienceOverrides,
	setAudienceOverride,
} from '../db/questionOverrides';
import { drawQuestion } from '../engine/questionPool';
import type { Question } from '../types';
import { questionKey } from '../utils/questionKey';

const kidQuestion: Question = {
	id: 1,
	category: 'CYAN_SCI',
	targetAudience: 'KID',
	questionText: 'A tricky one for kids',
	option0: 'right',
	option1: 'wrong',
	option2: 'wrong',
	option3: 'wrong',
	correctAnswerIndex: 0,
};

describe('question audience overrides', () => {
	beforeEach(async () => {
		await db.questionAudienceOverrides.clear();
	});

	it('persists and loads an override keyed by content', async () => {
		await setAudienceOverride(questionKey(kidQuestion), 'ADULT');
		const overrides = await getAudienceOverrides();
		expect(overrides.get(questionKey(kidQuestion))).toBe('ADULT');
	});

	it('applies overrides to the in-memory bank without mutating the input', () => {
		const bank = [kidQuestion];
		const overrides = new Map([[questionKey(kidQuestion), 'ADULT' as const]]);
		const merged = applyAudienceOverrides(bank, overrides);
		expect(merged[0].targetAudience).toBe('ADULT');
		expect(bank[0].targetAudience).toBe('KID'); // original untouched
	});

	it('reroutes the question to the overridden level in drawQuestion', () => {
		const merged = applyAudienceOverrides(
			[kidQuestion],
			new Map([[questionKey(kidQuestion), 'ADULT' as const]]),
		);
		// No longer drawn for a KID...
		expect(drawQuestion(merged, 'CYAN_SCI', 'KID', new Set()).question).toBeNull();
		// ...but now drawn for an ADULT.
		expect(drawQuestion(merged, 'CYAN_SCI', 'ADULT', new Set()).question?.id).toBe(1);
	});

	it('survives a re-seed because it is keyed by content, not by id', async () => {
		await setAudienceOverride(questionKey(kidQuestion), 'ADULT');
		// Simulate a re-seed: the same question comes back with a different auto-id.
		const reseeded: Question = { ...kidQuestion, id: 42 };
		const overrides = await getAudienceOverrides();
		const merged = applyAudienceOverrides([reseeded], overrides);
		expect(merged[0].targetAudience).toBe('ADULT');
	});
});
