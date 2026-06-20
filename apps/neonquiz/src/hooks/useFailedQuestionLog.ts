import { useEffect } from 'react';
import { logFailedQuestion } from '../db/failedQuestions';
import { useGameStore } from '../store/gameStore';

/**
 * Logs a failed KID question to the global review log the moment it is answered wrong.
 * Subscribes to the store (rather than touching Dexie inside it) so the store stays
 * persistence-free. Conclave questions are excluded; the log is idempotent per question.
 */
export const useFailedQuestionLog = (): void => {
	useEffect(() => {
		return useGameStore.subscribe((state, prev) => {
			const entered = state.phase === 'FEEDBACK' && prev.phase !== 'FEEDBACK';
			if (!entered || state.isConclave) return;
			const outcome = state.lastOutcome;
			if (!outcome || outcome.correct) return;
			const id = state.activeQuestion?.id;
			if (id !== undefined) void logFailedQuestion(id);
		});
	}, []);
};
