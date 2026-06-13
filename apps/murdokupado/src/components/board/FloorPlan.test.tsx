import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { courtroom } from '../../data/scenes';
import { computeFloorPlan } from '../../engine/floorplan';
import FloorPlan from './FloorPlan';

afterEach(() => {
	cleanup();
});

describe('FloorPlan', () => {
	it('renders one floor rect per computed floor tile', () => {
		const plan = computeFloorPlan(courtroom);
		const { container } = render(<FloorPlan scene={courtroom} />);

		const floorRects = container.querySelectorAll('rect[fill^="var(--color-room-"]');
		expect(floorRects).toHaveLength(plan.floors.length);
	});

	it('renders one line per computed wall segment', () => {
		const plan = computeFloorPlan(courtroom);
		const { container } = render(<FloorPlan scene={courtroom} />);

		const lines = container.querySelectorAll('line[data-wall]');
		expect(lines).toHaveLength(plan.walls.length);
	});

	it('uses the room-1 token for at least one floor tile', () => {
		const { container } = render(<FloorPlan scene={courtroom} />);
		const room1Rects = container.querySelectorAll('rect[fill="var(--color-room-1)"]');
		expect(room1Rects.length).toBeGreaterThan(0);
	});
});
