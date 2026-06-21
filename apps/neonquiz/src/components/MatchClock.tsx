import type React from 'react';
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const ZERO_CLOCK = '00:00:00';

const pad = (value: number): string => value.toString().padStart(2, '0');

const formatElapsed = (startedAt: number, now: number): string => {
	const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
	const hours = Math.floor(elapsedSeconds / 3600);
	const minutes = Math.floor((elapsedSeconds % 3600) / 60);
	const seconds = elapsedSeconds % 60;
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Live HH:MM:SS match clock. Reads the immutable `startedAt` timestamp from the store and
 * ticks its own local "now" every second via a component-owned `setInterval` (rule 16: DOM
 * timers never live in the Zustand store). Renders the zeroed clock when there is no match
 * in progress (`startedAt` is null).
 */
const MatchClock: React.FC = () => {
	const startedAt = useGameStore((s) => s.startedAt);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (startedAt === null) return;
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [startedAt]);

	const label = startedAt === null ? ZERO_CLOCK : formatElapsed(startedAt, now);

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
