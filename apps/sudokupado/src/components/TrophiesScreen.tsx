import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, Timer } from 'lucide-react';
import type React from 'react';
import { useCallback, useState } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';
import type { Difficulty } from '../types';
import Button from './Button';

const TrophiesScreen: React.FC = () => {
	const { setScreen, t, lastGameResult } = useGameStore();
	const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');
	const [showAll, setShowAll] = useState(false);

	// Use a callback ref to auto-scroll as soon as the element is rendered
	const highlightedCallbackRef = useCallback((node: HTMLElement | null) => {
		if (node) {
			node.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}, []);

	const fullHistory = useLiveQuery(async () => {
		const [results, players] = await Promise.all([db.history.toArray(), db.players.toArray()]);
		const playerMap = new Map(players.map((p) => [p.id, p.name]));

		return results
			.map((entry) => ({
				...entry,
				playerName: playerMap.get(entry.playerId) || 'Player',
			}))
			.filter((entry) => filterDifficulty === 'all' || entry.difficulty === filterDifficulty)
			.sort((a, b) => b.score - a.score || a.timeElapsed - b.timeElapsed);
	}, [filterDifficulty]);

	const history = showAll ? fullHistory : fullHistory?.slice(0, 50);

	const difficulties: Difficulty[] = ['beginner', 'intermediate', 'expert', 'master'];

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleDateString(undefined, {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	const recentGameIndex = fullHistory?.findIndex((h) => h.id === lastGameResult?.id);
	const isRecentInTop50 =
		recentGameIndex !== undefined && recentGameIndex >= 0 && recentGameIndex < 50;
	const shouldShowPinned =
		lastGameResult?.id &&
		!showAll &&
		!isRecentInTop50 &&
		recentGameIndex !== undefined &&
		recentGameIndex >= 50;
	const recentGameEntry = shouldShowPinned ? fullHistory?.[recentGameIndex] : null;

	const renderEntry = (entry: any, index: number, isPinned = false) => {
		const isHighlighted = entry.id === lastGameResult?.id;
		return (
			<article
				key={entry.id}
				ref={isHighlighted && !isPinned ? (highlightedCallbackRef as any) : null}
				className={`
					border rounded-DEFAULT p-4 flex flex-col gap-2 transition-all duration-500
					${isPinned ? 'bg-primary-fixed-dim border-primary-text shadow-xl' : isHighlighted ? 'bg-primary-fixed border-primary-text shadow-md scale-[1.02]' : 'bg-white border-border shadow-sm'}
				`}
			>
				<div className="flex justify-between items-start border-b border-border/50 pb-2">
					<div className="flex items-center gap-2">
						<span className="font-hanken text-xs font-bold text-secondary-fixed-variant">
							#{index + 1}
						</span>
						<span className="font-sans text-sm font-bold text-primary-text">
							{entry.playerName}
						</span>
						{isHighlighted && (
							<span className="bg-primary-text text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
								{t('trophies.recent') || 'RECIENTE'}
							</span>
						)}
					</div>
					<span className="font-sans text-xs text-secondary">{formatDate(entry.date)}</span>
				</div>
				<div className="flex justify-between items-end pt-1">
					<div className="flex items-center gap-3 text-secondary">
						<div className="flex items-center gap-1">
							<Timer className="w-3.5 h-3.5" />
							<span className="font-sans text-xs">{formatTime(entry.timeElapsed)}</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="font-sans text-xs font-bold text-error">{entry.mistakes}</span>
							<span className="font-sans text-[10px] uppercase">{t('game.mistakes')}</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="font-sans text-xs font-bold text-secondary">
								{entry.hintsUsed ?? 0}
							</span>
							<span className="font-sans text-[10px] uppercase">{t('game.hint')}</span>
						</div>
					</div>
					<div className="flex flex-col items-end">
						<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider leading-none mb-1">
							{t(`main_menu.difficulties.${entry.difficulty}`)}
						</span>
						<span className="font-hanken text-2xl font-bold text-primary-text leading-none">
							{entry.score} <span className="text-xs">{t('trophies.pts')}</span>
						</span>
					</div>
				</div>
			</article>
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: 20 }}
			className="flex flex-col h-full bg-white"
		>
			{/* Header */}
			<header className="sticky top-0 w-full z-50 bg-white border-b border-border flex justify-between items-center h-16 px-5">
				<button
					type="button"
					onClick={() => setScreen('main')}
					className="p-2 -ml-2 hover:bg-subtle-bg rounded-full transition-colors text-primary-text"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>
				<h1 className="font-hanken text-lg font-bold text-primary-text tracking-widest-premium uppercase">
					{t('trophies.title')}
				</h1>
				<div className="w-10" />
			</header>

			{/* Difficulty Filters */}
			<div className="sticky top-16 z-40 bg-white py-2 border-b border-border overflow-hidden">
				<div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-2">
					<button
						type="button"
						onClick={() => {
							setFilterDifficulty('all');
							setShowAll(false);
						}}
						className={`whitespace-nowrap px-4 py-2 rounded-full font-hanken text-[10px] font-bold tracking-wider uppercase border transition-colors ${
							filterDifficulty === 'all'
								? 'bg-primary-text text-white border-transparent'
								: 'bg-white text-primary-text border-border hover:bg-subtle-bg'
						}`}
					>
						{t('trophies.all')}
					</button>
					{difficulties.map((diff) => (
						<button
							type="button"
							key={diff}
							onClick={() => {
								setFilterDifficulty(diff);
								setShowAll(false);
							}}
							className={`whitespace-nowrap px-4 py-2 rounded-full font-hanken text-[10px] font-bold tracking-wider uppercase border transition-colors ${
								filterDifficulty === diff
									? 'bg-primary-text text-white border-transparent'
									: 'bg-white text-primary-text border-border hover:bg-subtle-bg'
							}`}
						>
							{t(`main_menu.difficulties.${diff}`)}
						</button>
					))}
				</div>
			</div>

			{/* History List */}
			<section className="flex-1 bg-subtle-bg px-5 py-4 flex flex-col gap-4 overflow-y-auto pb-32">
				{!history || history.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-secondary">
						<span className="font-hanken text-sm font-bold uppercase tracking-widest-premium">
							{t('trophies.no_victories')}
						</span>
						<p className="font-sans text-xs mt-2">{t('trophies.win_message')}</p>
					</div>
				) : (
					<>
						{history.map((entry, idx) => renderEntry(entry, idx))}

						{fullHistory && fullHistory.length > 50 && !showAll && (
							<div className="pt-4 pb-8 flex justify-center">
								<Button
									variant="secondary"
									size="sm"
									onClick={() => setShowAll(true)}
									className="gap-2"
								>
									<ChevronDown className="w-4 h-4" />
									{t('trophies.show_all') || 'VER TODO EL HISTÓRICO'}
								</Button>
							</div>
						)}
					</>
				)}
			</section>

			{/* Pinned Recent Entry if not in view */}
			{shouldShowPinned && recentGameEntry && (
				<div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white to-transparent z-50">
					<div className="mb-2 text-center">
						<span className="text-[10px] font-black text-secondary uppercase tracking-widest">
							...
						</span>
					</div>
					{renderEntry(recentGameEntry, recentGameIndex!, true)}
				</div>
			)}
		</motion.div>
	);
};

export default TrophiesScreen;
