import { Button } from '@pwarush/core/ui';
import { formatDuration } from '@pwarush/core/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { Home, Play, Trophy, User } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { db } from '../db/database';
import { useSudokuWorker } from '../hooks/useSudokuWorker';
import { useGameStore } from '../store/gameStore';
import { requestAppFullscreen } from '../utils/fullscreen';
import InstallModal from './InstallModal';

const ResultScreen: React.FC = () => {
	const {
		lastGameResult,
		setScreen,
		activePlayerId,
		deferredPrompt,
		t,
		initGame,
		selectedDifficulty,
	} = useGameStore();
	const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { generatePuzzle } = useSudokuWorker();

	const topScores = useLiveQuery(async () => {
		if (!lastGameResult) return [];
		return await db.history
			.where('difficulty')
			.equals(lastGameResult.difficulty)
			.reverse()
			.sortBy('score')
			.then((results) => results.slice(0, 5));
	}, [lastGameResult]);

	const historyCount = useLiveQuery(
		() => (activePlayerId ? db.history.where('playerId').equals(activePlayerId).count() : 0),
		[activePlayerId],
	);

	const activePlayer = useLiveQuery(
		() => (activePlayerId ? db.players.get(activePlayerId) : undefined),
		[activePlayerId],
	);

	useEffect(() => {
		if (historyCount === 1 && deferredPrompt) {
			setIsInstallModalOpen(true);
		}
	}, [historyCount, deferredPrompt]);

	if (!lastGameResult) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-8 text-center">
				<p className="text-secondary font-hanken mb-4 uppercase tracking-widest-premium">
					No game result found
				</p>
				<Button onClick={() => setScreen('main')}>Return Home</Button>
			</div>
		);
	}

	const handleNewGame = async () => {
		setIsLoading(true);
		try {
			const [, { initialGrid, solution }] = await Promise.all([
				requestAppFullscreen(),
				generatePuzzle(selectedDifficulty),
			]);
			initGame(initialGrid, solution, selectedDifficulty);
		} catch (error) {
			console.error('Failed to generate puzzle:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 1.1 }}
			className="flex flex-col h-full bg-surface-container-lowest overflow-hidden"
		>
			{/* Header Section */}
			<header className="flex flex-col items-center justify-center pt-12 pb-8 px-5 shrink-0">
				<div className="bg-surface-container p-6 rounded-full mb-4">
					<Trophy className="w-16 h-16 text-on-surface" />
				</div>
				<h1 className="font-hanken text-3xl font-extrabold text-on-surface text-center mb-2 tracking-widest-premium uppercase">
					{t('result.victory')}
				</h1>
				<p className="font-hanken text-xs font-bold text-secondary text-center uppercase tracking-wider">
					{t('result.difficulty')} {t(`main_menu.difficulties.${lastGameResult.difficulty}`)}
				</p>
			</header>

			{/* Main Content Area */}
			<main className="flex-1 overflow-y-auto px-5 pb-40 flex flex-col gap-6">
				{/* Score Summary Card */}
				<section className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 flex flex-col items-center justify-center gap-4 shadow-xs">
					<div className="grid grid-cols-3 w-full gap-4">
						<div className="flex flex-col items-center gap-1">
							<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
								{t('result.time')}
							</span>
							<span className="font-hanken text-lg font-bold text-on-surface">
								{formatDuration(lastGameResult.timeElapsed)}
							</span>
						</div>
						<div className="flex flex-col items-center gap-1">
							<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
								{t('game.mistakes')}
							</span>
							<span className="font-hanken text-lg font-bold text-on-surface">
								{lastGameResult.mistakes}
							</span>
						</div>
						<div className="flex flex-col items-center gap-1">
							<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
								{t('game.hint')}
							</span>
							<span className="font-hanken text-lg font-bold text-on-surface">
								{lastGameResult.hintsUsed}
							</span>
						</div>
					</div>
					<div className="w-full h-px bg-outline-variant"></div>
					<div className="flex flex-col items-center gap-1">
						<span className="font-hanken text-4xl font-extrabold text-on-surface">
							{lastGameResult.score}
						</span>
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
							{t('result.points')}
						</span>
					</div>
				</section>

				{/* Leaderboard */}
				<section className="flex flex-col gap-4">
					<h2 className="font-hanken text-lg font-bold text-on-surface text-center uppercase tracking-widest-premium">
						{t('result.top_5')} {t(`main_menu.difficulties.${lastGameResult.difficulty}`)}
					</h2>
					<div className="flex flex-col border border-outline-variant rounded bg-surface-container-lowest overflow-hidden shadow-xs">
						{topScores?.map((entry, index) => (
							<div
								key={entry.id}
								className={`flex items-center justify-between p-4 border-b border-outline-variant last:border-0 ${
									entry.score === lastGameResult.score &&
									entry.timeElapsed === lastGameResult.timeElapsed
										? 'bg-surface-container'
										: ''
								}`}
							>
								<div className="flex items-center gap-4">
									<span className="font-hanken text-lg font-bold text-secondary w-6 text-center">
										{index + 1}
									</span>
									<div className="flex items-center gap-2">
										<User className="w-4 h-4 text-secondary" />
										<span
											className={`font-sans text-base ${entry.score === lastGameResult.score ? 'font-bold text-on-surface' : 'text-secondary'}`}
										>
											{entry.playerId === activePlayerId ? activePlayer?.name : 'Player'}
										</span>
									</div>
								</div>
								<span className="font-hanken text-lg font-bold text-on-surface">{entry.score}</span>
							</div>
						))}
					</div>
				</section>
			</main>

			{/* Fixed Action Area */}
			<footer className="absolute bottom-0 w-full bg-surface-container-lowest border-t border-outline-variant p-5 flex flex-col gap-3 z-50">
				<Button
					variant="primary"
					size="lg"
					className="w-full gap-2"
					onClick={handleNewGame}
					disabled={isLoading}
					data-testid="result-new-game"
				>
					{isLoading ? (
						<div className="flex items-center justify-center gap-3">
							<svg
								className="w-5 h-5 animate-spin"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-labelledby="generating-title"
								role="img"
							>
								<title id="generating-title">{t('main_menu.generating_label')}</title>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							<span className="animate-pulse">{t('main_menu.generating_label')}</span>
						</div>
					) : (
						<>
							<Play className="w-5 h-5 fill-current" />
							{t('result.new_game')}
						</>
					)}
				</Button>
				<div className="grid grid-cols-2 gap-3">
					<Button
						variant="secondary"
						size="lg"
						className="w-full gap-2"
						onClick={() => setScreen('trophies')}
						data-testid="result-leaderboard"
					>
						<Trophy className="w-5 h-5" />
						{t('result.view_leaderboard') || 'CLASIFICACIÓN'}
					</Button>
					<Button
						variant="secondary"
						size="lg"
						className="w-full gap-2"
						onClick={() => setScreen('main')}
						data-testid="result-return-home"
					>
						<Home className="w-5 h-5" />
						{t('result.return_home')}
					</Button>
				</div>
			</footer>

			<InstallModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
		</motion.div>
	);
};

export default ResultScreen;
