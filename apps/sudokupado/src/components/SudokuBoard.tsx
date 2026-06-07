import type React from 'react';
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const SudokuBoard: React.FC = () => {
	const grid = useGameStore((s) => s.grid);
	const initialGrid = useGameStore((s) => s.initialGrid);
	const notes = useGameStore((s) => s.notes);
	const selectedCell = useGameStore((s) => s.selectedCell);
	const solution = useGameStore((s) => s.solution);
	const lastGameResult = useGameStore((s) => s.lastGameResult);
	const currentHint = useGameStore((s) => s.currentHint);
	const activeAnimations = useGameStore((s) => s.activeAnimations);
	const setSelectedCell = useGameStore((s) => s.setSelectedCell);
	const clearActiveAnimations = useGameStore((s) => s.clearActiveAnimations);

	useEffect(() => {
		const hasAnimation =
			activeAnimations.rows.length > 0 ||
			activeAnimations.cols.length > 0 ||
			activeAnimations.blocks.length > 0;
		if (!hasAnimation) return;
		const timeoutId = setTimeout(clearActiveAnimations, 1000);
		return () => clearTimeout(timeoutId);
	}, [activeAnimations, clearActiveAnimations]);

	const isSelected = (r: number, c: number) => selectedCell?.r === r && selectedCell?.c === c;
	const isHintCell = (r: number, c: number) => currentHint?.r === r && currentHint?.c === c;
	const isVictory = !!lastGameResult;

	const isAnimating = (r: number, c: number) => {
		const blockIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);
		return (
			activeAnimations.rows.includes(r) ||
			activeAnimations.cols.includes(c) ||
			activeAnimations.blocks.includes(blockIdx)
		);
	};

	const isSameGroup = (r: number, c: number) => {
		if (!selectedCell || isVictory) return false;
		if (selectedCell.r === r || selectedCell.c === c) return true;
		const blockR = Math.floor(r / 3);
		const blockC = Math.floor(c / 3);
		const selBlockR = Math.floor(selectedCell.r / 3);
		const selBlockC = Math.floor(selectedCell.c / 3);
		return blockR === selBlockR && blockC === selBlockC;
	};

	const isSameNumber = (r: number, c: number) => {
		if (!selectedCell || isVictory) return false;
		const selectedVal = grid[selectedCell.r][selectedCell.c];
		return selectedVal !== 0 && grid[r][c] === selectedVal;
	};

	return (
		<div
			className={`w-full aspect-square border-4 mb-6 relative select-none transition-all duration-1000 ${isVictory ? 'bg-success-container border-success' : 'bg-primary border-primary'}`}
		>
			<div
				className={`w-full h-full grid grid-cols-9 grid-rows-9 gap-px transition-colors duration-1000 ${isVictory ? 'bg-success/20' : 'bg-primary'}`}
			>
				{grid.map((row, r) =>
					row.map((val, c) => {
						const isInitial = initialGrid[r][c] !== 0;
						const cellNotes = notes[r][c];
						const isError = val !== 0 && !isInitial && val !== solution[r][c];

						return (
							<div
								key={`${r}-${c}`}
								onClick={() => !isVictory && setSelectedCell(r, c)}
								className={`
                  relative flex items-center justify-center font-hanken transition-colors
                  ${
										isVictory
											? 'bg-transparent'
											: isAnimating(r, c)
												? 'bg-tertiary-fixed border border-tertiary-fixed-dim shadow-[0_0_20px_rgba(252,222,181,0.6)] z-20 transition-all duration-300 scale-105'
												: isHintCell(r, c)
													? 'bg-warning-container animate-pulse'
													: isSelected(r, c)
														? 'bg-surface-container-high'
														: isSameNumber(r, c)
															? 'bg-info-container'
															: isSameGroup(r, c)
																? 'bg-surface-container'
																: 'bg-surface-container-lowest'
									}
                  ${isError ? 'animate-shake' : ''}
                  ${isVictory ? 'pointer-events-none' : 'cursor-pointer'}
                `}
								data-testid={`cell-${r}-${c}`}
							>
								{/* Visual indicator for selection - using a subtle border instead of full black background */}
								{isSelected(r, c) && !isVictory && (
									<div className="absolute inset-0 border-4 border-primary z-10 pointer-events-none" />
								)}

								{val !== 0 ? (
									<span
										className={`
                    text-4xl md:text-5xl lg:text-4xl transition-colors duration-1000
                    ${isVictory ? 'text-on-success-container font-bold' : isInitial ? 'text-on-surface font-black' : isError ? 'text-error font-bold' : 'text-on-surface-variant font-bold'}
                  `}
									>
										{val}
									</span>
								) : (
									<div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none">
										{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
											<div
												key={n}
												className="flex items-center justify-center text-[12px] md:text-base lg:text-[12px] font-sans font-bold text-secondary leading-none"
											>
												{!isVictory && cellNotes.includes(n) ? n : ''}
											</div>
										))}
									</div>
								)}
							</div>
						);
					}),
				)}
			</div>

			{/* 3x3 Block Overlays */}
			<div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
				<div
					className={`border-r-2 border-b-2 transition-colors duration-1000 ${isVictory ? 'border-success/50' : 'border-primary'}`}
				></div>
				<div
					className={`border-r-2 border-b-2 transition-colors duration-1000 ${isVictory ? 'border-success/50' : 'border-primary'}`}
				></div>
				<div
					className={`border-b-2 transition-colors duration-1000 ${isVictory ? 'border-success/50' : 'border-primary'}`}
				></div>
				<div
					className={`border-r-2 border-b-2 transition-colors duration-1000 ${isVictory ? 'border-success/50' : 'border-primary'}`}
				></div>
				<div
					className={`border-r-2 border-b-2 transition-colors duration-1000 ${isVictory ? 'border-success/50' : 'border-primary'}`}
				></div>
				<div
					className={`border-b-2 transition-colors duration-1000 ${isVictory ? 'border-success/50' : 'border-primary'}`}
				></div>
				<div
					className={`border-r-2 transition-colors duration-1000 ${isVictory ? 'border-success/50' : 'border-primary'}`}
				></div>
				<div
					className={`border-r-2 transition-colors duration-1000 ${isVictory ? 'border-success/50' : 'border-primary'}`}
				></div>
				<div></div>
			</div>
		</div>
	);
};

export default SudokuBoard;
