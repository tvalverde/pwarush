import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Case, CellRef } from '../engine/types';
import { cellFromPoint, parseCellTestId, useBoardDnd } from '../hooks/useBoardDnd';
import { useGameStore } from '../store/gameStore';

function mockElementFromPoint(element: Element | null): void {
	Object.defineProperty(document, 'elementFromPoint', {
		configurable: true,
		writable: true,
		value: () => element,
	});
}

afterEach(() => {
	Reflect.deleteProperty(document, 'elementFromPoint');
});

describe('parseCellTestId', () => {
	it('parses a well-formed cell test id', () => {
		expect(parseCellTestId('cell-2-3')).toEqual({ r: 2, c: 3 });
		expect(parseCellTestId('cell-0-0')).toEqual({ r: 0, c: 0 });
	});

	it('returns null for non-cell or malformed ids', () => {
		expect(parseCellTestId('suspect-alice')).toBeNull();
		expect(parseCellTestId('cell-2')).toBeNull();
		expect(parseCellTestId('cell-a-b')).toBeNull();
		expect(parseCellTestId(null)).toBeNull();
		expect(parseCellTestId(undefined)).toBeNull();
	});
});

describe('cellFromPoint', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('resolves the nearest cell ancestor under the pointer', () => {
		document.body.innerHTML = '<button data-testid="cell-1-4"><span id="inner"></span></button>';
		const inner = document.getElementById('inner') as HTMLElement;
		mockElementFromPoint(inner);
		expect(cellFromPoint(10, 10)).toEqual({ r: 1, c: 4 });
	});

	it('returns null when no cell is under the pointer', () => {
		document.body.innerHTML = '<div id="elsewhere"></div>';
		const el = document.getElementById('elsewhere') as HTMLElement;
		mockElementFromPoint(el);
		expect(cellFromPoint(10, 10)).toBeNull();
	});
});

const TEST_CASE: Case = {
	sceneId: 'test',
	people: [{ id: 'alice', name: 'Alice' }],
	victimId: 'victim',
	clues: [],
	narrators: [],
	solution: {},
	difficulty: 'beginner',
	murdererId: 'alice',
};

interface HarnessProps {
	onTrayClick: (didDrag: boolean) => void;
	isDroppable?: (cell: CellRef) => boolean;
}

const Harness: React.FC<HarnessProps> = ({ onTrayClick, isDroppable = () => true }) => {
	const { dragState, startDrag, didDragRef } = useBoardDnd({ isDroppable });
	const clicksRef = useRef(0);
	return (
		<div>
			<button
				type="button"
				data-testid="suspect-alice"
				onPointerDown={(e) => startDrag('alice', e)}
				onClick={() => {
					onTrayClick(didDragRef.current);
					didDragRef.current = false;
				}}
			>
				Alice
			</button>
			<button type="button" data-testid="cell-0-0">
				cell
			</button>
			<div data-testid="drag-active">{dragState ? 'yes' : 'no'}</div>
			<div data-testid="clicks">{clicksRef.current}</div>
		</div>
	);
};

describe('useBoardDnd threshold and click suppression', () => {
	beforeEach(() => {
		useGameStore.setState({ activeCase: TEST_CASE, placement: {} });
	});

	afterEach(() => {
		vi.restoreAllMocks();
		useGameStore.setState({ activeCase: null, placement: {} });
	});

	it('does not activate a drag for a tap below the movement threshold', () => {
		const onTrayClick = vi.fn();
		render(<Harness onTrayClick={onTrayClick} />);
		const suspect = screen.getByTestId('suspect-alice');

		fireEvent.pointerDown(suspect, { clientX: 100, clientY: 100 });
		fireEvent.pointerUp(window, { clientX: 102, clientY: 101 });
		fireEvent.click(suspect);

		expect(screen.getByTestId('drag-active')).toHaveTextContent('no');
		expect(onTrayClick).toHaveBeenCalledWith(false);
	});

	it('activates a drag past the threshold and suppresses the trailing click', () => {
		const placeSpy = vi.fn();
		useGameStore.setState({ placePerson: placeSpy as never });
		const onTrayClick = vi.fn();
		const elsewhere = document.createElement('div');
		mockElementFromPoint(elsewhere);

		render(<Harness onTrayClick={onTrayClick} />);
		const suspect = screen.getByTestId('suspect-alice');

		fireEvent.pointerDown(suspect, { clientX: 100, clientY: 100 });
		fireEvent.pointerMove(window, { clientX: 100, clientY: 120 });
		expect(screen.getByTestId('drag-active')).toHaveTextContent('yes');

		fireEvent.pointerUp(window, { clientX: 100, clientY: 120 });
		fireEvent.click(suspect);

		expect(screen.getByTestId('drag-active')).toHaveTextContent('no');
		expect(onTrayClick).toHaveBeenCalledWith(true);
	});

	it('places the person on the resolved cell when dropped over a droppable cell', () => {
		const placeSpy = vi.fn();
		useGameStore.setState({ placePerson: placeSpy as never });
		render(<Harness onTrayClick={vi.fn()} />);
		const suspect = screen.getByTestId('suspect-alice');
		const cell = screen.getByTestId('cell-0-0');
		mockElementFromPoint(cell);

		fireEvent.pointerDown(suspect, { clientX: 0, clientY: 0 });
		fireEvent.pointerMove(window, { clientX: 0, clientY: 20 });
		fireEvent.pointerUp(window, { clientX: 0, clientY: 20 });

		expect(placeSpy).toHaveBeenCalledWith('alice', { r: 0, c: 0 });
	});

	it('does not place when dropped over a non-droppable cell', () => {
		const placeSpy = vi.fn();
		useGameStore.setState({ placePerson: placeSpy as never });
		render(<Harness onTrayClick={vi.fn()} isDroppable={() => false} />);
		const suspect = screen.getByTestId('suspect-alice');
		const cell = screen.getByTestId('cell-0-0');
		mockElementFromPoint(cell);

		fireEvent.pointerDown(suspect, { clientX: 0, clientY: 0 });
		fireEvent.pointerMove(window, { clientX: 0, clientY: 20 });
		fireEvent.pointerUp(window, { clientX: 0, clientY: 20 });

		expect(placeSpy).not.toHaveBeenCalled();
	});
});
