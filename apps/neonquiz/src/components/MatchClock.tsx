import type React from 'react';
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { activeElapsedMs } from '../utils/time';

const ZERO_CLOCK = '00:00:00';

const pad = (value: number): string => value.toString().padStart(2, '0');

const formatElapsed = (elapsedMs: number): string => {
	const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
	const hours = Math.floor(elapsedSeconds / 3600);
	const minutes = Math.floor((elapsedSeconds % 3600) / 60);
	const seconds = elapsedSeconds % 60;
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Live HH:MM:SS match clock. Computes the active (un-paused) elapsed time from the store and
 * ticks its own local "now" every second via a component-owned `setInterval` (rule 16: DOM
 * timers never live in the Zustand store). The interval stops while paused, and `activeElapsedMs`
 * keeps the value frozen regardless. Renders the zeroed clock when no match is in progress.
 */
const MatchClock: React.FC = () => {
	const startedAt = useGameStore((s) => s.startedAt);
	const pausedAccumMs = useGameStore((s) => s.pausedAccumMs);
	const pausedSince = useGameStore((s) => s.pausedSince);
	const isPaused = useGameStore((s) => s.isPaused);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (startedAt === null || isPaused) return;
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [startedAt, isPaused]);

	const label =
		startedAt === null
			? ZERO_CLOCK
			: formatElapsed(activeElapsedMs(startedAt, pausedAccumMs, pausedSince, now));

	return (
		<span
			data-testid="match-clock"
			className="font-display text-xs font-bold tabular-nums tracking-wide-premium text-on-surface-variant"
		>
			{label}
		</span>
	);
};

export default MatchClock;
