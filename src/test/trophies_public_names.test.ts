import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import TrophiesScreen from '../components/TrophiesScreen';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

describe('Regression: Public Trophies Ranking', () => {
	beforeEach(async () => {
		await db.history.clear();
		await db.players.clear();

		// Create two players
		const juanId = await db.players.add({
			name: 'Juan',
			createdAt: Date.now(),
			isDeleted: 0,
		});
		const mariaId = await db.players.add({
			name: 'Maria',
			createdAt: Date.now(),
			isDeleted: 0,
		});

		// Add one trophy for each
		await db.history.add({
			playerId: juanId as number,
			difficulty: 'beginner',
			score: 500,
			timeElapsed: 600,
			mistakes: 0,
			date: Date.now(),
		});
		await db.history.add({
			playerId: mariaId as number,
			difficulty: 'expert',
			score: 1200,
			timeElapsed: 1200,
			mistakes: 1,
			date: Date.now() - 1000,
		});

		// Setup Guest mode
		act(() => {
			useGameStore.setState({ activePlayerId: null });
		});
	});

	it('should show real player names in trophies screen even in Guest mode', async () => {
		render(React.createElement(TrophiesScreen));

		// Wait for Dexie queries
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Verify both names are present instead of "Player"
		const juanEntry = await screen.findByText('Juan');
		const mariaEntry = await screen.findByText('Maria');

		expect(juanEntry).toBeDefined();
		expect(mariaEntry).toBeDefined();

		const playerEntries = screen.queryAllByText('Player');
		expect(playerEntries.length).toBe(0);
	});
});
