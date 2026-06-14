import { expect, test } from '@playwright/test';
import { open, placeSolution, readActiveCase, startCase } from '../helpers/game';

const DIFFICULTIES = ['beginner', 'intermediate', 'expert', 'master'];

test.describe('Golden path: main menu', () => {
	test('renders the title, play button and every difficulty', async ({ page }) => {
		await open(page);
		await expect(page.getByRole('heading', { name: /murdokupado/i })).toBeVisible();
		await expect(page.getByTestId('start-game-button')).toBeVisible();
		for (const difficulty of DIFFICULTIES) {
			await expect(page.getByTestId(`difficulty-${difficulty}`)).toBeVisible();
		}
	});

	test('selecting a difficulty marks it active', async ({ page }) => {
		await open(page);
		const expertButton = page.getByTestId('difficulty-expert');
		await expertButton.click();
		await expect(expertButton).toHaveClass(/bg-primary(?!-)/);
	});
});

test.describe('Golden path: solving a seeded case', () => {
	test('placing the full solution reveals the murderer', async ({ page }) => {
		await open(page, { seed: 1 });
		await startCase(page, 'beginner');

		const info = await readActiveCase(page);
		await placeSolution(page, info);

		const murdererName = info.people.find((person) => person.id === info.murdererId)?.name;
		expect(murdererName).toBeTruthy();

		// Solving reveals the murderer on the board overlay first; opening the case
		// file then leads to the result summary.
		await expect(page.getByTestId('case-solved-overlay')).toBeVisible();
		await expect(page.getByTestId('overlay-murderer')).toHaveText(murdererName as string);
		await page.getByTestId('reveal-continue').click();

		await expect(page.getByTestId('result-screen')).toBeVisible();
		await expect(page.getByTestId('murderer-name')).toHaveText(murdererName as string);
	});
});
