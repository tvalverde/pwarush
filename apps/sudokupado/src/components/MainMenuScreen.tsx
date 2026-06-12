import { Button } from '@pwarush/core/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { LayoutGrid, Play, PlayCircle, Settings, User } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { db } from '../db/database';
import { useSudokuWorker } from '../hooks/useSudokuWorker';
import { useGameStore } from '../store/gameStore';
import type { Difficulty } from '../types';
import PlayerMenu from './PlayerMenu';
import SettingsMenu from './SettingsMenu';

const MainMenuScreen: React.FC = () => {
	const {
		selectedDifficulty,
		setDifficulty,
		activePlayerId,
		setActivePlayer,
		initGame,
		resumeGame,
		t,
		showDialog,
		allowNotes,
		setAllowNotes,
		maxMistakes,
		setMaxMistakes,
		maxHints,
		setMaxHints,
	} = useGameStore();

	const [isPlayerMenuOpen, setIsPlayerMenuOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const { generatePuzzle } = useSudokuWorker();

	// Session Integrity Validator: Ensure the activePlayerId still exists in DB
	useEffect(() => {
		if (activePlayerId !== null) {
			db.players.get(activePlayerId).then((player) => {
				if (!player || player.isDeleted === 1) {
					// Player was deleted or database was cleared.
					// Reset the session to Guest.
					setActivePlayer(null);
				}
			});
		}
	}, [activePlayerId, setActivePlayer]);

	const activePlayer = useLiveQuery(
		() => (activePlayerId ? db.players.get(activePlayerId) : undefined),
		[activePlayerId],
	);

	const savedGame = useLiveQuery(
		() =>
			db.gameState
				.where('playerId')
				.equals(activePlayerId ?? 0)
				.first(),
		[activePlayerId],
	);

	const startNewGameLogic = async () => {
		setIsLoading(true);
		try {
			const { initialGrid, solution } = await generatePuzzle(selectedDifficulty);
			initGame(initialGrid, solution, selectedDifficulty);
		} catch (error) {
			console.error('Failed to generate puzzle:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleStartGame = async () => {
		if (savedGame) {
			showDialog({
				title: t('game.paused'),
				message: t('main_menu.resume_prompt_msg'),
				confirmText: t('main_menu.resume_prompt_confirm'),
				cancelText: t('main_menu.resume_prompt_cancel'),
				onConfirm: () => resumeGame(savedGame),
				onCancel: startNewGameLogic,
				type: 'info',
			});
			return;
		}

		await startNewGameLogic();
	};

	const handleResumeGame = () => {
		if (savedGame) {
			resumeGame(savedGame);
		}
	};

	const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];

	return (
		<div className="flex flex-col h-full">
			{/* TopAppBar */}
			<header className="w-full border-b border-outline-variant bg-surface-container-lowest flex justify-between items-center px-5 h-16 z-10">
				<button
					type="button"
					data-testid="open-player-menu"
					onClick={() => setIsPlayerMenuOpen(true)}
					className="p-2 hover:bg-surface-container rounded-full transition-colors"
				>
					<User className="w-6 h-6 text-secondary" />
				</button>
				<h1 className="font-hanken text-xl font-extrabold tracking-widest-premium text-on-surface uppercase">
					SUDOKUPADO
				</h1>
				<button
					type="button"
					data-testid="open-settings"
					onClick={() => setIsSettingsOpen(true)}
					className="p-2 hover:bg-surface-container rounded-full transition-colors"
				>
					<Settings className="w-6 h-6 text-secondary" />
				</button>
			</header>

			{/* Main Content Body */}
			<main className="flex-1 px-5 py-8 flex flex-col gap-8 overflow-y-auto pb-48">
				{/* Greeting */}
				<div className="text-center">
					<p className="font-sans text-lg text-secondary">{t('main_menu.greeting')}</p>
					<h2 className="font-hanken text-xl font-bold text-on-surface mt-1">
						{activePlayer?.name || t('main_menu.guest')}
					</h2>
				</div>

				{/* Resume Game Card */}
				{savedGame && (
					<div className="bg-surface-container p-4 rounded-DEFAULT border border-outline-variant flex items-center justify-between shadow-xs">
						<div className="flex flex-col">
							<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
								{t('main_menu.saved_game')}
							</span>
							<span className="font-hanken text-sm font-bold text-on-surface uppercase">
								{t(`main_menu.difficulties.${savedGame.difficulty}`)}
							</span>
						</div>
						<Button
							variant="primary"
							size="sm"
							onClick={handleResumeGame}
							className="gap-2"
							data-testid="resume-saved-game"
						>
							<PlayCircle className="w-4 h-4" />
							{t('game.resume').toUpperCase()}
						</Button>
					</div>
				)}

				{/* Difficulty Selector */}
				<section className="space-y-4">
					<h3 className="font-hanken text-xs font-bold text-secondary text-center tracking-widest-premium uppercase">
						{t('main_menu.difficulty_label')}
					</h3>
					<div className="grid grid-cols-2 gap-3">
						{difficulties.map((diff) => (
							<button
								type="button"
								key={diff}
								data-testid={`difficulty-${diff}`}
								disabled={isLoading}
								onClick={() => setDifficulty(diff)}
								className={`w-full py-4 px-4 rounded-full font-sans text-base transition-colors border ${
									selectedDifficulty === diff
										? 'bg-primary text-on-primary border-transparent shadow-xs'
										: 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container'
								}`}
							>
								{t(`main_menu.difficulties.${diff}`)}
							</button>
						))}
					</div>
				</section>

				<hr className="border-outline-variant" />

				{/* Notes Toggle */}
				<section className="flex items-center justify-between py-2">
					<div className="flex items-center gap-3">
						<LayoutGrid className="w-5 h-5 text-secondary" />
						<span className="font-sans text-lg text-on-surface">{t('main_menu.notes_label')}</span>
					</div>
					<button
						type="button"
						onClick={() => setAllowNotes(!allowNotes)}
						className={`w-14 h-8 rounded-full relative cursor-pointer transition-all flex items-center p-1 ${
							allowNotes ? 'bg-primary' : 'bg-surface-container-high'
						}`}
					>
						<div
							className={`w-6 h-6 bg-surface-container-lowest rounded-full shadow-xs transition-transform duration-200 ${allowNotes ? 'translate-x-6' : 'translate-x-0'}`}
						/>
					</button>
				</section>

				{/* Mistakes Limit */}
				<section className="space-y-4">
					<h3 className="font-hanken text-xs font-bold text-secondary text-center tracking-widest-premium uppercase">
						{t('main_menu.mistakes_label')}
					</h3>
					<div className="flex justify-center gap-4">
						{[0, 3, 5, -1].map((limit) => (
							<button
								type="button"
								key={limit}
								data-testid={`max-mistakes-${limit}`}
								disabled={isLoading}
								onClick={() => setMaxMistakes(limit)}
								className={`w-16 h-16 rounded-full font-hanken text-xl flex items-center justify-center transition-all border ${
									maxMistakes === limit
										? 'bg-primary text-on-primary border-transparent shadow-md'
										: 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container'
								}`}
							>
								{limit === -1 ? '∞' : limit}
							</button>
						))}
					</div>
				</section>

				{/* Hints Limit */}
				<section className="space-y-4">
					<h3 className="font-hanken text-xs font-bold text-secondary text-center tracking-widest-premium uppercase">
						{t('main_menu.hints_label')}
					</h3>
					<div className="flex justify-center gap-6">
						{[0, 3, 5].map((limit) => (
							<button
								type="button"
								key={limit}
								data-testid={`max-hints-${limit}`}
								disabled={isLoading}
								onClick={() => setMaxHints(limit)}
								className={`w-16 h-16 rounded-full font-hanken text-xl flex items-center justify-center transition-all border ${
									maxHints === limit
										? 'bg-primary text-on-primary border-transparent shadow-md'
										: 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container'
								}`}
							>
								{limit}
							</button>
						))}
					</div>
				</section>
			</main>

			{/* Fixed Action Area - Positioned above BottomNavBar */}
			<div className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] w-full p-5 bg-surface-container-lowest border-t border-outline-variant z-20">
				<Button
					variant="primary"
					size="xl"
					className="w-full uppercase shadow-lg"
					disabled={isLoading}
					onClick={handleStartGame}
					data-testid="start-game-button"
				>
					{isLoading ? (
						<div className="flex items-center justify-center gap-3">
							<svg
								className="w-6 h-6 animate-spin"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-labelledby="generating-title"
								role="img"
							>
								<title id="generating-title">Generating Puzzle</title>
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
							<span className="text-sm tracking-widest-premium">
								{t('main_menu.generating_label')}
							</span>
						</div>
					) : activePlayerId ? (
						<div className="flex items-center justify-center gap-3">
							<Play className="w-6 h-6 fill-current" />
							<span>{t('main_menu.play_button').toUpperCase()}</span>
						</div>
					) : (
						<div className="flex items-center justify-center gap-3">
							<Play className="w-6 h-6 fill-current" />
							<span>{t('main_menu.play_guest').toUpperCase()}</span>
						</div>
					)}
				</Button>
			</div>

			<PlayerMenu isOpen={isPlayerMenuOpen} onClose={() => setIsPlayerMenuOpen(false)} />

			<SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
		</div>
	);
};

export default MainMenuScreen;
