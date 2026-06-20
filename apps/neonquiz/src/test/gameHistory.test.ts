import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db/database';
import { clearGameHistory, getGameHistory, logGameResult } from '../db/gameHistory';

const entry = (winnerName: string, date: number) => ({
	winnerName,
	winnerShape: 'TRIANGLE' as const,
	winnerColor: 'var(--color-cat-cyan)',
	players: 3,
	turns: 12,
	date,
});

describe('game history (Hall of Fame)', () => {
	beforeEach(async () => {
		await db.gameHistory.clear();
	});

	it('logs results and returns them most recent first', async () => {
		await logGameResult(entry('Ada', 1000));
		await logGameResult(entry('Bob', 2000));
		const history = await getGameHistory();
		expect(history.map((h) => h.winnerName)).toEqual(['Bob', 'Ada']);
	});

	it('clears the history', async () => {
		await logGameResult(entry('Ada', 1000));
		await clearGameHistory();
		expect(await getGameHistory()).toHaveLength(0);
	});
});
