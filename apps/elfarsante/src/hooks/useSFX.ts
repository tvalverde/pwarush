import { Howl } from 'howler';

// Preload sounds. Files should be located in /public/sfx/
const successSound = new Howl({
	src: ['/sfx/success.mp3'],
	preload: true,
});

const failSound = new Howl({
	src: ['/sfx/fail.mp3'],
	preload: true,
});

/**
 * Generates a synthetic beep using Web Audio API.
 * This works even if external MP3 files are missing.
 */
const playTone = (freq: number, type: OscillatorType, duration: number, volume = 0.05) => {
	if (typeof window === 'undefined') return;

	const AudioContextClass =
		window.AudioContext ||
		(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
	if (!AudioContextClass) return;

	try {
		const ctx = new AudioContextClass();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();

		osc.type = type;
		osc.frequency.setValueAtTime(freq, ctx.currentTime);

		gain.gain.setValueAtTime(volume, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.start();
		osc.stop(ctx.currentTime + duration);

		// Close context after sound finished to save resources
		setTimeout(
			() => {
				if (ctx.state !== 'closed') {
					ctx.close();
				}
			},
			(duration + 0.1) * 1000,
		);
	} catch (e) {
		console.warn('Synthetic audio failed', e);
	}
};

export function useSFX() {
	const vibrate = (pattern: number | number[]) => {
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			try {
				navigator.vibrate(pattern);
			} catch (e) {
				// Silent fail for browsers that restrict vibration
				console.warn('Vibration failed', e);
			}
		}
	};

	const playSuccess = () => {
		// Attempt to play MP3
		successSound.play();
		// Fallback/Reinforcement with synth
		playTone(523.25, 'sine', 0.2); // C5
		setTimeout(() => playTone(659.25, 'sine', 0.3), 150); // E5
		vibrate([50, 30, 50]);
	};

	const playFail = () => {
		// Attempt to play MP3
		failSound.play();
		// Fallback/Reinforcement with synth
		playTone(220, 'triangle', 0.5, 0.1); // A3
		vibrate(200);
	};

	const playTick = () => {
		// Standard haptic feedback for buttons
		vibrate(10);
	};

	return { playSuccess, playFail, playTick, vibrate };
}
