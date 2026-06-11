import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSudokuWorker } from './useSudokuWorker';

export const useGameHints = () => {
	const { getHint } = useSudokuWorker();
	const grid = useGameStore((s) => s.grid);
	const solution = useGameStore((s) => s.solution);
	const initialGrid = useGameStore((s) => s.initialGrid);
	const maxHints = useGameStore((s) => s.maxHints);
	const hintsUsed = useGameStore((s) => s.hintsUsed);
	const currentHint = useGameStore((s) => s.currentHint);
	const triggerHint = useGameStore((s) => s.useHint);
	const clearHint = useGameStore((s) => s.clearHint);
	const showDialog = useGameStore((s) => s.showDialog);
	const t = useGameStore((s) => s.t);

	const isHintDisabled = maxHints <= 0 || hintsUsed >= maxHints;

	const requestHint = useCallback(async () => {
		if (maxHints <= 0 || hintsUsed >= maxHints || currentHint) return;

		// The solver only accepts consistent boards, so wrong user entries are blanked first
		const cleanGrid = grid.map((row, ri) =>
			row.map((cellVal, ci) =>
				cellVal !== 0 && initialGrid[ri][ci] === 0 && cellVal !== solution[ri][ci] ? 0 : cellVal,
			),
		);

		try {
			const hint = await getHint(cleanGrid, solution);
			triggerHint(hint);
		} catch {
			clearHint();
			showDialog({
				title: t('hints.title'),
				message: t('hints.error'),
				type: 'info',
				confirmText: 'OK',
				onConfirm: () => {},
			});
		}
	}, [
		maxHints,
		hintsUsed,
		currentHint,
		grid,
		initialGrid,
		solution,
		getHint,
		triggerHint,
		clearHint,
		showDialog,
		t,
	]);

	return { requestHint, isHintDisabled };
};
