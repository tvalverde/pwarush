import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eraser, Lightbulb, Pause, Pencil, Play, RotateCcw, Trophy } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { db } from '../db/database';
import { clearSavedGame as clearSavedGameDb } from '../hooks/useAutoSave';
import { useSudokuWorker } from '../hooks/useSudokuWorker';
import { useGameStore } from '../store/gameStore';
import { isIOS } from '../utils/device';
import { isMistakeLimitReached } from '../utils/gameState';
import { calculateScore } from '../utils/scoring';
import SudokuBoard from './SudokuBoard';

const GameScreen: React.FC = () => {
	const selectedDifficulty = useGameStore((s) => s.selectedDifficulty);
	const timeElapsed = useGameStore((s) => s.timeElapsed);
	const mistakes = useGameStore((s) => s.mistakes);
	const isPaused = useGameStore((s) => s.isPaused);
	const isNoteMode = useGameStore((s) => s.isNoteMode);
	const hintsUsed = useGameStore((s) => s.hintsUsed);
	const selectedCell = useGameStore((s) => s.selectedCell);
	const activePlayerId = useGameStore((s) => s.activePlayerId);
	const lastGameResult = useGameStore((s) => s.lastGameResult);
	const maxMistakes = useGameStore((s) => s.maxMistakes);
	const maxHints = useGameStore((s) => s.maxHints);
	const currentHint = useGameStore((s) => s.currentHint);
	const grid = useGameStore((s) => s.grid);
	const solution = useGameStore((s) => s.solution);
	const initialGrid = useGameStore((s) => s.initialGrid);

	const {
		setScreen,
		setPaused,
		incrementTime,
		setNoteMode,
		useHint: triggerHint,
		setSelectedCell,
		setCellValue,
		toggleNote,
		setLastGameResult,
		t,
		isNumberCompleted,
		restartGame,
		showDialog,
		eraseCell,
		applyHint,
		clearHint,
	} = useGameStore(
		useShallow((s) => ({
			setScreen: s.setScreen,
			setPaused: s.setPaused,
			incrementTime: s.incrementTime,
			setNoteMode: s.setNoteMode,
			useHint: s.useHint,
			setSelectedCell: s.setSelectedCell,
			setCellValue: s.setCellValue,
			toggleNote: s.toggleNote,
			setLastGameResult: s.setLastGameResult,
			t: s.t,
			isNumberCompleted: s.isNumberCompleted,
			restartGame: s.restartGame,
			showDialog: s.showDialog,
			eraseCell: s.eraseCell,
			applyHint: s.applyHint,
			clearHint: s.clearHint,
		})),
	);

	const { getHint } = useSudokuWorker();
	const wakeLockRef = useRef<WakeLockSentinel | null>(null);
	const isMountedRef = useRef(true);
	const victoryTimeoutRef = useRef<any>(null);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
			if (victoryTimeoutRef.current) clearTimeout(victoryTimeoutRef.current);
		};
	}, []);

	const isVictory = !!lastGameResult;

	const vibrate = useCallback((pattern: number | number[]) => {
		if (navigator.vibrate) navigator.vibrate(pattern);
	}, []);

	// Native APIs: Wake Lock & Fullscreen & Back Button
	useEffect(() => {
		const requestWakeLock = async () => {
			try {
				if ('wakeLock' in navigator) {
					wakeLockRef.current = await navigator.wakeLock.request('screen');
				}
			} catch (err) {
				const error = err as Error;
				console.error(`${error.name}, ${error.message}`);
			}
		};

		const enterFullscreen = async () => {
			if (isIOS()) return;
			try {
				if (document.documentElement.requestFullscreen) {
					await document.documentElement.requestFullscreen();
				}
			} catch (_err) {}
		};

		requestWakeLock();
		enterFullscreen();

		const handlePopState = () => {
			setPaused(true);
			window.history.pushState(null, '', window.location.pathname);
		};

		window.history.pushState(null, '', window.location.pathname);
		window.addEventListener('popstate', handlePopState);

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				setPaused(true);
			} else {
				requestWakeLock();
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			wakeLockRef.current?.release();
			if (document.fullscreenElement) {
				document.exitFullscreen().catch(() => {});
			}
			window.removeEventListener('popstate', handlePopState);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [setPaused]);

	// Timer logic
	useEffect(() => {
		const timer = setInterval(() => {
			if (!isPaused && !isVictory) incrementTime();
		}, 1000);
		return () => clearInterval(timer);
	}, [isPaused, incrementTime, isVictory]);

	const handleNumberInput = useCallback(
		async (num: number) => {
			if (isPaused || isVictory || !selectedCell) return;
			const { r, c } = selectedCell;

			if (isNoteMode) {
				toggleNote(r, c, num);
			} else {
				const { isCorrect, isFinished, isCellOccupied } = setCellValue(r, c, num);

				if (isCellOccupied) {
					vibrate([100, 50, 100]);
					return;
				}

				if (!isCorrect) {
					vibrate([100, 50, 100]);

					if (isMistakeLimitReached(mistakes + 1, maxMistakes)) {
						setPaused(true);
						showDialog({
							title: t('game.game_over_title'),
							message: t('game.game_over_msg'),
							type: 'danger',
							confirmText: t('game.game_over_restart'),
							cancelText: t('game.game_over_home'),
							onConfirm: restartGame,
							onCancel: async () => {
								await clearSavedGameDb();
								setScreen('main');
							},
						});
						return;
					}
				}

				if (isFinished) {
					vibrate([200, 100, 200]);
					const finalScore = calculateScore(selectedDifficulty, timeElapsed, mistakes, hintsUsed);
					let historyId: number | undefined;

					if (activePlayerId) {
						historyId = (await db.history.add({
							playerId: activePlayerId,
							difficulty: selectedDifficulty,
							score: finalScore,
							timeElapsed,
							mistakes,
							hintsUsed,
							date: Date.now(),
						})) as number;
					}

					await clearSavedGameDb();

					setLastGameResult({
						id: historyId,
						score: finalScore,
						timeElapsed,
						difficulty: selectedDifficulty,
						mistakes,
						hintsUsed,
					});

					victoryTimeoutRef.current = setTimeout(() => {
						if (isMountedRef.current) {
							setScreen('result');
						}
					}, 3000);
				}
			}
		},
		[
			isPaused,
			isVictory,
			selectedCell,
			isNoteMode,
			toggleNote,
			setCellValue,
			timeElapsed,
			selectedDifficulty,
			mistakes,
			activePlayerId,
			setLastGameResult,
			setScreen,
			maxMistakes,
			setPaused,
			showDialog,
			restartGame,
			t,
			hintsUsed,
			vibrate,
		],
	);

	// Keyboard Navigation and Shortcuts
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
				handleNumberInput(Number.parseInt(e.key, 10));
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
	}, [
		isPaused,
		isVictory,
		selectedCell,
		isNoteMode,
		setSelectedCell,
		setNoteMode,
		handleNumberInput,
	]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	const handleRestartClick = () => {
		vibrate(10);
		showDialog({
			title: 'Restart Puzzle',
			message: 'Are you sure you want to clear your progress and start this puzzle over?',
			onConfirm: restartGame,
			confirmText: 'RESTART',
			cancelText: 'CONTINUE PLAYING',
			type: 'info',
		});
	};

	const handleErase = () => {
		vibrate(10);
		if (selectedCell) {
			eraseCell(selectedCell.r, selectedCell.c);
		}
	};

	const handleNumberClick = (num: number) => {
		vibrate(10);
		handleNumberInput(num);
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			className="flex flex-col h-full bg-white relative"
		>
			{/* TopAppBar */}
			<header className="w-full border-b border-border bg-white flex justify-between items-center px-5 h-16 z-10">
				<button
					type="button"
					onClick={() => setScreen('main')}
					className="p-2 hover:bg-subtle-bg rounded-full transition-colors text-secondary"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>
				<h1 className="font-hanken text-xl font-extrabold tracking-widest-premium text-primary-text uppercase">
					SUDOKUPADO
				</h1>
				<button
					type="button"
					data-testid="pause-toggle"
					onClick={() => setPaused(!isPaused)}
					className="p-2 hover:bg-subtle-bg rounded-full transition-colors text-secondary"
				>
					{isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
				</button>
			</header>

			{/* Main Game Container */}
			<main className="flex-1 flex flex-col px-5 pt-4 pb-24 overflow-y-auto">
				{/* Status Bar */}
				<div className="flex justify-between items-center bg-subtle-bg rounded-full px-4 py-2 mb-6 border border-border">
					<div className="flex flex-col items-start">
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('game.time')}
						</span>
						<span className="font-hanken text-lg font-bold text-primary-text">
							{formatTime(timeElapsed)}
						</span>
					</div>
					<div className="flex flex-col items-center">
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('game.level')}
						</span>
						<span className="font-hanken text-lg font-bold text-error uppercase">
							{t(`main_menu.difficulties.${selectedDifficulty}`)}
						</span>
					</div>
					<div className="flex flex-col items-end">
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('game.mistakes')}
						</span>
						<span className="font-hanken text-lg font-bold text-primary-text">
							{maxMistakes === 0
								? t('game.no_mistakes_allowed')
								: maxMistakes === -1
									? `${mistakes}/∞`
									: `${mistakes}/${maxMistakes}`}
						</span>
					</div>
				</div>

				{/* Sudoku Grid */}
				<div className="relative">
					<SudokuBoard />
					<AnimatePresence>
						{isVictory && (
							<motion.div
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{ opacity: 1, scale: 1 }}
								className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
							>
								<motion.div
									animate={{
										rotateY: [0, 360],
										scale: [1, 1.2, 1],
									}}
									transition={{ duration: 1.5, repeat: Infinity }}
									className="bg-white/90 backdrop-blur-lg p-8 rounded-3xl border-4 border-green-500 shadow-2xl flex flex-col items-center gap-6"
								>
									<Trophy className="w-16 h-16 text-green-600" />
									<motion.h2
										initial={{ y: 20, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 0.5 }}
										className="font-hanken text-3xl font-black text-green-700 tracking-widest-premium"
									>
										{t('game.victory')}
									</motion.h2>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
					{isPaused && !isVictory && (
						<button
							type="button"
							onClick={() => setPaused(false)}
							className="absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center cursor-pointer"
						>
							<Play className="w-16 h-16 text-primary-text mb-4" />
							<span className="font-hanken text-xl font-bold uppercase tracking-widest-premium">
								{t('game.paused')}
							</span>
							<p className="text-secondary text-sm mt-2">{t('game.resume')}</p>
						</button>
					)}
				</div>

				{/* Action Bar */}
				<div
					className={`grid grid-cols-4 gap-2 mb-6 transition-opacity ${isVictory ? 'pointer-events-none opacity-20' : ''}`}
				>
					<button
						type="button"
						data-testid="action-erase"
						onClick={handleErase}
						className="flex flex-col items-center justify-center py-3 bg-white border border-border rounded-xl text-primary-text hover:bg-subtle-bg transition-all active:scale-95"
					>
						<Eraser className="w-5 h-5 mb-1" />
						<span className="font-hanken text-[10px] font-bold tracking-wider uppercase">
							{t('game.erase')}
						</span>
					</button>
					<button
						type="button"
						data-testid="action-notes"
						onClick={() => {
							vibrate(10);
							setNoteMode(!isNoteMode);
						}}
						className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95 ${
							isNoteMode
								? 'bg-primary-text text-white shadow-md'
								: 'bg-white border border-border text-primary-text hover:bg-subtle-bg'
						}`}
					>
						<Pencil className={`w-5 h-5 mb-1 ${isNoteMode ? 'fill-current' : ''}`} />
						<span className="font-hanken text-[10px] font-bold tracking-wider uppercase">
							{t('game.notes')}
						</span>
					</button>
					<button
						type="button"
						data-testid="action-hint"
						onClick={async () => {
							vibrate(10);
							if (maxHints <= 0 || hintsUsed >= maxHints || currentHint) return;

							const cleanGrid = grid.map((row, ri) =>
								row.map((cellVal, ci) =>
									cellVal !== 0 && initialGrid[ri][ci] === 0 && cellVal !== solution[ri][ci]
										? 0
										: cellVal,
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
						}}
						disabled={maxHints <= 0 || hintsUsed >= maxHints}
						aria-disabled={maxHints <= 0 || hintsUsed >= maxHints}
						className="flex flex-col items-center justify-center py-3 bg-white border border-border rounded-xl text-primary-text hover:bg-subtle-bg disabled:opacity-30 transition-all active:scale-95"
					>
						<Lightbulb className="w-5 h-5 mb-1" />
						<span className="font-hanken text-[10px] font-bold tracking-wider uppercase">
							{maxHints <= 0
								? t('game.no_hints_allowed')
								: `${t('game.hint')} (${hintsUsed}/${maxHints})`}
						</span>
					</button>
					<button
						type="button"
						data-testid="action-restart"
						onClick={handleRestartClick}
						className="flex flex-col items-center justify-center py-3 bg-white border border-border rounded-xl text-primary-text hover:bg-subtle-bg transition-all active:scale-95"
					>
						<RotateCcw className="w-5 h-5 mb-1" />
						<span className="font-hanken text-[10px] font-bold tracking-wider uppercase">
							{t('game.restart')}
						</span>
					</button>
				</div>

				{/* Keypad */}
				<div
					className={`mt-auto transition-opacity ${isVictory ? 'pointer-events-none opacity-20' : ''}`}
				>
					<div className="grid grid-cols-5 gap-2 mb-2">
						{[1, 2, 3, 4, 5].map((num) => {
							const completed = isNumberCompleted(num);
							return (
								<button
									type="button"
									key={num}
									disabled={completed}
									onClick={() => handleNumberClick(num)}
									className={`border rounded-2xl h-14 flex items-center justify-center font-hanken text-2xl font-bold transition-all shadow-sm active:scale-95 ${
										completed
											? 'bg-transparent border-transparent text-slate-300 opacity-20'
											: 'bg-white border-border text-primary-text hover:bg-subtle-bg active:bg-border'
									}`}
								>
									{num}
								</button>
							);
						})}
					</div>
					<div className="grid grid-cols-4 gap-2 px-4">
						{[6, 7, 8, 9].map((num) => {
							const completed = isNumberCompleted(num);
							return (
								<button
									type="button"
									key={num}
									disabled={completed}
									onClick={() => handleNumberClick(num)}
									className={`border rounded-2xl h-14 flex items-center justify-center font-hanken text-2xl font-bold transition-all shadow-sm active:scale-95 ${
										completed
											? 'bg-transparent border-transparent text-slate-300 opacity-20'
											: 'bg-white border-border text-primary-text hover:bg-subtle-bg active:bg-border'
									}`}
								>
									{num}
								</button>
							);
						})}
					</div>
				</div>
			</main>

			<AnimatePresence>
				{currentHint && (
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 50 }}
						className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-primary-text p-6 pb-10 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.2)] rounded-t-3xl"
					>
						<div className="flex items-center gap-2 mb-3">
							<Lightbulb className="w-5 h-5 text-yellow-500 fill-yellow-500" />
							<h3 className="font-hanken text-xs font-black text-primary-text uppercase tracking-widest-premium">
								{t('hints.title')}
							</h3>
						</div>
						<p className="font-sans text-sm text-secondary leading-relaxed">
							{t(`hints.${currentHint.type}`)}
						</p>
						<p className="font-sans text-xs text-secondary/70 leading-relaxed mb-6 mt-2">
							{t(`hints.${currentHint.type}_why`)}
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => {
									vibrate(10);
									applyHint();
								}}
								className="flex-1 bg-primary-text text-white py-4 rounded-xl font-hanken text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-md"
							>
								{t('hints.apply')}
							</button>
							<button
								type="button"
								onClick={() => {
									vibrate(10);
									clearHint();
								}}
								className="flex-1 border border-border text-secondary py-4 rounded-xl font-hanken text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
							>
								{t('hints.close')}
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
};

export default GameScreen;
