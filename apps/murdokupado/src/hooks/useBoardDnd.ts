import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CellRef, PersonId } from '../engine/types';
import { useGameStore } from '../store/gameStore';

export interface DragState {
	personId: PersonId;
	x: number;
	y: number;
	targetCell: CellRef | null;
}

interface DragOrigin {
	personId: PersonId;
	startX: number;
	startY: number;
	active: boolean;
}

export interface UseBoardDndOptions {
	isDroppable: (cell: CellRef) => boolean;
}

export interface UseBoardDnd {
	dragState: DragState | null;
	startDrag: (personId: PersonId, e: React.PointerEvent) => void;
	didDragRef: React.MutableRefObject<boolean>;
}

const DRAG_THRESHOLD_PX = 6;

const CELL_TESTID_PATTERN = /^cell-(\d+)-(\d+)$/;

/**
 * Parses a `cell-{r}-{c}` test id into a CellRef. Returns null when the id does
 * not match the expected board-cell shape.
 */
export function parseCellTestId(testId: string | null | undefined): CellRef | null {
	if (!testId) return null;
	const match = CELL_TESTID_PATTERN.exec(testId);
	if (!match) return null;
	return { r: Number(match[1]), c: Number(match[2]) };
}

/**
 * Resolves the board cell located under the given viewport coordinates by
 * walking up from the topmost element to the nearest `[data-testid^="cell-"]`.
 * The drag ghost must use `pointer-events: none` so it is never returned here.
 */
export function cellFromPoint(x: number, y: number): CellRef | null {
	const element = document.elementFromPoint(x, y);
	const cellElement = element?.closest('[data-testid^="cell-"]');
	return parseCellTestId(cellElement?.getAttribute('data-testid'));
}

export function useBoardDnd({ isDroppable }: UseBoardDndOptions): UseBoardDnd {
	const placePerson = useGameStore((s) => s.placePerson);
	const [dragState, setDragState] = useState<DragState | null>(null);
	const originRef = useRef<DragOrigin | null>(null);
	const didDragRef = useRef(false);
	const didDragResetRef = useRef<number | null>(null);
	const isDroppableRef = useRef(isDroppable);
	const placePersonRef = useRef(placePerson);

	useEffect(() => {
		isDroppableRef.current = isDroppable;
	}, [isDroppable]);

	useEffect(() => {
		placePersonRef.current = placePerson;
	}, [placePerson]);

	const startDrag = useCallback((personId: PersonId, e: React.PointerEvent) => {
		originRef.current = {
			personId,
			startX: e.clientX,
			startY: e.clientY,
			active: false,
		};
	}, []);

	useEffect(() => {
		const handlePointerMove = (e: PointerEvent) => {
			const origin = originRef.current;
			if (!origin) return;

			if (!origin.active) {
				const dx = e.clientX - origin.startX;
				const dy = e.clientY - origin.startY;
				if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
				origin.active = true;
			}

			const targetCell = cellFromPoint(e.clientX, e.clientY);
			setDragState({
				personId: origin.personId,
				x: e.clientX,
				y: e.clientY,
				targetCell: targetCell && isDroppableRef.current(targetCell) ? targetCell : null,
			});
		};

		const handlePointerUp = (e: PointerEvent) => {
			const origin = originRef.current;
			originRef.current = null;
			if (!origin) return;

			if (origin.active) {
				const targetCell = cellFromPoint(e.clientX, e.clientY);
				if (targetCell && isDroppableRef.current(targetCell)) {
					placePersonRef.current(origin.personId, targetCell);
				}
				// Suppress the synthetic click that follows a drag ending on the same
				// element; when the drag crosses elements no click fires, so clear the
				// flag on the next tick before it could swallow a later legitimate tap.
				didDragRef.current = true;
				if (didDragResetRef.current !== null) clearTimeout(didDragResetRef.current);
				didDragResetRef.current = window.setTimeout(() => {
					didDragRef.current = false;
					didDragResetRef.current = null;
				}, 0);
			}
			setDragState(null);
		};

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
			if (didDragResetRef.current !== null) clearTimeout(didDragResetRef.current);
		};
	}, []);

	return { dragState, startDrag, didDragRef };
}
