import type { GameHistoryEntry, GameMode, GameResult, MatchPlayerStat, Player } from '../types';
import { playerColor } from './players';
import { activeElapsedMs } from './time';

// Narrow slice of the game store needed to summarize a finished match — avoids importing the
// whole store type and keeps this module pure and independently testable.
export interface MatchSummaryInput {
	players: Player[];
	winnerIndex: number | null;
	turnCount: number;
	startedAt: number | null;
	conclaveFails: number;
	pausedAccumMs: number;
	mode: GameMode;
}

export interface MatchSummary {
	entry: Omit<GameHistoryEntry, 'id'>;
	result: GameResult;
}

const countUsedWildcards = (players: Player[]): number =>
	players.reduce(
		(total, player) => total + Object.values(player.usedWildcards).filter(Boolean).length,
		0,
	);

/** Distills the just-finished match state into the Hall of Fame entry and the profile-aggregation result. */
export const buildMatchSummary = (state: MatchSummaryInput): MatchSummary | null => {
	const { players, winnerIndex, turnCount, startedAt, conclaveFails, pausedAccumMs } = state;
	if (winnerIndex == null) return null;
	const winner = players[winnerIndex];
	if (!winner) return null;

	// Paused time never counts towards the recorded match duration.
	const durationMs = activeElapsedMs(startedAt, pausedAccumMs, null, Date.now());

	const roster: MatchPlayerStat[] = players.map((player, index) => ({
		profileId: player.profileId,
		name: player.name,
		shape: player.shape,
		color: playerColor(player, index),
		level: player.level,
		sparks: player.sparks.length,
		correct: player.correct ?? 0,
		wrong: player.wrong ?? 0,
		winner: index === winnerIndex,
		...(state.mode === 'ARCADE'
			? {
					arcadeScore: player.arcadeScore ?? 0,
					arcadeMaxCombo: player.arcadeMaxCombo ?? 0,
				}
			: {}),
	}));

	const correct = roster.reduce((total, stat) => total + stat.correct, 0);
	const wrong = roster.reduce((total, stat) => total + stat.wrong, 0);
	const wildcardsUsed = countUsedWildcards(players);

	const entry: Omit<GameHistoryEntry, 'id'> = {
		winnerName: winner.name,
		winnerShape: winner.shape,
		winnerColor: playerColor(winner, winnerIndex),
		players: players.length,
		turns: turnCount,
		date: Date.now(),
		durationMs,
		roster,
		correct,
		wrong,
		wildcardsUsed,
		conclaveFails,
		mode: state.mode,
	};

	const result: GameResult = {
		durationMs,
		turns: turnCount,
		players: roster,
	};

	return { entry, result };
};
