import { useEffect } from 'react';
import { logGameResult } from '../db/gameHistory';
import { useGameStore } from '../store/gameStore';
import { playerAccent } from '../utils/players';

/** Records a finished game in the Hall of Fame the moment a winner is crowned. */
export const useGameHistory = (): void => {
	useEffect(() => {
		return useGameStore.subscribe((state, prev) => {
			if (state.phase !== 'VICTORY' || prev.phase === 'VICTORY') return;
			if (state.winnerIndex === null) return;
			const winner = state.players[state.winnerIndex];
			if (!winner) return;
			void logGameResult({
				winnerName: winner.name,
				winnerShape: winner.shape,
				winnerColor: playerAccent(state.winnerIndex),
				players: state.players.length,
				turns: state.turnCount,
				date: Date.now(),
			});
		});
	}, []);
};
