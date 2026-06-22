/**
 * Active (un-paused) elapsed milliseconds of a match. Subtracts both the time banked in completed
 * pauses (`pausedAccumMs`) and the span of the pause currently in progress (`pausedSince`). Because
 * the in-progress term grows in lockstep with `now - startedAt`, the result naturally freezes while
 * paused — callers can keep a ticking `now` without the clock advancing. Pure and clamp-safe.
 */
export const activeElapsedMs = (
	startedAt: number | null,
	pausedAccumMs: number,
	pausedSince: number | null,
	now: number,
): number => {
	if (startedAt === null) return 0;
	const inProgressPause = pausedSince !== null ? now - pausedSince : 0;
	return Math.max(0, now - startedAt - pausedAccumMs - inProgressPause);
};
