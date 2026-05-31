import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Regression: Navigation Access', () => {
	beforeEach(() => {
		useGameStore.getState().setScreen('main');
	});

	it('should allow switching between main screens', () => {
		const { setScreen } = useGameStore.getState();

		setScreen('trophies');
		expect(useGameStore.getState().activeScreen).toBe('trophies');

		setScreen('rules');
		expect(useGameStore.getState().activeScreen).toBe('rules');

		setScreen('main');
		expect(useGameStore.getState().activeScreen).toBe('main');
	});
});
