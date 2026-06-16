import { BoardOverlay } from '@pwarush/core/ui';
import { exitAppFullscreen, formatDuration, requestAppFullscreen } from '@pwarush/core/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eraser, Lightbulb, Pause, Pencil, Play, RotateCcw, Trophy } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { db } from '../db/database';
import { clearSavedGame as clearSavedGameDb } from '../hooks/useAutoSave';
import { useGameHints } from '../hooks/useGameHints';
import { useGameKeyboard } from '../hooks/useGameKeyboard';
import { useGameStore } from '../store/gameStore';
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

	const {
		setScreen,
		setPaused,
		incrementTime,
		setNoteMode,
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

	const { requestHint, isHintDisabled } = useGameHints();
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

		requestWakeLock();
		requestAppFullscreen();

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
			exitAppFullscreen();
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

	useGameKeyboard(handleNumberInput);

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
			className="flex flex-col h-full bg-surface-container-lowest relative"
		>
			{/* TopAppBar */}
			<header className="w-full border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center px-5 h-16 z-10">
				<button
					type="button"
					onClick={() => setScreen('main')}
					className="p-2 hover:bg-surface-container rounded-full transition-colors text-secondary"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>
				<h1 className="font-hanken text-xl font-extrabold tracking-widest-premium text-on-surface uppercase">
					SUDOKUPADO
				</h1>
				<button
					type="button"
					data-testid="pause-toggle"
					onClick={() => setPaused(!isPaused)}
					className="p-2 hover:bg-surface-container rounded-full transition-colors text-secondary"
				>
					{isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
				</button>
			</header>

			{/* Main Game Container */}
			<main className="flex-1 flex flex-col px-5 pt-4 pb-24 overflow-y-auto">
				{/* Status Bar */}
				<div className="flex justify-between items-center bg-surface-container rounded-full px-4 py-2 mb-6 border border-outline-variant">
					<div className="flex flex-col items-start">
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('game.time')}
						</span>
						<span className="font-hanken text-lg font-bold text-on-surface">
							{formatDuration(timeElapsed)}
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
						<span className="font-hanken text-lg font-bold text-on-surface">
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
							<BoardOverlay interactive={false} className="z-50">
								<motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
									<motion.div
										animate={{
											rotateY: [0, 360],
											scale: [1, 1.2, 1],
										}}
										transition={{ duration: 1.5, repeat: Infinity }}
										className="bg-surface-container-lowest/90 backdrop-blur-lg p-8 rounded-3xl border-4 border-success shadow-2xl flex flex-col items-center gap-6"
									>
										<Trophy className="w-16 h-16 text-on-success-container" />
										<motion.h2
											initial={{ y: 20, opacity: 0 }}
											animate={{ y: 0, opacity: 1 }}
											transition={{ delay: 0.5 }}
											className="font-hanken text-3xl font-black text-on-success-container tracking-widest-premium"
										>
											{t('game.victory')}
										</motion.h2>
									</motion.div>
								</motion.div>
							</BoardOverlay>
						)}
					</AnimatePresence>
					{isPaused && !isVictory && (
						<button
							type="button"
							onClick={() => setPaused(false)}
							className="absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-xs z-30 flex flex-col items-center justify-center cursor-pointer"
						>
							<Play className="w-16 h-16 text-on-surface mb-4" />
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
						className="flex flex-col items-center justify-center py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface hover:bg-surface-container transition-all active:scale-95"
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
								? 'bg-primary text-on-primary shadow-md'
								: 'bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container'
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
						onClick={() => {
							vibrate(10);
							requestHint();
						}}
						disabled={isHintDisabled}
						aria-disabled={isHintDisabled}
						className="flex flex-col items-center justify-center py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface hover:bg-surface-container disabled:opacity-30 transition-all active:scale-95"
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
						className="flex flex-col items-center justify-center py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface hover:bg-surface-container transition-all active:scale-95"
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
									className={`border rounded-2xl h-14 flex items-center justify-center font-hanken text-2xl font-bold transition-all shadow-xs active:scale-95 ${
										completed
											? 'bg-transparent border-transparent text-outline-variant opacity-20'
											: 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container active:bg-outline-variant'
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
									className={`border rounded-2xl h-14 flex items-center justify-center font-hanken text-2xl font-bold transition-all shadow-xs active:scale-95 ${
										completed
											? 'bg-transparent border-transparent text-outline-variant opacity-20'
											: 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container active:bg-outline-variant'
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
						className="absolute bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t-2 border-primary p-6 pb-10 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.2)] rounded-t-3xl"
					>
						<div className="flex items-center gap-2 mb-3">
							<Lightbulb className="w-5 h-5 text-warning fill-warning" />
							<h3 className="font-hanken text-xs font-black text-on-surface uppercase tracking-widest-premium">
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
								className="flex-1 bg-primary text-on-primary py-4 rounded-xl font-hanken text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-md"
							>
								{t('hints.apply')}
							</button>
							<button
								type="button"
								onClick={() => {
									vibrate(10);
									clearHint();
								}}
								className="flex-1 border border-outline-variant text-secondary py-4 rounded-xl font-hanken text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
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
