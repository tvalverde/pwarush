import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

describe('preference persistence failure feedback', () => {
	beforeEach(async () => {
		vi.restoreAllMocks();
		if (!db.isOpen()) await db.open();
		await db.preferences.clear();
		await db.preferences.add({
			playerId: 1,
			difficulty: 'beginner',
			allowNotes: true,
			maxMistakes: 3,
			maxHints: 3,
		});
		useGameStore.setState({
			activePlayerId: 1,
			language: 'en',
			selectedDifficulty: 'beginner',
			dialog: { isOpen: false, title: '', message: '', onConfirm: () => {} },
		});
	});

	it('keeps the in-memory change and informs the user when the DB write fails', async () => {
		vi.spyOn(db.preferences, 'where').mockImplementation(() => {
			throw new Error('quota exceeded');
		});

		await useGameStore.getState().setDifficulty('expert');

		const state = useGameStore.getState();
		expect(state.selectedDifficulty).toBe('expert');
		expect(state.dialog.isOpen).toBe(true);
		expect(state.dialog.message).toBe(state.t('settings.save_error'));
	});

	it('shows the same feedback for every preference setter', async () => {
		vi.spyOn(db.preferences, 'where').mockImplementation(() => {
			throw new Error('quota exceeded');
		});
		const { setAllowNotes, setMaxMistakes, setMaxHints, closeDialog } = useGameStore.getState();

		for (const trigger of [
			() => setAllowNotes(false),
			() => setMaxMistakes(5),
			() => setMaxHints(0),
		]) {
			closeDialog();
			await trigger();
			expect(useGameStore.getState().dialog.isOpen).toBe(true);
		}
	});

	it('does not open any dialog when persistence succeeds', async () => {
		await useGameStore.getState().setDifficulty('intermediate');

		const state = useGameStore.getState();
		expect(state.dialog.isOpen).toBe(false);
		const stored = await db.preferences.where('playerId').equals(1).first();
		expect(stored?.difficulty).toBe('intermediate');
	});
});
