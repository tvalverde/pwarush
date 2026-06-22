import type React from 'react';
import { useEffect, useState } from 'react';
import Dice from './Dice';

interface DiceRollOverlayProps {
	/** The final value to reveal once the tumble settles. */
	value: number | null;
	/** Called once the settled value has been shown for `revealMs`. */
	onDone: () => void;
	/** Total tumble duration before settling on `value`, in ms. */
	durationMs?: number;
	/** How long the settled value is shown before `onDone` fires, in ms. */
	revealMs?: number;
}

const TUMBLE_TICK_MS = 60;

/** Snappy defaults: a brief tumble plus a short hold reads as lively without dragging. */
export const DEFAULT_TUMBLE_MS = 700;
export const DEFAULT_REVEAL_MS = 250;

const randomFace = (): number => 1 + Math.floor(Math.random() * 6);

/**
 * Full-board overlay that plays a brief "tumbling die" animation before revealing the real
 * roll. Purely presentational: the caller resolves the actual roll (via the store) and passes
 * the settled `value` in; this component only owns its own tumble/reveal timers, per rule 16.
 */
const DiceRollOverlay: React.FC<DiceRollOverlayProps> = ({
	value,
	onDone,
	durationMs = DEFAULT_TUMBLE_MS,
	revealMs = DEFAULT_REVEAL_MS,
}) => {
	const [face, setFace] = useState<number>(() => randomFace());
	const [settled, setSettled] = useState(false);

	useEffect(() => {
		setSettled(false);
		const tickId = setInterval(() => setFace(randomFace()), TUMBLE_TICK_MS);
		const settleId = setTimeout(() => {
			clearInterval(tickId);
			setSettled(true);
			setFace(value ?? randomFace());
		}, durationMs);

		return () => {
			clearInterval(tickId);
			clearTimeout(settleId);
		};
	}, [value, durationMs]);

	useEffect(() => {
		if (!settled) return;
		const doneId = setTimeout(onDone, revealMs);
		return () => clearTimeout(doneId);
	}, [settled, revealMs, onDone]);

	return (
		<div
			data-testid="dice-roll-overlay"
			className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-surface/80 backdrop-blur-sm"
		>
			<div
				data-testid="dice-roll-face"
				style={{
					transform: settled ? 'none' : `rotate(${(face * 47) % 360}deg) scale(1.08)`,
					filter: settled ? 'none' : 'blur(0.5px)',
					transition: settled ? 'transform 220ms cubic-bezier(0.2, 0.8, 0.3, 1)' : 'none',
				}}
			>
				<Dice value={settled ? value : face} size={88} />
			</div>
		</div>
	);
};

export default DiceRollOverlay;
