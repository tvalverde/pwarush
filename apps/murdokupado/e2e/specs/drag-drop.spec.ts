import { expect, type Locator, type Page, test } from '@playwright/test';
import { open, readActiveCase, startCase } from '../helpers/game';

async function center(locator: Locator): Promise<{ x: number; y: number }> {
	const box = await locator.boundingBox();
	if (!box) throw new Error('Element has no bounding box');
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function dragWithMouse(page: Page, from: Locator, to: Locator): Promise<void> {
	const start = await center(from);
	const end = await center(to);
	await page.mouse.move(start.x, start.y);
	await page.mouse.down();
	// Two intermediate moves: the first crosses the activation threshold, the
	// second lands on the target so elementFromPoint resolves the destination cell.
	await page.mouse.move((start.x + end.x) / 2, (start.y + end.y) / 2, { steps: 5 });
	await page.mouse.move(end.x, end.y, { steps: 5 });
	await page.mouse.up();
}

async function readPlacement(page: Page): Promise<Record<string, { r: number; c: number }>> {
	return page.evaluate(() => {
		const store = (
			window as unknown as {
				__useGameStore: {
					getState: () => { placement: Record<string, { r: number; c: number }> };
				};
			}
		).__useGameStore;
		return store.getState().placement;
	});
}

async function readSelected(page: Page): Promise<string | null> {
	return page.evaluate(() => {
		const store = (
			window as unknown as {
				__useGameStore: { getState: () => { selectedPersonId: string | null } };
			}
		).__useGameStore;
		return store.getState().selectedPersonId;
	});
}

test.describe('Drag & drop placement', () => {
	test('dragging a suspect from the tray drops them on the target cell', async ({ page }) => {
		await open(page, { seed: 1 });
		await startCase(page, 'beginner');

		const info = await readActiveCase(page);
		const person = info.people[0];
		const cell = info.solution[person.id];

		await dragWithMouse(
			page,
			page.getByTestId(`suspect-${person.id}`),
			page.getByTestId(`cell-${cell.r}-${cell.c}`),
		);

		await expect.poll(() => readPlacement(page)).toMatchObject({ [person.id]: cell });
	});

	test('dragging a placed token moves it to another cell', async ({ page }) => {
		await open(page, { seed: 1 });
		await startCase(page, 'beginner');

		const info = await readActiveCase(page);
		const person = info.people[0];
		const origin = info.solution[person.id];

		await dragWithMouse(
			page,
			page.getByTestId(`suspect-${person.id}`),
			page.getByTestId(`cell-${origin.r}-${origin.c}`),
		);
		await expect.poll(() => readPlacement(page)).toMatchObject({ [person.id]: origin });

		let destination: { r: number; c: number } | null = null;
		for (let r = 0; r < 100 && !destination; r++) {
			for (let c = 0; c < 100 && !destination; c++) {
				const candidate = page.getByTestId(`cell-${r}-${c}`);
				if ((await candidate.count()) === 0) break;
				if (await candidate.isDisabled()) continue;
				if (r === origin.r && c === origin.c) continue;
				destination = { r, c };
			}
		}
		expect(destination).not.toBeNull();
		const dest = destination as { r: number; c: number };

		await dragWithMouse(
			page,
			page.getByTestId(`token-${person.id}`),
			page.getByTestId(`cell-${dest.r}-${dest.c}`),
		);

		await expect.poll(() => readPlacement(page)).toMatchObject({ [person.id]: dest });
	});

	test('a tray tap still selects after a cross-element drag', async ({ page }) => {
		await open(page, { seed: 1 });
		await startCase(page, 'beginner');

		const info = await readActiveCase(page);
		const dragged = info.people[0];
		const cell = info.solution[dragged.id];

		// Dragging tray -> cell crosses elements, so no synthetic click fires; the
		// drag-suppression flag must not linger and swallow the next legitimate tap.
		await dragWithMouse(
			page,
			page.getByTestId(`suspect-${dragged.id}`),
			page.getByTestId(`cell-${cell.r}-${cell.c}`),
		);
		await expect.poll(() => readPlacement(page)).toMatchObject({ [dragged.id]: cell });

		const other = info.people[1];
		await page.getByTestId(`suspect-${other.id}`).click();
		await expect.poll(() => readSelected(page)).toBe(other.id);
	});
});
