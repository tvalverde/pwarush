import { describe, expect, it } from 'vitest';
import { playSound } from '../utils/sound';

describe('sound engine', () => {
	it('is a safe no-op when Web Audio is unavailable (e.g. jsdom)', () => {
		expect(() => {
			playSound('roll');
			playSound('correct');
			playSound('wrong');
			playSound('spark');
			playSound('victory');
		}).not.toThrow();
	});
});
