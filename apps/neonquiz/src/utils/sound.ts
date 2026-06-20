// Minimal synthesized SFX (Web Audio) — neon bleeps, no audio assets. The AudioContext is
// created lazily on first use (after a user gesture) and every call is a safe no-op when the
// API is unavailable (e.g. in tests/SSR).

export type SoundName = 'roll' | 'correct' | 'wrong' | 'spark' | 'victory';

type Tone = { freq: number; type: OscillatorType; duration: number; gain?: number };

const PRESETS: Record<SoundName, Tone[]> = {
	roll: [{ freq: 220, type: 'square', duration: 0.08, gain: 0.18 }],
	correct: [
		{ freq: 660, type: 'triangle', duration: 0.1 },
		{ freq: 990, type: 'triangle', duration: 0.12 },
	],
	wrong: [
		{ freq: 200, type: 'sawtooth', duration: 0.16, gain: 0.16 },
		{ freq: 140, type: 'sawtooth', duration: 0.2, gain: 0.16 },
	],
	spark: [
		{ freq: 880, type: 'triangle', duration: 0.07 },
		{ freq: 1320, type: 'triangle', duration: 0.09 },
	],
	victory: [
		{ freq: 523, type: 'triangle', duration: 0.12 },
		{ freq: 659, type: 'triangle', duration: 0.12 },
		{ freq: 784, type: 'triangle', duration: 0.14 },
		{ freq: 1047, type: 'triangle', duration: 0.22 },
	],
};

let ctx: AudioContext | null = null;

const getContext = (): AudioContext | null => {
	if (typeof window === 'undefined') return null;
	const Ctor =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!Ctor) return null;
	if (!ctx) ctx = new Ctor();
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
};

/** Plays a synthesized neon SFX. No-op if Web Audio is unavailable. */
export const playSound = (name: SoundName): void => {
	try {
		const audio = getContext();
		if (!audio) return;
		let start = audio.currentTime;
		for (const tone of PRESETS[name]) {
			const osc = audio.createOscillator();
			const gain = audio.createGain();
			osc.type = tone.type;
			osc.frequency.value = tone.freq;
			const peak = tone.gain ?? 0.22;
			gain.gain.setValueAtTime(0.0001, start);
			gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
			osc.connect(gain).connect(audio.destination);
			osc.start(start);
			osc.stop(start + tone.duration);
			start += tone.duration * 0.85;
		}
	} catch {
		// Audio is best-effort; never let it break the game.
	}
};
