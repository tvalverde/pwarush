import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SparkFlyOverlay, { arcApexY } from '../components/SparkFlyOverlay';

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

describe('arcApexY (keeps the lobbed spark on screen)', () => {
	it('clamps to a top margin when the HUD slot is near the top edge', () => {
		// Slot at y=24 near the top: an unclamped lift (24 - 80 = -56) would sail off screen.
		expect(arcApexY(600, 24, 800)).toBe(44);
	});

	it('lifts above the higher endpoint when there is room', () => {
		expect(arcApexY(600, 300, 800)).toBe(220); // min(600,300) - 80
	});

	it('never exceeds the viewport bottom margin', () => {
		expect(arcApexY(900, 900, 500)).toBe(456); // clamped to viewportH - margin
	});
});
