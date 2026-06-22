import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SparkFlyOverlay, { arcApex } from '../components/SparkFlyOverlay';

const placeTarget = (attr: string, value: string, rect: Partial<DOMRect>): void => {
	const el = document.createElement('div');
	el.setAttribute(attr, value);
	el.getBoundingClientRect = () =>
		({
			left: 0,
			top: 0,
			width: 0,
			height: 0,
			right: 0,
			bottom: 0,
			x: 0,
			y: 0,
			toJSON: () => ({}),
			...rect,
		}) as DOMRect;
	document.body.appendChild(el);
};

describe('SparkFlyOverlay', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('docks immediately (fires onDone) when the endpoints cannot be measured', async () => {
		const onDone = vi.fn();
		const { queryByTestId } = render(<SparkFlyOverlay category="CYAN_SCI" onDone={onDone} />);
		expect(queryByTestId('spark-fly-overlay')).toBeNull();
		await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
	});

	it('flies the spark and docks after the duration when both endpoints exist', async () => {
		placeTarget('data-spark-node', 'CYAN_SCI', { left: 10, top: 10, width: 20, height: 20 });
		placeTarget('data-spark-slot', 'CYAN_SCI', { left: 200, top: 0, width: 12, height: 12 });
		const onDone = vi.fn();
		const { getByTestId } = render(
			<SparkFlyOverlay category="CYAN_SCI" onDone={onDone} durationMs={30} />,
		);
		expect(getByTestId('spark-fly-overlay')).toBeInTheDocument();
		await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
	});
});

describe('arcApex (keeps the lobbed spark on screen)', () => {
	const viewport = { w: 1280, h: 800 };

	it('clamps Y to the top margin when the HUD slot is near the top edge', () => {
		// Slot at y=24 near the top: an unclamped lift (24 - 80 = -56) would sail off screen.
		expect(arcApex({ x: 600, y: 600 }, { x: 700, y: 24 }, viewport).y).toBe(60);
	});

	it('lifts above the higher endpoint when there is room', () => {
		expect(arcApex({ x: 600, y: 600 }, { x: 700, y: 300 }, viewport).y).toBe(220); // 300 - 80
	});

	it('never exceeds the viewport bottom margin', () => {
		expect(arcApex({ x: 0, y: 900 }, { x: 0, y: 900 }, { w: 1280, h: 500 }).y).toBe(440);
	});

	it('clamps X inside the horizontal margins', () => {
		expect(arcApex({ x: -200, y: 400 }, { x: 0, y: 30 }, viewport).x).toBe(60);
		expect(arcApex({ x: 5000, y: 400 }, { x: 5000, y: 30 }, viewport).x).toBe(1220);
	});

	it('shrinks the margin on a tiny viewport so it cannot invert', () => {
		// h=200 → marginY = min(60, 40) = 40, so the apex clamps to 40 not 60.
		expect(arcApex({ x: 100, y: 150 }, { x: 100, y: 20 }, { w: 1280, h: 200 }).y).toBe(40);
	});
});
