import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Pauses a live game whenever the screen/tab loses focus (mirrors Sudokupado). Returning to the
 * tab does NOT auto-resume — the player taps "Resume" on the pause overlay. The listener lives in
 * a component-mounted hook with cleanup (rule 16: no DOM listeners/timers in the store). `pauseGame`
 * is a no-op outside a live game or when already paused, so this is safe to mount unconditionally.
 */
export const usePauseOnHide = (): void => {
	useEffect(() => {
		const onVisibilityChange = (): void => {
			if (document.visibilityState === 'hidden') {
				useGameStore.getState().pauseGame();
			}
		};
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => document.removeEventListener('visibilitychange', onVisibilityChange);
	}, []);
};
