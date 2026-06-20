import { Button } from '@pwarush/core/ui';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { clearGameHistory, getGameHistory } from '../db/gameHistory';
import { useGameStore } from '../store/gameStore';
import type { GameHistoryEntry } from '../types';
import ShapeGlyph from './board/ShapeGlyph';

interface HistoryScreenProps {
	onClose: () => void;
}

/** Hall of Fame: the list of finished games, most recent first. */
const HistoryScreen: React.FC<HistoryScreenProps> = ({ onClose }) => {
	const t = useGameStore((s) => s.t);
	const language = useGameStore((s) => s.language);
	const [entries, setEntries] = useState<GameHistoryEntry[] | null>(null);

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
		await clearGameHistory();
		setEntries([]);
	};

	return (
		<div data-testid="history-screen" className="absolute inset-0 z-30 flex flex-col bg-surface">
			<header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 py-4">
				<button
					type="button"
					aria-label={t('menu.close')}
					data-testid="history-back"
					onClick={onClose}
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

			<main className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-6">
				{entries && entries.length === 0 && (
					<p className="mt-10 text-center font-hanken text-sm text-on-surface-variant">
						{t('history.empty')}
					</p>
				)}
				{entries?.map((entry) => (
					<div
						key={entry.id ?? entry.date}
						className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-4"
					>
						<span className="flex items-center gap-3">
							<ShapeGlyph shape={entry.winnerShape} size={26} color={entry.winnerColor} />
							<span className="flex flex-col">
								<span className="font-hanken text-sm font-bold text-on-surface">
									{entry.winnerName}
								</span>
								<span className="font-sans text-xs text-on-surface-variant">
									{entry.turns} {t('history.turns')} · {entry.players} {t('history.players')}
								</span>
							</span>
						</span>
						<span className="font-sans text-xs text-on-surface-variant">
							{new Date(entry.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')}
						</span>
					</div>
				))}
			</main>

			<div className="border-t border-outline-variant bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
				<Button variant="secondary" size="lg" className="w-full uppercase" onClick={onClose}>
					{t('menu.close')}
				</Button>
			</div>
		</div>
	);
};

export default HistoryScreen;
