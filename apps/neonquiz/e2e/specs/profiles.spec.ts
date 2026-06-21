import { expect, test } from '@playwright/test';

const CATEGORIES = [
	'EMERALD_GEO',
	'CRIMSON_HIST',
	'VIOLET_ART',
	'CYAN_SCI',
	'GOLD_ENT',
	'ORANGE_SPORT',
];

test('a played match leaves a saved profile and an enriched Hall of Fame entry', async ({
	page,
}) => {
	await page.goto('/pwarush/neonquiz/');

	// Build a two-player roster.
	await page.getByTestId('player-name-input').fill('Ada');
	await page.getByTestId('add-player').click();
	await page.getByTestId('player-name-input').fill('Bob');
	await page.getByTestId('add-player').click();
	await page.getByTestId('start-game').click();
	await expect(page.getByTestId('turn-transition')).toBeVisible();

	// Arrange: give player 0 all six Sparks, standing one tile from the Nexus, so the match
	// can be won in a couple of steps instead of playing out the full board.
	await page.evaluate((cats) => {
		const store = (window as unknown as { __useGameStore: any }).__useGameStore;
		const board = store.getState().board;
		const spokeInner = board.nodes.find(
			(n: any) => n.type === 'NORMAL' && n.connectedNodeIds.includes(0),
		);
		const players = store
			.getState()
			.players.map((p: any, i: number) =>
				i === 0 ? { ...p, sparks: cats, position: spokeInner.id } : p,
			);
		store.setState({ players, currentPlayerIndex: 0, phase: 'TURN_TRANSITION' });
	}, CATEGORIES);

	await page.getByTestId('confirm-transition').click();
	await page.getByTestId('roll-dice').click();
	await page.getByTestId('move-0').click();
	await expect(page.getByTestId('conclave-vote')).toBeVisible();

	await page.getByTestId('vote-CYAN_SCI').click();
	await expect(page.getByTestId('conclave-handoff')).toBeVisible();
	await page.getByTestId('confirm-handoff').click();
	await expect(page.getByTestId('question-overlay')).toBeVisible();

	const correctIndex = await page.evaluate(() => {
		const store = (window as unknown as { __useGameStore: any }).__useGameStore;
		return store.getState().activeQuestion.correctAnswerIndex as number;
	});
	await page.getByTestId(`answer-${correctIndex}`).click();
	await page.getByTestId('continue-feedback').click();
	await expect(page.getByTestId('victory-screen')).toBeVisible();

	// Back to the lobby: Ada and Bob must now be remembered as saved profiles.
	await page.getByTestId('play-again').click();
	await expect(page.getByTestId('saved-profiles')).toBeVisible();
	await expect(page.getByTestId('saved-profiles')).toContainText('Ada');
	await expect(page.getByTestId('saved-profiles')).toContainText('Bob');

	// The Hall of Fame entry for that match shows a duration.
	await page.getByTestId('open-history').click();
	await expect(page.getByTestId('history-entry').first()).toBeVisible();
	await expect(page.getByTestId('history-duration').first()).toBeVisible();
	await expect(page.getByTestId('history-duration').first()).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
});
