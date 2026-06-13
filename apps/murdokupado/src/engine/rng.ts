export type Rng = () => number;

/**
 * Deterministic, seedable PRNG (mulberry32). Returns a function that yields the
 * next float in [0, 1). Same seed always reproduces the same stream, which is
 * what makes case generation reproducible for tests and E2E seeding.
 */
export function createRng(seed: number): Rng {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function shuffleInPlace<T>(items: T[], rng: Rng): T[] {
	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		const temp = items[i];
		items[i] = items[j];
		items[j] = temp;
	}
	return items;
}

export function pick<T>(items: T[], rng: Rng): T {
	return items[Math.floor(rng() * items.length)];
}
