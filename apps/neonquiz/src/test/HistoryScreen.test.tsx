import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import HistoryScreen from '../components/HistoryScreen';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import type { GameHistoryEntry, MatchPlayerStat } from '../types';

const roster = (overrides: Partial<MatchPlayerStat> = {}): MatchPlayerStat => ({
	name: 'Ada',
	shape: 'TRIANGLE',
	color: 'var(--color-cat-cyan)',
	level: 'KID',
	sparks: 6,
	correct: 8,
	wrong: 2,
	winner: true,
	...overrides,
});

const enrichedEntry: Omit<GameHistoryEntry, 'id'> = {
	winnerName: 'Ada',
	winnerShape: 'TRIANGLE',
	winnerColor: 'var(--color-cat-cyan)',
	players: 2,
	turns: 14,
	date: Date.now(),
	durationMs: (1 * 3600 + 2 * 60 + 3) * 1000,
	roster: [
		roster(),
		roster({
			name: 'Bob',
			shape: 'SQUARE',
			color: 'var(--color-cat-gold)',
			winner: false,
			correct: 5,
			wrong: 5,
		}),
	],
	correct: 13,
	wrong: 7,
	wildcardsUsed: 3,
	conclaveFails: 1,
};

const legacyEntry: GameHistoryEntry = {
	id: 99,
	winnerName: 'Legacy Winner',
	winnerShape: 'CIRCLE',
	winnerColor: 'var(--color-cat-crimson)',
	players: 3,
	turns: 20,
	date: Date.now() - 10_000,
};

describe('HistoryScreen', () => {
	beforeEach(async () => {
		await db.gameHistory.clear();
		useGameStore.setState({ language: 'es' });
	});

	it('renders an enriched entry with duration, full roster, and accuracy/wildcards/conclave stats', async () => {
		await db.gameHistory.add(enrichedEntry);

		const { findByTestId, getAllByTestId } = render(<HistoryScreen onClose={() => {}} />);

		const entry = await findByTestId('history-entry');
		expect(entry).toHaveTextContent('Ada');
		expect(await findByTestId('history-duration')).toHaveTextContent('01:02:03');

		const rosterRows = getAllByTestId('history-roster-row');
		expect(rosterRows).toHaveLength(2);
		expect(rosterRows[0]).toHaveTextContent('Ada');
		expect(rosterRows[1]).toHaveTextContent('Bob');

		const stats = getAllByTestId('history-stats')[0];
		expect(stats).toHaveTextContent('65%');
		expect(stats).toHaveTextContent('3');
		expect(stats).toHaveTextContent('1');
	});

	it('renders a legacy entry (no Hito 8 fields) without crashing and without the new sections', async () => {
		await db.gameHistory.add(legacyEntry);

		const { findByTestId, queryByTestId } = render(<HistoryScreen onClose={() => {}} />);

		const entry = await findByTestId('history-entry');
		expect(entry).toHaveTextContent('Legacy Winner');
		expect(queryByTestId('history-duration')).toBeNull();
		expect(queryByTestId('history-roster')).toBeNull();
		expect(queryByTestId('history-stats')).toBeNull();
	});

	it('shows the empty state when there is no history', async () => {
		const { findByText } = render(<HistoryScreen onClose={() => {}} />);

		expect(await findByText('Aún no se ha jugado ninguna partida')).toBeInTheDocument();
	});
});
