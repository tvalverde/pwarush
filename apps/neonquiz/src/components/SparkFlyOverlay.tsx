import type React from 'react';
import { useEffect, useState } from 'react';
import type { TriviaCategory } from '../types';
import { categoryColor } from '../utils/categories';

interface SparkFlyOverlayProps {
	/** The category whose Spark flies from its board node to the HUD track. */
	category: TriviaCategory;
	/** Fired once the Spark has docked (or immediately when there is nothing to animate). */
	onDone: () => void;
	/** Travel duration in ms. */
	durationMs?: number;
}

interface Point {
	x: number;
	y: number;
}

// A four-pointed sparkle, eight alternating-radius vertices around the origin.
const sparkle = (outer: number): string => {
	const inner = outer * 0.38;
	const pts: string[] = [];
	for (let i = 0; i < 8; i++) {
		const angle = (Math.PI / 4) * i - Math.PI / 2;
		const radius = i % 2 === 0 ? outer : inner;
		pts.push(`${radius * Math.cos(angle)},${radius * Math.sin(angle)}`);
	}
	return pts.join(' ');
};

const centerOf = (el: Element | null): Point | null => {
	const rect = el?.getBoundingClientRect();
	if (!rect || (rect.width === 0 && rect.height === 0)) return null;
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

const prefersReducedMotion = (): boolean =>
	typeof window !== 'undefined' &&
	typeof window.matchMedia === 'function' &&
	window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ARC_LIFT = 80;
// Keep-out margin from every viewport edge for the arc apex. Sized to the spark's worst-case
// visual radius — its scaled half-size (~33px at the 1.25× apex) plus its glow (~22px) — so the
// bright spark never pokes off an edge. Capped to a fraction of the axis so it can't invert on a
// very small screen (phones/tablets in landscape or split view).
const ARC_MARGIN = 60;

const clamp = (value: number, lo: number, hi: number): number => Math.max(lo, Math.min(value, hi));

/**
 * The arc apex: midway across and lifted above the higher endpoint for a clear lob, but clamped
 * inside the viewport so the (scaled, glowing) spark can never sail off any edge. The HUD track
 * sits at the very top, so an unclamped lift would leave the screen — worst on short/phone
 * viewports. The margin adapts to the viewport so it can't invert on tiny screens.
 */
export const arcApex = (from: Point, to: Point, viewport: { w: number; h: number }): Point => {
	const marginY = Math.min(ARC_MARGIN, viewport.h * 0.2);
	const marginX = Math.min(ARC_MARGIN, viewport.w * 0.2);
	return {
		x: clamp((from.x + to.x) / 2, marginX, viewport.w - marginX),
		y: clamp(Math.min(from.y, to.y) - ARC_LIFT, marginY, viewport.h - marginY),
	};
};

/**
 * Celebrates collecting a Spark: a big, glowing spark arcs from its board node up into its slot
 * in the HUD Spark track, spinning and shrinking as it docks. The endpoints are measured live
 * from the DOM (`data-spark-node` / `data-spark-slot`), so the path matches the current layout;
 * the arc apex and the CSS animation are driven by custom properties. When the endpoints can't
 * be measured (e.g. jsdom) or motion is reduced, the Spark docks instantly.
 */
const SparkFlyOverlay: React.FC<SparkFlyOverlayProps> = ({
	category,
	onDone,
	durationMs = 900,
}) => {
	const [path, setPath] = useState<{ from: Point; to: Point; mid: Point } | null>(null);

	useEffect(() => {
		const from = centerOf(document.querySelector(`[data-spark-node="${category}"]`));
		const to = centerOf(document.querySelector(`[data-spark-slot="${category}"]`));

		if (!from || !to || prefersReducedMotion()) {
			const id = setTimeout(onDone, 0);
			return () => clearTimeout(id);
		}

		const viewport =
			typeof window !== 'undefined'
				? { w: window.innerWidth, h: window.innerHeight }
				: { w: Number.POSITIVE_INFINITY, h: Number.POSITIVE_INFINITY };
		const mid = arcApex(from, to, viewport);
		setPath({ from, to, mid });
		const doneId = setTimeout(onDone, durationMs);
		return () => clearTimeout(doneId);
	}, [category, onDone, durationMs]);

	if (!path) return null;

	const color = categoryColor(category);
	const style = {
		'--fx': `${path.from.x}px`,
		'--fy': `${path.from.y}px`,
		'--mx': `${path.mid.x}px`,
		'--my': `${path.mid.y}px`,
		'--tx': `${path.to.x}px`,
		'--ty': `${path.to.y}px`,
		'--dur': `${durationMs}ms`,
		filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 22px ${color})`,
	} as React.CSSProperties;

	return (
		<div data-testid="spark-fly-overlay" className="pointer-events-none fixed inset-0 z-[60]">
			<div className="nq-spark-fly absolute left-0 top-0" style={style}>
				<svg width="52" height="52" viewBox="-26 -26 52 52" aria-hidden="true">
					<circle r={21} fill={color} opacity={0.3} />
					<polygon points={sparkle(19)} fill={color} />
					<polygon points={sparkle(9.5)} fill="#ffffff" />
				</svg>
			</div>
		</div>
	);
};

export default SparkFlyOverlay;
