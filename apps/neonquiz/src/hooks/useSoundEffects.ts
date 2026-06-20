import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { playSound } from '../utils/sound';

/** Plays synthesized SFX on the relevant state changes, gated by the sound preference. */
export const useSoundEffects = (): void => {
	useEffect(() => {
		return useGameStore.subscribe((state, prev) => {
			if (!state.soundEnabled) return;

			if (state.dice !== prev.dice && state.dice !== null) playSound('roll');

			if (state.phase === 'VICTORY' && prev.phase !== 'VICTORY') {
				playSound('victory');
			} else if (state.phase === 'FEEDBACK' && prev.phase !== 'FEEDBACK' && state.lastOutcome) {
				if (!state.lastOutcome.correct) playSound('wrong');
				else playSound(state.lastOutcome.collectedSpark ? 'spark' : 'correct');
			}
		});
	}, []);
};
