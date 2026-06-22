import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHaptics, useTap } from '../hooks/useHaptics';
import { type AnswerOutcome, useGameStore } from '../store/gameStore';

const stubVibrate = () => {
	const fn = vi.fn(() => true);
	Object.defineProperty(navigator, 'vibrate', { value: fn, configurable: true });
	return fn;
};

const outcome = (over: Partial<AnswerOutcome> = {}): AnswerOutcome => ({
	correct: true,
	selectedIndex: 0,
	correctIndex: 0,
	collectedSpark: null,
	...over,
});

describe('useHaptics (state-driven feedback)', () => {
	let fn: ReturnType<typeof stubVibrate>;

	beforeEach(() => {
		fn = stubVibrate();
		useGameStore.getState().resetGame();
		useGameStore.setState({ hapticsEnabled: true, phase: 'QUESTION_ACTIVE' });
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
		vi.restoreAllMocks();
	});

	it('fires the spark-collected pattern when a correct answer banks a Spark', () => {
		renderHook(() => useHaptics());
		act(() =>
			useGameStore.setState({
				phase: 'FEEDBACK',
				lastOutcome: outcome({ correct: true, collectedSpark: 'CYAN_SCI' }),
			}),
		);
		expect(fn).toHaveBeenCalledWith([40, 30, 60]);
	});

	it('fires the plain correct pattern when a correct answer banks no Spark', () => {
		renderHook(() => useHaptics());
		act(() =>
			useGameStore.setState({ phase: 'FEEDBACK', lastOutcome: outcome({ correct: true }) }),
		);
		expect(fn).toHaveBeenCalledWith([25, 30, 25]);
	});

	it('fires the wrong pattern on a failed answer, and the conclave variant inside the Conclave', () => {
		renderHook(() => useHaptics());
		act(() =>
			useGameStore.setState({
				phase: 'FEEDBACK',
				isConclave: false,
				lastOutcome: outcome({ correct: false }),
			}),
		);
		expect(fn).toHaveBeenLastCalledWith(200);

		useGameStore.setState({ phase: 'CONCLAVE_QUESTION' });
		act(() =>
			useGameStore.setState({
				phase: 'FEEDBACK',
				isConclave: true,
				lastOutcome: outcome({ correct: false }),
			}),
		);
		expect(fn).toHaveBeenLastCalledWith([120, 50, 120]);
	});

	it('fires the victory burst on entering VICTORY', () => {
		renderHook(() => useHaptics());
		act(() => useGameStore.setState({ phase: 'VICTORY' }));
		expect(fn).toHaveBeenLastCalledWith([60, 40, 60, 40, 120]);
	});

	it('stays silent while haptics are disabled', () => {
		useGameStore.setState({ hapticsEnabled: false });
		renderHook(() => useHaptics());
		act(() =>
			useGameStore.setState({ phase: 'FEEDBACK', lastOutcome: outcome({ correct: true }) }),
		);
		expect(fn).not.toHaveBeenCalled();
	});
});

describe('useTap', () => {
	let fn: ReturnType<typeof stubVibrate>;

	beforeEach(() => {
		fn = stubVibrate();
		useGameStore.getState().resetGame();
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
		vi.restoreAllMocks();
	});

	it('emits a light tap when enabled and stays silent when disabled', () => {
		useGameStore.setState({ hapticsEnabled: true });
		const enabled = renderHook(() => useTap());
		act(() => enabled.result.current());
		expect(fn).toHaveBeenCalledWith(10);

		fn.mockClear();
		useGameStore.setState({ hapticsEnabled: false });
		const disabled = renderHook(() => useTap());
		act(() => disabled.result.current());
		expect(fn).not.toHaveBeenCalled();
	});
});
