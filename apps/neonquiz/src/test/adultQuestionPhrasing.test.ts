import { describe, expect, it } from 'vitest';
import { RAW_QUESTION_SEED } from '../data/questions';

/**
 * Regression guard (rule 1): ADULT questions are read blind — the player never sees the
 * four options, only the question text and, after revealing, the correct answer
 * (see components/AdultQuestionOverlay.tsx). Any phrasing that points at the option list
 * ("¿Cuál de estos/estas…?", "¿Cuál de los/las siguientes…?", "De estos… ¿cuál…?") is
 * therefore unanswerable for ADULT/BOTH audiences and must never ship.
 */
const LIST_REFERENCING_PATTERNS: readonly RegExp[] = [
	/cuál(?:es)? de (?:est[oa]s|los siguientes|las siguientes)/i,
	/de (?:est[oa]s|los siguientes|las siguientes)[^?]*\bcuál(?:es)?\b/i,
];

describe('adult question phrasing', () => {
	it('never references the hidden option list for ADULT or BOTH audiences', () => {
		const offenders = RAW_QUESTION_SEED.filter(
			(q) =>
				q.targetAudience !== 'KID' &&
				LIST_REFERENCING_PATTERNS.some((pattern) => pattern.test(q.questionText)),
		).map((q) => q.questionText);

		expect(offenders).toEqual([]);
	});
});
