// Deterministic mulberry32 PRNG so tests and the `?seed=N` E2E flag are reproducible.
export const createRng = (seed: number): (() => number) => {
	let state = seed >>> 0;
	return () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

export const randomInt = (rng: () => number, minInclusive: number, maxInclusive: number): number =>
	minInclusive + Math.floor(rng() * (maxInclusive - minInclusive + 1));

export const rollDie = (rng: () => number = Math.random): number => randomInt(rng, 1, 6);
