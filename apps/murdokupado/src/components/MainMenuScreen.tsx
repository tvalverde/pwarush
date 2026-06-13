import { Button } from '@pwarush/core/ui';
import { requestAppFullscreen } from '@pwarush/core/utils';
import { Play, PlayCircle } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { db } from '../db/database';
import { useMurdokuWorker } from '../hooks/useMurdokuWorker';
import { useGameStore } from '../store/gameStore';
import type { Difficulty, GameSnapshot } from '../types';

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];

// Preload the game chunk during the Play gesture so navigation never falls back
// to a Suspense placeholder while the menu is still on screen.
const preloadGameScreen = () => import('./GameScreen').catch(() => {});

const MainMenuScreen: React.FC = () => {
	const selectedDifficulty = useGameStore((s) => s.selectedDifficulty);
	const setDifficulty = useGameStore((s) => s.setDifficulty);
	const initGame = useGameStore((s) => s.initGame);
	const resumeGame = useGameStore((s) => s.resumeGame);
	const showDialog = useGameStore((s) => s.showDialog);
	const t = useGameStore((s) => s.t);

	const [savedGame, setSavedGame] = useState<GameSnapshot | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { generate } = useMurdokuWorker();

	useEffect(() => {
		let cancelled = false;
		db.gameState
			.where('playerId')
			.equals(0)
			.first()
			.then((saved) => {
				if (!cancelled) setSavedGame(saved ?? null);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	// Fullscreen + chunk preload + generation run together while the menu is still
	// painted (with its loading label), so entering the game never flashes a black
	// fullscreen-transition frame nor a Suspense fallback on the destination screen.
	const startNewGame = async () => {
		setIsLoading(true);
		try {
			const [, , { case: generated }] = await Promise.all([
				requestAppFullscreen(),
				preloadGameScreen(),
				generate(selectedDifficulty),
			]);
			initGame(generated);
		} catch (error) {
			console.error('Failed to generate case:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const resumeSavedGame = async (saved: GameSnapshot) => {
		await Promise.all([requestAppFullscreen(), preloadGameScreen()]);
		resumeGame(saved);
	};

	const handlePlay = () => {
		if (savedGame) {
			showDialog({
				title: t('game.paused'),
				message: t('main_menu.resume_prompt_msg'),
				confirmText: t('main_menu.resume_prompt_confirm'),
				cancelText: t('main_menu.resume_prompt_cancel'),
				type: 'info',
				onConfirm: () => resumeSavedGame(savedGame),
				onCancel: startNewGame,
			});
			return;
		}
		void startNewGame();
	};

	return (
		<div className="flex h-full flex-col">
			<header className="flex h-16 w-full items-center justify-center border-b border-outline-variant bg-surface-container-lowest px-5">
				<h1 className="font-hanken text-xl font-extrabold uppercase tracking-widest-premium text-on-surface">
					{t('main_menu.title')}
				</h1>
			</header>

			<main className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 py-8 pb-40">
				<div className="text-center">
					<p className="font-sans text-lg text-secondary">{t('main_menu.greeting')}</p>
					<h2 className="mt-1 font-hanken text-xl font-bold text-on-surface">
						{t('main_menu.guest')}
					</h2>
				</div>

				{savedGame && (
					<div className="flex items-center justify-between rounded-DEFAULT border border-outline-variant bg-surface-container p-4 shadow-xs">
						<div className="flex flex-col">
							<span className="font-hanken text-[10px] font-bold uppercase tracking-wider text-secondary">
								{t('main_menu.saved_game')}
							</span>
							<span className="font-hanken text-sm font-bold uppercase text-on-surface">
								{t(`main_menu.difficulties.${savedGame.difficulty}`)}
							</span>
						</div>
						<Button
							variant="primary"
							size="sm"
							className="gap-2"
							data-testid="resume-saved-game"
							onClick={() => resumeSavedGame(savedGame)}
						>
							<PlayCircle className="h-4 w-4" />
							{t('main_menu.resume_prompt_confirm')}
						</Button>
					</div>
				)}

				<section className="space-y-4">
					<h3 className="text-center font-hanken text-xs font-bold uppercase tracking-widest-premium text-secondary">
						{t('main_menu.difficulty_label')}
					</h3>
					<div className="grid grid-cols-2 gap-3">
						{DIFFICULTIES.map((diff) => (
							<button
								type="button"
								key={diff}
								data-testid={`difficulty-${diff}`}
								disabled={isLoading}
								onClick={() => setDifficulty(diff)}
								className={`w-full rounded-full border px-4 py-4 font-sans text-base transition-colors ${
									selectedDifficulty === diff
										? 'border-transparent bg-primary text-on-primary shadow-xs'
										: 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container'
								}`}
							>
								{t(`main_menu.difficulties.${diff}`)}
							</button>
						))}
					</div>
				</section>
			</main>

			<div className="absolute bottom-0 w-full border-t border-outline-variant bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
				<Button
					variant="primary"
					size="xl"
					className="w-full uppercase shadow-lg"
					disabled={isLoading}
					onClick={handlePlay}
					data-testid="start-game-button"
				>
					<div className="flex items-center justify-center gap-3">
						<Play className="h-6 w-6 fill-current" />
						<span>{isLoading ? t('main_menu.generating_label') : t('main_menu.play_button')}</span>
					</div>
				</Button>
			</div>
		</div>
	);
};

export default MainMenuScreen;
