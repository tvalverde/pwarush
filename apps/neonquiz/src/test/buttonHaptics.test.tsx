import { fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConfirmOverlay from '../components/ConfirmOverlay';
import TurnTransitionScreen from '../components/TurnTransitionScreen';
import { useGameStore } from '../store/gameStore';

const stubVibrate = () => {
	const fn = vi.fn(() => true);
	Object.defineProperty(navigator, 'vibrate', { value: fn, configurable: true });
	return fn;
};

describe('button tap haptics', () => {
	let fn: ReturnType<typeof stubVibrate>;

	beforeEach(() => {
		fn = stubVibrate();
		useGameStore.getState().resetGame();
	});

	afterEach(() => {
		Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
		vi.restoreAllMocks();
	});

	it('fires a light tap when the confirm button is pressed and haptics are enabled', () => {
		useGameStore.setState({ hapticsEnabled: true });
		const { getByTestId } = render(
			<ConfirmOverlay
				title="Title"
				message="Message"
				confirmText="Confirm"
				cancelText="Cancel"
				onConfirm={() => {}}
				onCancel={() => {}}
			/>,
		);
		fireEvent.click(getByTestId('confirm-yes'));
		expect(fn).toHaveBeenCalledWith(10);
	});

	it('fires a light tap when the cancel button is pressed', () => {
		useGameStore.setState({ hapticsEnabled: true });
		const { getByTestId } = render(
			<ConfirmOverlay
				title="Title"
				message="Message"
				confirmText="Confirm"
				cancelText="Cancel"
				onConfirm={() => {}}
				onCancel={() => {}}
			/>,
		);
		fireEvent.click(getByTestId('confirm-no'));
		expect(fn).toHaveBeenCalledWith(10);
	});

	it('stays silent when haptics are disabled', () => {
		useGameStore.setState({ hapticsEnabled: false });
		const { getByTestId } = render(
			<ConfirmOverlay
				title="Title"
				message="Message"
				confirmText="Confirm"
				cancelText="Cancel"
				onConfirm={() => {}}
				onCancel={() => {}}
			/>,
		);
		fireEvent.click(getByTestId('confirm-yes'));
		expect(fn).not.toHaveBeenCalled();
	});

	it('fires a light tap when confirming the turn transition handoff', () => {
		useGameStore.setState({ hapticsEnabled: true });
		const s = useGameStore.getState();
		s.startGame([
			{ name: 'Ada', shape: 'TRIANGLE', level: 'KID' },
			{ name: 'Bob', shape: 'SQUARE', level: 'KID' },
		]);
		const { getByTestId } = render(<TurnTransitionScreen />);
		fireEvent.click(getByTestId('confirm-transition'));
		expect(fn).toHaveBeenCalledWith(10);
	});
});
