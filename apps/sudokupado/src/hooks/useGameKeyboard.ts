import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export const useGameKeyboard = (onNumberInput: (num: number) => void) => {
	const isPaused = useGameStore((s) => s.isPaused);
	const isVictory = useGameStore((s) => !!s.lastGameResult);
	const selectedCell = useGameStore((s) => s.selectedCell);
	const isNoteMode = useGameStore((s) => s.isNoteMode);
	const setSelectedCell = useGameStore((s) => s.setSelectedCell);
	const setNoteMode = useGameStore((s) => s.setNoteMode);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (isPaused || isVictory) return;

			// Arrow Navigation
			if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
				e.preventDefault();
				if (!selectedCell) {
					setSelectedCell(4, 4);
					return;
				}

				let { r, c } = selectedCell;
				if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
				if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
				if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
				if (e.key === 'ArrowRight') c = Math.min(8, c + 1);

				if (r !== selectedCell.r || c !== selectedCell.c) {
					setSelectedCell(r, c);
				}
				return;
			}

			// Number Input (1-9)
			if (/^[1-9]$/.test(e.key)) {
				e.preventDefault();
				onNumberInput(Number.parseInt(e.key, 10));
				return;
			}

			// Toggle Note Mode (N or Space)
			if (e.key.toLowerCase() === 'n' || e.key === ' ') {
				e.preventDefault();
				setNoteMode(!isNoteMode);
				return;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [isPaused, isVictory, selectedCell, isNoteMode, setSelectedCell, setNoteMode, onNumberInput]);
};
