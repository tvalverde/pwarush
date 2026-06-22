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

/**
 * Celebrates collecting a Spark: a glowing spark detaches from its board node and flies into
 * its slot in the HUD Spark track, where it docks. The endpoints are measured from the live
 * DOM (`data-spark-node` / `data-spark-slot`), so the path always matches the current layout.
 * When the endpoints can't be measured (e.g. jsdom) or motion is reduced, it docks instantly.
 */
const SparkFlyOverlay: React.FC<SparkFlyOverlayProps> = ({
	category,
	onDone,
	durationMs = 720,
}) => {
	const [path, setPath] = useState<{ from: Point; to: Point } | null>(null);
	const [arrived, setArrived] = useState(false);

	useEffect(() => {
		const from = centerOf(document.querySelector(`[data-spark-node="${category}"]`));
		const to = centerOf(document.querySelector(`[data-spark-slot="${category}"]`));

		if (!from || !to || prefersReducedMotion()) {
			const id = setTimeout(onDone, 0);
			return () => clearTimeout(id);
		}

		setPath({ from, to });
		const raf = requestAnimationFrame(() => requestAnimationFrame(() => setArrived(true)));
		const doneId = setTimeout(onDone, durationMs);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(doneId);
		};
	}, [category, onDone, durationMs]);

	if (!path) return null;

	const target = arrived ? path.to : path.from;
	const color = categoryColor(category);

	return (
		<div data-testid="spark-fly-overlay" className="pointer-events-none fixed inset-0 z-[60]">
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					transform: `translate(${target.x}px, ${target.y}px) translate(-50%, -50%) scale(${
						arrived ? 0.5 : 1.25
					})`,
					transition: `transform ${durationMs}ms cubic-bezier(0.3, 0, 0.2, 1)`,
					filter: `drop-shadow(0 0 6px ${color})`,
				}}
			>
				<svg width="34" height="34" viewBox="-17 -17 34 34" aria-hidden="true">
					<circle r={13} fill={color} opacity={0.35} />
					<polygon points={sparkle(12)} fill={color} />
					<polygon points={sparkle(6)} fill="#ffffff" />
				</svg>
			</div>
		</div>
	);
};

export default SparkFlyOverlay;
