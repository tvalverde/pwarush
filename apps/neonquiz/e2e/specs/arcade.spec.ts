import type { Page } from '@playwright/test';
import { expect, test } from '../helpers/page-setup';

// Reads the solo player's live arcade stats straight from the store for deterministic assertions.
const readArcade = (page: Page) =>
	page.evaluate(() => {
		const store = (window as unknown as { __useGameStore: { getState: () => unknown } })
			.__useGameStore;
		const state = store.getState() as {
			mode: string;
			players: Array<{ arcadeScore?: number; arcadeCombo?: number }>;
		};
		return {
			mode: state.mode,
			score: state.players[0].arcadeScore ?? 0,
			combo: state.players[0].arcadeCombo ?? 0,
		};
	});

const correctIndex = (page: Page) =>
	page.evaluate(() => {
		const store = (window as unknown as { __useGameStore: { getState: () => unknown } })
			.__useGameStore;
		return (store.getState() as { activeQuestion: { correctAnswerIndex: number } }).activeQuestion
			.correctAnswerIndex;
	});

// Takes the first legal move (always a locked-nexus category tile early on), then answers. The first
// turn needs a manual roll; afterwards a correct/wrong answer auto-rolls the solo player straight
// into the next move, so we just wait for the move buttons to surface.
const playQuestion = async (page: Page, correct: boolean, manualRoll: boolean) => {
	if (manualRoll) {
		await page.getByTestId('roll-dice').click();
	}
	await page.locator('[data-testid^="move-"]').first().click();
	await expect(page.getByTestId('question-overlay')).toBeVisible();

	const target = correct ? await correctIndex(page) : ((await correctIndex(page)) + 1) % 4;
	await page.getByTestId(`answer-${target}`).click();
	if (!correct) {
		// A KID is offered a second chance on a miss; decline it by revealing the answer.
		await page.getByTestId('reveal-answer').click();
	}
	await page.getByTestId('continue-feedback').click();
};

test('arcade golden path: solo player scores, builds combo and resets it on a miss', async ({
	page,
}) => {
	await page.goto('/pwarush/neonquiz/');

	// A single-player roster activates Arcade mode.
	await page.getByTestId('player-name-input').fill('Solo');
	await page.getByTestId('add-player').click();
	await expect(page.getByTestId('player-row-0')).toBeVisible();

	// Arcade skips the pass-the-device transition and lands straight on the dice roll with the HUD up.
	await page.getByTestId('start-game').click();
	await expect(page.getByTestId('arcade-hud')).toBeVisible();
	await expect(page.getByTestId('roll-dice')).toBeVisible();
	await expect(page.getByTestId('turn-transition')).toHaveCount(0);
	expect((await readArcade(page)).mode).toBe('ARCADE');

	// First correct answer: score climbs above zero and the combo reaches ×1.
	await playQuestion(page, true, true);
	const afterFirst = await readArcade(page);
	expect(afterFirst.score).toBeGreaterThan(0);
	expect(afterFirst.combo).toBe(1);

	// Second correct answer in a row (auto-rolled): the combo stacks to ×2.
	await playQuestion(page, true, false);
	const afterSecond = await readArcade(page);
	expect(afterSecond.combo).toBe(2);
	expect(afterSecond.score).toBeGreaterThan(afterFirst.score);

	// A miss resets the combo to ×0 while the accumulated score is preserved.
	await playQuestion(page, false, false);
	const afterMiss = await readArcade(page);
	expect(afterMiss.combo).toBe(0);
	expect(afterMiss.score).toBe(afterSecond.score);
});
