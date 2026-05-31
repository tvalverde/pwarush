import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';

describe('Regression: Global Dialog System', () => {
	beforeEach(() => {
		useGameStore.getState().closeDialog();
	});

	it('should update store state when showDialog is called', () => {
		const { showDialog } = useGameStore.getState();

		showDialog({
			title: 'Test Title',
			message: 'Test Message',
			onConfirm: () => {},
		});

		const state = useGameStore.getState();
		expect(state.dialog.isOpen).toBe(true);
		expect(state.dialog.title).toBe('Test Title');
	});

	it('should close dialog when closeDialog is called', () => {
		const { showDialog, closeDialog } = useGameStore.getState();

		showDialog({ title: 'T', message: 'M', onConfirm: () => {} });
		closeDialog();

		expect(useGameStore.getState().dialog.isOpen).toBe(false);
	});
});
