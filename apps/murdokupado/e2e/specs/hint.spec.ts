import { expect, test } from '@playwright/test';
import { open, startCase } from '../helpers/game';

interface HintProbe {
	hintsUsed: number;
	placedCount: number;
}

function readHintProbe(page: import('@playwright/test').Page): Promise<HintProbe> {
	return page.evaluate(() => {
		const store = (
			window as unknown as {
				__useGameStore: {
					getState: () => {
						hintsUsed: number;
						placement: Record<string, { r: number; c: number }>;
					};
				};
			}
		).__useGameStore;
		const { hintsUsed, placement } = store.getState();
		return { hintsUsed, placedCount: Object.keys(placement).length };
	});
}

test.describe('Hint flow', () => {
	test('requesting and applying a hint places a suspect and counts the hint', async ({ page }) => {
		await open(page, { seed: 1 });
		await startCase(page, 'beginner');

		await expect(await readHintProbe(page)).toEqual({ hintsUsed: 0, placedCount: 0 });

		await page.getByTestId('hint-button').click();
		await expect(page.getByTestId('hint-controls')).toBeVisible();

		await page.getByTestId('hint-apply').click();
		await expect(page.getByTestId('hint-controls')).toBeHidden();

		const probe = await readHintProbe(page);
		expect(probe.hintsUsed).toBe(1);
		expect(probe.placedCount).toBe(1);
	});
});
