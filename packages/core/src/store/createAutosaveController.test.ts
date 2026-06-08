import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	type AutosaveControllerConfig,
	createAutosaveController,
} from './createAutosaveController';

interface TestState {
	value: number;
	screen: 'menu' | 'game';
	done: boolean;
}

const baseState = (): TestState => ({ value: 0, screen: 'game', done: false });

const setVisibilityState = (state: DocumentVisibilityState) => {
	Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
};

const buildConfig = (overrides: Partial<AutosaveControllerConfig<TestState>> = {}) => {
	let state = baseState();
	let listener: ((s: TestState, prev: TestState) => void) | null = null;

	const config: AutosaveControllerConfig<TestState> = {
		getState: () => state,
		subscribe: (l) => {
			listener = l;
			return () => {
				listener = null;
			};
		},
		snapshot: (s) => JSON.stringify({ value: s.value }),
		persist: vi.fn(),
		clear: vi.fn(),
		...overrides,
	};

	return {
		config,
		setState: (next: TestState) => {
			state = next;
		},
		emit: (next: TestState, prev: TestState) => listener?.(next, prev),
	};
};

describe('createAutosaveController', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		setVisibilityState('visible');
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe('save()', () => {
		it('skips persist when shouldSave returns false and not forced', async () => {
			const { config } = buildConfig({
				getState: () => ({ value: 1, screen: 'menu', done: false }),
				shouldSave: (s) => s.screen === 'game',
			});

			const controller = createAutosaveController(config);
			await controller.save();

			expect(config.persist).not.toHaveBeenCalled();
		});

		it('forces persist even when shouldSave returns false', async () => {
			const { config } = buildConfig({
				getState: () => ({ value: 1, screen: 'menu', done: false }),
				shouldSave: (s) => s.screen === 'game',
			});

			const controller = createAutosaveController(config);
			await controller.save(true);

			expect(config.persist).toHaveBeenCalledTimes(1);
		});

		it('clears instead of persisting when shouldClear returns true', async () => {
			const { config } = buildConfig({ shouldClear: () => true });

			const controller = createAutosaveController(config);
			await controller.save();

			expect(config.clear).toHaveBeenCalledTimes(1);
			expect(config.persist).not.toHaveBeenCalled();
		});

		it('deduplicates consecutive saves with an identical snapshot', async () => {
			const { config } = buildConfig();

			const controller = createAutosaveController(config);
			await controller.save();
			await controller.save();

			expect(config.persist).toHaveBeenCalledTimes(1);
		});

		it('persists again when the snapshot changes', async () => {
			let value = 0;
			const { config } = buildConfig({
				getState: () => ({ value, screen: 'game', done: false }),
			});

			const controller = createAutosaveController(config);
			await controller.save();
			value = 1;
			await controller.save();

			expect(config.persist).toHaveBeenCalledTimes(2);
		});

		it('bypasses the dedup guard when forced', async () => {
			const { config } = buildConfig();

			const controller = createAutosaveController(config);
			await controller.save();
			await controller.save(true);

			expect(config.persist).toHaveBeenCalledTimes(2);
		});
	});

	describe('start()', () => {
		it('persists on the lifecycle interval tick', () => {
			const { config } = buildConfig();

			const controller = createAutosaveController(config);
			const cleanup = controller.start();

			vi.advanceTimersByTime(3000);

			expect(config.persist).toHaveBeenCalled();
			cleanup();
		});

		it('honors a custom interval', () => {
			const { config } = buildConfig({ intervalMs: 1000 });

			const controller = createAutosaveController(config);
			const cleanup = controller.start();

			vi.advanceTimersByTime(1000);

			expect(config.persist).toHaveBeenCalled();
			cleanup();
		});

		it('forces a save when a trigger returns "save"', () => {
			const { config, emit } = buildConfig({
				triggers: () => 'save',
			});

			const controller = createAutosaveController(config);
			const cleanup = controller.start();

			emit({ value: 9, screen: 'menu', done: false }, baseState());

			expect(config.persist).toHaveBeenCalledTimes(1);
			cleanup();
		});

		it('clears when a trigger returns "clear"', () => {
			const { config, emit } = buildConfig({
				triggers: () => 'clear',
			});

			const controller = createAutosaveController(config);
			const cleanup = controller.start();

			emit({ value: 0, screen: 'menu', done: false }, baseState());

			expect(config.clear).toHaveBeenCalledTimes(1);
			expect(config.persist).not.toHaveBeenCalled();
			cleanup();
		});

		it('does nothing when a trigger returns null', () => {
			const { config, emit } = buildConfig({
				triggers: () => null,
			});

			const controller = createAutosaveController(config);
			const cleanup = controller.start();

			emit(baseState(), baseState());

			expect(config.persist).not.toHaveBeenCalled();
			expect(config.clear).not.toHaveBeenCalled();
			cleanup();
		});

		it('stops the interval and detaches the subscription on cleanup', () => {
			const { config, emit } = buildConfig({ triggers: () => 'save' });

			const controller = createAutosaveController(config);
			const cleanup = controller.start();
			cleanup();

			vi.advanceTimersByTime(9000);
			emit({ value: 5, screen: 'game', done: false }, baseState());

			expect(config.persist).not.toHaveBeenCalled();
		});
	});
});
