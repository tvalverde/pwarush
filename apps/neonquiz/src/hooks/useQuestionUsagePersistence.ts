import { useEffect } from 'react';
import { persistUsedIds } from '../db/questionUsage';
import { useGameStore } from '../store/gameStore';

/**
 * Persists the question-usage set whenever it changes, keeping Dexie out of the store (the
 * same subscriber pattern as autosave). The bootstrap loads it back on the next launch.
 */
export const useQuestionUsagePersistence = (): void => {
	useEffect(() => {
		return useGameStore.subscribe((state, prev) => {
			if (state.usedQuestionIds !== prev.usedQuestionIds) {
				void persistUsedIds(state.usedQuestionIds);
			}
		});
	}, []);
};
