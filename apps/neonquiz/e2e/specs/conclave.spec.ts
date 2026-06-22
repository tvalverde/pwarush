import { expect, test } from '../helpers/page-setup';

const CATEGORIES = [
	'EMERALD_GEO',
	'CRIMSON_HIST',
	'VIOLET_ART',
	'CYAN_SCI',
	'GOLD_ENT',
	'ORANGE_SPORT',
];

test('reaching the Nexus with six Sparks wins through the Conclave', async ({ page }) => {
	await page.goto('/pwarush/neonquiz/');

	// Start a two-player game (the lobby only renders once the bank is seeded/loaded).
	await page.getByTestId('player-name-input').fill('Ada');
	await page.getByTestId('add-player').click();
	await page.getByTestId('player-name-input').fill('Bob');
	await page.getByTestId('add-player').click();
	await page.getByTestId('start-game').click();
	await expect(page.getByTestId('turn-transition')).toBeVisible();

	// Arrange: give player 0 all six Sparks, standing one tile from the Nexus.
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

	// Roll, then enter the unlocked Nexus to trigger the Conclave.
	await page.getByTestId('confirm-transition').click();
	await page.getByTestId('roll-dice').click();
	await page.getByTestId('move-0').click();
	await expect(page.getByTestId('conclave-vote')).toBeVisible();

	// Rivals pick the category, hand back, and the challenger answers correctly.
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
});
