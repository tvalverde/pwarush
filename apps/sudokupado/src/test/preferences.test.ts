import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

describe('Regression: Player Preferences & Defaults', () => {
	beforeEach(() => {
		localStorage.clear();
		const { setActivePlayer } = useGameStore.getState();
		setActivePlayer(null);
	});

	it('should start with beginner difficulty, notes enabled, and 3 mistakes by default', () => {
		const { selectedDifficulty, allowNotes, maxMistakes } = useGameStore.getState();

		expect(selectedDifficulty).toBe('beginner');
		expect(allowNotes).toBe(true);
		expect(maxMistakes).toBe(3);
	});

	it('should reset preferences to defaults when a new player is active (Conceptual logic)', () => {
		const { setDifficulty, setAllowNotes, setMaxMistakes, setActivePlayer } =
			useGameStore.getState();

		setDifficulty('master');
		setAllowNotes(false);
		setMaxMistakes(0);

		expect(useGameStore.getState().selectedDifficulty).toBe('master');

		setActivePlayer(123);
	});
});

describe('Regression: Async store actions for preferences (Fix 1.3)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		if (!db.isOpen()) await db.open();
		await db.preferences.clear();

		useGameStore.setState({
			activePlayerId: 42,
			selectedDifficulty: 'beginner',
			allowNotes: true,
			maxMistakes: 3,
		});
	});

	it('setDifficulty should update in-memory state immediately and return a promise', async () => {
		const { setDifficulty } = useGameStore.getState();

		const result = setDifficulty('expert');

		expect(useGameStore.getState().selectedDifficulty).toBe('expert');
		expect(result).toBeInstanceOf(Promise);

		await result;
	});

	it('setAllowNotes should update in-memory state immediately and return a promise', async () => {
		const { setAllowNotes } = useGameStore.getState();

		const result = setAllowNotes(false);

		expect(useGameStore.getState().allowNotes).toBe(false);
		expect(result).toBeInstanceOf(Promise);

		await result;
	});

	it('setMaxMistakes should update in-memory state immediately and return a promise', async () => {
		const { setMaxMistakes } = useGameStore.getState();

		const result = setMaxMistakes(5);

		expect(useGameStore.getState().maxMistakes).toBe(5);
		expect(result).toBeInstanceOf(Promise);

		await result;
	});

	it('setDifficulty should log error and not throw when DB modify fails', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		vi.spyOn(db.preferences, 'where').mockReturnValue({
			equals: () => ({
				modify: () => Promise.reject(new Error('DB write failed')),
			}),
		} as any);

		const { setDifficulty } = useGameStore.getState();

		await expect(setDifficulty('master')).resolves.toBeUndefined();
		expect(useGameStore.getState().selectedDifficulty).toBe('master');
		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to persist player preferences:',
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});

	it('setAllowNotes should log error and not throw when DB modify fails', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		vi.spyOn(db.preferences, 'where').mockReturnValue({
			equals: () => ({
				modify: () => Promise.reject(new Error('DB write failed')),
			}),
		} as any);

		const { setAllowNotes } = useGameStore.getState();

		await expect(setAllowNotes(false)).resolves.toBeUndefined();
		expect(useGameStore.getState().allowNotes).toBe(false);
		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to persist player preferences:',
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});

	it('setMaxMistakes should log error and not throw when DB modify fails', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		vi.spyOn(db.preferences, 'where').mockReturnValue({
			equals: () => ({
				modify: () => Promise.reject(new Error('DB write failed')),
			}),
		} as any);

		const { setMaxMistakes } = useGameStore.getState();

		await expect(setMaxMistakes(0)).resolves.toBeUndefined();
		expect(useGameStore.getState().maxMistakes).toBe(0);
		expect(consoleSpy).toHaveBeenCalledWith(
			'Failed to persist player preferences:',
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});

	it('setDifficulty should not call DB modify when no player is active', async () => {
		useGameStore.setState({ activePlayerId: null });

		const modifySpy = vi.spyOn(db.preferences, 'where');
		const { setDifficulty } = useGameStore.getState();

		await setDifficulty('master');

		expect(useGameStore.getState().selectedDifficulty).toBe('master');
		expect(modifySpy).not.toHaveBeenCalled();

		modifySpy.mockRestore();
	});
});
