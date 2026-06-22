import { useCallback, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { type HapticEvent, vibrate } from '../utils/haptics';

/**
 * Subscriber that fires the state-driven haptics — answer feedback, Spark collection, Conclave
 * failure and victory — on the relevant phase transitions, gated by the player's preference.
 * Mounted once at the app root (mirrors the removed sound subscriber).
 */
export const useHaptics = (): void => {
	useEffect(() => {
		return useGameStore.subscribe((state, prev) => {
			if (!state.hapticsEnabled) return;

			if (state.phase === 'VICTORY' && prev.phase !== 'VICTORY') {
				vibrate('victory');
			} else if (state.phase === 'FEEDBACK' && prev.phase !== 'FEEDBACK' && state.lastOutcome) {
				if (!state.lastOutcome.correct) {
					vibrate(state.isConclave ? 'conclaveFail' : 'wrong');
				} else {
					vibrate(state.lastOutcome.collectedSpark ? 'sparkCollected' : 'correct');
				}
			}
		});
	}, []);
};

/**
 * Returns a callback that fires any named haptic event, gated by the player's preference.
 * Use for board/dice moments (move, sparkCandidate, deadEnd) driven from components.
 */
export const useHapticEvent = (): ((event: HapticEvent) => void) => {
	const enabled = useGameStore((s) => s.hapticsEnabled);
	return useCallback(
		(event: HapticEvent) => {
			if (enabled) vibrate(event);
		},
		[enabled],
	);
};

/**
 * Returns a light-tap callback for button presses, gated by the player's haptics preference.
 * Wrap an existing handler with {@link useTapHandler} when the tap should fire before the action.
 */
export const useTap = (): (() => void) => {
	const fire = useHapticEvent();
	return useCallback(() => fire('tap'), [fire]);
};

/** Wraps a click handler so it emits a light tap (when enabled) before running. */
export const useTapHandler = <A extends unknown[]>(
	handler?: (...args: A) => void,
): ((...args: A) => void) => {
	const tap = useTap();
	return useCallback(
		(...args: A) => {
			tap();
			handler?.(...args);
		},
		[tap, handler],
	);
};
