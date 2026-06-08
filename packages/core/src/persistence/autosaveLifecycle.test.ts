import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installAutosaveLifecycle } from './autosaveLifecycle';

const setVisibilityState = (state: DocumentVisibilityState) => {
	Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
};

describe('installAutosaveLifecycle', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		setVisibilityState('visible');
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('invokes save on every interval tick using the default interval', () => {
		const save = vi.fn();
		const cleanup = installAutosaveLifecycle(save);

		vi.advanceTimersByTime(9000);
		expect(save).toHaveBeenCalledTimes(3);
		cleanup();
	});

	it('honors a custom interval', () => {
		const save = vi.fn();
		const cleanup = installAutosaveLifecycle(save, { intervalMs: 1000 });

		vi.advanceTimersByTime(3000);
		expect(save).toHaveBeenCalledTimes(3);
		cleanup();
	});

	it('invokes save on beforeunload', () => {
		const save = vi.fn();
		const cleanup = installAutosaveLifecycle(save);

		window.dispatchEvent(new Event('beforeunload'));
		expect(save).toHaveBeenCalledTimes(1);
		cleanup();
	});

	it('invokes save on visibilitychange only when the document is hidden', () => {
		const save = vi.fn();
		const cleanup = installAutosaveLifecycle(save);

		document.dispatchEvent(new Event('visibilitychange'));
		expect(save).not.toHaveBeenCalled();

		setVisibilityState('hidden');
		document.dispatchEvent(new Event('visibilitychange'));
		expect(save).toHaveBeenCalledTimes(1);
		cleanup();
	});

	it('clears the interval and detaches listeners on cleanup', () => {
		const save = vi.fn();
		const cleanup = installAutosaveLifecycle(save);

		cleanup();

		vi.advanceTimersByTime(9000);
		window.dispatchEvent(new Event('beforeunload'));
		setVisibilityState('hidden');
		document.dispatchEvent(new Event('visibilitychange'));
		expect(save).not.toHaveBeenCalled();
	});
});
