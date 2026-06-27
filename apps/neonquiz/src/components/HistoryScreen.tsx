import { Button } from '@pwarush/core/ui';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { clearGameHistory, getGameHistory } from '../db/gameHistory';
import { useTap } from '../hooks/useHaptics';
import { useGameStore } from '../store/gameStore';
import type { GameHistoryEntry, MatchPlayerStat } from '../types';
import ShapeGlyph from './board/ShapeGlyph';

interface HistoryScreenProps {
	onClose: () => void;
}

const pad = (value: number): string => value.toString().padStart(2, '0');

/** Formats a duration in milliseconds as HH:MM:SS. */
const formatDuration = (durationMs: number): string => {
	const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/** Accuracy percentage from correct/wrong tallies; null when there is nothing to divide. */
const accuracyOf = (correct: number, wrong: number): number | null => {
	const total = correct + wrong;
	return total > 0 ? Math.round((correct / total) * 100) : null;
};

const RosterRow: React.FC<{ stat: MatchPlayerStat; winnerLabel: string; isArcade: boolean }> = ({
	stat,
	winnerLabel,
	isArcade,
}) => {
	const accuracy = accuracyOf(stat.correct, stat.wrong);
	return (
		<div
			data-testid="history-roster-row"
			className="flex items-center justify-between gap-2 rounded-md bg-surface-container px-2.5 py-1.5"
		>
			<span className="flex items-center gap-2">
				<ShapeGlyph shape={stat.shape} size={16} color={stat.color} />
				<span className="font-hanken text-xs font-bold text-on-surface">{stat.name}</span>
				{!isArcade && stat.winner && (
					<span className="font-hanken text-[9px] uppercase tracking-wide-premium text-tertiary">
						{winnerLabel}
					</span>
				)}
			</span>
			<span className="font-sans text-[11px] text-on-surface-variant">
				{isArcade ? (
					<>
						<span className="font-bold text-primary">{stat.arcadeScore ?? 0}</span> pts · max{' '}
						<span className="text-tertiary">×{stat.arcadeMaxCombo ?? 0}</span>
					</>
				) : (
					<>
						{stat.sparks} ⚡ {accuracy !== null ? `· ${accuracy}%` : ''}
					</>
				)}
			</span>
		</div>
	);
};

/** Hall of Fame: the list of finished games, most recent first. */
const HistoryScreen: React.FC<HistoryScreenProps> = ({ onClose }) => {
	const t = useGameStore((s) => s.t);
	const language = useGameStore((s) => s.language);
	const tap = useTap();
	const [entries, setEntries] = useState<GameHistoryEntry[] | null>(null);
	const [activeTab, setActiveTab] = useState<'FAMILY' | 'ARCADE'>('FAMILY');
	const [arcadeSubTab, setArcadeSubTab] = useState<'ADULT' | 'KID'>('ADULT');

	useEffect(() => {
		let cancelled = false;
		getGameHistory().then((e) => {
			if (!cancelled) setEntries(e);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const handleClear = async () => {
		tap();
		await clearGameHistory();
		setEntries([]);
	};

	const handleClose = () => {
		tap();
		onClose();
	};

	const filteredEntries = entries?.filter((entry) => {
		if (activeTab === 'FAMILY') return entry.mode !== 'ARCADE';
		if (activeTab === 'ARCADE') {
			if (entry.mode !== 'ARCADE') return false;
			return entry.roster?.[0]?.level === arcadeSubTab;
		}
		return false;
	});

	return (
		<div data-testid="history-screen" className="absolute inset-0 z-30 flex flex-col bg-surface">
			<header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 py-4">
				<button
					type="button"
					aria-label={t('menu.close')}
					data-testid="history-back"
					onClick={handleClose}
					className="text-on-surface-variant hover:text-on-surface"
				>
					<ArrowLeft className="h-4 w-4" />
				</button>
				<h2 className="font-display text-lg font-bold uppercase tracking-widest-premium text-tertiary">
					{t('history.title')}
				</h2>
				<button
					type="button"
					aria-label={t('history.clear')}
					onClick={handleClear}
					disabled={!entries || entries.length === 0}
					className="text-on-surface-variant hover:text-error disabled:opacity-30"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</header>

			<div className="flex shrink-0 border-b border-outline-variant bg-surface-container-low">
				<button
					type="button"
					className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide-premium transition-colors ${activeTab === 'FAMILY' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}
					onClick={() => {
						tap();
						setActiveTab('FAMILY');
					}}
				>
					{t('history.tab_family')}
				</button>
				<button
					type="button"
					className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide-premium transition-colors ${activeTab === 'ARCADE' ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}
					onClick={() => {
						tap();
						setActiveTab('ARCADE');
					}}
				>
					{t('history.tab_arcade')}
				</button>
			</div>
			{activeTab === 'ARCADE' && (
				<div className="flex shrink-0 border-b border-outline-variant bg-surface-container-lowest">
					<button
						type="button"
						className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide-premium transition-colors ${arcadeSubTab === 'ADULT' ? 'text-tertiary' : 'text-on-surface-variant'}`}
						onClick={() => {
							tap();
							setArcadeSubTab('ADULT');
						}}
					>
						{t('lobby.level_adult')}
					</button>
					<button
						type="button"
						className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide-premium transition-colors ${arcadeSubTab === 'KID' ? 'text-tertiary' : 'text-on-surface-variant'}`}
						onClick={() => {
							tap();
							setArcadeSubTab('KID');
						}}
					>
						{t('lobby.level_kid')}
					</button>
				</div>
			)}

			<main className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-6">
				{filteredEntries && filteredEntries.length === 0 && (
					<p className="mt-10 text-center font-hanken text-sm text-on-surface-variant">
						{t('history.empty')}
					</p>
				)}
				{filteredEntries?.map((entry) => {
					const isArcade = entry.mode === 'ARCADE';
					const accuracy =
						entry.correct != null && entry.wrong != null
							? accuracyOf(entry.correct, entry.wrong)
							: null;
					return (
						<div
							key={entry.id ?? entry.date}
							data-testid="history-entry"
							className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4"
						>
							<div className="flex items-center justify-between">
								<span className="flex items-center gap-3">
									<ShapeGlyph shape={entry.winnerShape} size={26} color={entry.winnerColor} />
									<span className="flex flex-col">
										<span className="font-hanken text-sm font-bold text-on-surface">
											{entry.winnerName}
										</span>
										<span className="font-sans text-xs text-on-surface-variant">
											{entry.turns} {t('history.turns')}
											{!isArcade && ` · ${entry.players} ${t('history.players')}`}
											{entry.durationMs != null && (
												<>
													{' '}
													·{' '}
													<span data-testid="history-duration">
														{formatDuration(entry.durationMs)}
													</span>
												</>
											)}
										</span>
									</span>
								</span>
								<span className="font-sans text-xs text-on-surface-variant">
									{new Date(entry.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')}
								</span>
							</div>

							{entry.roster && entry.roster.length > 0 && (
								<div className="flex flex-col gap-1" data-testid="history-roster">
									{entry.roster.map((stat, index) => (
										<RosterRow
											key={`${stat.profileId ?? stat.name}-${index}`}
											stat={stat}
											winnerLabel={t('history.winner_tag')}
											isArcade={isArcade}
										/>
									))}
								</div>
							)}

							{(accuracy !== null ||
								entry.wildcardsUsed != null ||
								entry.conclaveFails != null) && (
								<div
									className="flex flex-wrap gap-3 font-sans text-[11px] text-on-surface-variant"
									data-testid="history-stats"
								>
									{accuracy !== null && (
										<span>
											{t('history.accuracy')}: {accuracy}%
										</span>
									)}
									{entry.wildcardsUsed != null && (
										<span>
											{t('history.wildcards_used')}: {entry.wildcardsUsed}
										</span>
									)}
									{entry.conclaveFails != null && (
										<span>
											{t('history.conclave_fails')}: {entry.conclaveFails}
										</span>
									)}
								</div>
							)}
						</div>
					);
				})}
			</main>

			<div className="border-t border-outline-variant bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
				<Button variant="secondary" size="lg" className="w-full uppercase" onClick={handleClose}>
					{t('menu.close')}
				</Button>
			</div>
		</div>
	);
};

export default HistoryScreen;
