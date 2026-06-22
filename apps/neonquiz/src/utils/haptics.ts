// Haptic feedback for Neon Quiz — a thin wrapper over the Vibration API with a named pattern
// vocabulary that escalates from a light button tap to strong, distinctive bursts for the big
// moments (collecting a Spark, winning the match). Every call is a safe no-op when the API is
// unavailable (desktop, iOS Safari, tests/SSR); gating by the player's preference is the caller's
// responsibility (see useHaptics / useTap), keeping this module pure and store-free.

export type HapticEvent =
	| 'tap'
	| 'sparkCandidate'
	| 'move'
	| 'correct'
	| 'sparkCollected'
	| 'wrong'
	| 'conclaveFail'
	| 'deadEnd'
	| 'victory';

// Durations in milliseconds; arrays alternate vibrate/pause/vibrate… per the Vibration API.
export const HAPTIC_PATTERNS: Record<HapticEvent, number | number[]> = {
	tap: 10,
	sparkCandidate: [15, 40, 15],
	move: 35,
	correct: [25, 30, 25],
	sparkCollected: [40, 30, 60],
	wrong: 200,
	conclaveFail: [120, 50, 120],
	deadEnd: [20, 40, 20],
	victory: [60, 40, 60, 40, 120],
};

const canVibrate = (): boolean =>
	typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

/** Fires a named haptic pattern. No-op when the Vibration API is unavailable. */
export const vibrate = (event: HapticEvent): void => {
	if (!canVibrate()) return;
	try {
		navigator.vibrate(HAPTIC_PATTERNS[event]);
	} catch {
		// Haptics are best-effort; never let them break the game.
	}
};

/** A light button tap, the most frequent pattern. */
export const tap = (): void => vibrate('tap');
