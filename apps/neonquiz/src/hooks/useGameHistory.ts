import { useEffect } from 'react';
import { logGameResult } from '../db/gameHistory';
import { applyGameResultToProfiles } from '../db/profiles';
import { useGameStore } from '../store/gameStore';
import { buildMatchSummary } from '../utils/gameResult';

/**
 * Records a finished game in the Hall of Fame and folds it into every participating profile's
 * lifetime aggregates the moment a winner is crowned.
 */
export const useGameHistory = (): void => {
	useEffect(() => {
		return useGameStore.subscribe((state, prev) => {
			if (state.phase !== 'VICTORY' || prev.phase === 'VICTORY') return;
			const summary = buildMatchSummary(state);
			if (!summary) return;
			void logGameResult(summary.entry);
			void applyGameResultToProfiles(summary.result);
		});
	}, []);
};
