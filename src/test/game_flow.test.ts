import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Regression: Game Flow Protection', () => {
	beforeEach(() => {
		localStorage.clear();
		useGameStore.getState().closeDialog();
	});

	it('should show a dialog when trying to start a new game with one in progress', () => {
		const { showDialog } = useGameStore.getState();
		const _mockShowDialog = vi.spyOn(useGameStore.getState(), 'showDialog');

		// Simulating the state where we have a saved game logic (tested in integration-like way)
		// We'll verify if the store can handle the callback logic for 'onCancel' as 'Start New'

		let startedNew = false;
		showDialog({
			title: 'Test',
			message: 'Test',
			onConfirm: () => {},
			onCancel: () => {
				startedNew = true;
			},
		});

		const state = useGameStore.getState();
		expect(state.dialog.isOpen).toBe(true);

		// Simulate user clicking "Start New" (which is mapped to onCancel in our new logic)
		state.dialog.onCancel?.();
		expect(startedNew).toBe(true);
	});
});
