import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NeonBoard from '../components/board/NeonBoard';
import { buildFamiliarBoard } from '../engine/boardFactory';
import type { Player } from '../types';

const player: Player = {
	id: 'p0-TRIANGLE',
	name: 'Ada',
	shape: 'TRIANGLE',
	position: 0,
	sparks: [],
};

describe('NeonBoard tile interaction (regression)', () => {
	// Regression: clicking a highlighted tile did nothing because the SVG captured the
	// pointer (setPointerCapture) and the click was retargeted away from the node.
	it('calls onMove with the node id when a highlighted tile is clicked', () => {
		const board = buildFamiliarBoard();
		const onMove = vi.fn();
		const { getByTestId } = render(
			<NeonBoard board={board} players={[player]} validMoves={[1, 5]} onMove={onMove} />,
		);

		fireEvent.click(getByTestId('move-1'));
		expect(onMove).toHaveBeenCalledWith(1);

		fireEvent.click(getByTestId('move-5'));
		expect(onMove).toHaveBeenCalledWith(5);
		expect(onMove).toHaveBeenCalledTimes(2);
	});

	it('does not expose a click target for non-highlighted nodes', () => {
		const board = buildFamiliarBoard();
		const onMove = vi.fn();
		const { queryByTestId } = render(
			<NeonBoard board={board} players={[player]} validMoves={[1]} onMove={onMove} />,
		);

		expect(queryByTestId('move-2')).toBeNull();
		expect(queryByTestId('move-1')).not.toBeNull();
	});
});
