import { Button } from '@pwarush/core/ui';
import type React from 'react';
import { useEffect, useState } from 'react';
import { db } from '../db/database';
import { useTap } from '../hooks/useHaptics';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES } from '../types';
import { categoryColor } from '../utils/categories';
import { playerColor } from '../utils/players';
import ShapeGlyph from './board/ShapeGlyph';

const VictoryScreen: React.FC = () => {
	const players = useGameStore((s) => s.players);
	const winnerIndex = useGameStore((s) => s.winnerIndex);
	const turnCount = useGameStore((s) => s.turnCount);
	const resetGame = useGameStore((s) => s.resetGame);
	const t = useGameStore((s) => s.t);
	const tap = useTap();

	const mode = useGameStore((s) => s.mode);
	const startedAt = useGameStore((s) => s.startedAt);

	const winner = winnerIndex !== null ? players[winnerIndex] : null;

	const [isHighScore, setIsHighScore] = useState(false);

	useEffect(() => {
		if (mode !== 'ARCADE' || !winner) return;
		let cancelled = false;
		db.gameHistory.toArray().then((entries) => {
			if (cancelled) return;
			const others = entries.filter(
				(e) =>
					e.mode === 'ARCADE' &&
					e.roster?.[0]?.level === winner.level &&
					e.date < (startedAt ?? Date.now()),
			);
			const maxScore = others.reduce((max, e) => Math.max(max, e.roster?.[0]?.arcadeScore ?? 0), 0);
			// New high score if greater than 0 AND greater than previous max
			if ((winner.arcadeScore ?? 0) > maxScore && (winner.arcadeScore ?? 0) > 0) {
				setIsHighScore(true);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [mode, winner, startedAt]);

	if (!winner || winnerIndex === null) return null;
	const accent = playerColor(winner, winnerIndex);

	return (
		<div
			data-testid="victory-screen"
			className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-surface px-6 text-center"
		>
			<h2 className="font-display text-3xl font-bold uppercase tracking-widest-premium text-tertiary">
				{t('victory.title')}
			</h2>

			<div className="flex flex-col items-center gap-4">
				<span className="relative rounded-full p-4" style={{ boxShadow: `0 0 32px 4px ${accent}` }}>
					<span className="nq-rings" aria-hidden="true" />
					<span className="nq-rings nq-rings-delay" aria-hidden="true" />
					<ShapeGlyph shape={winner.shape} size={88} color={accent} />
				</span>
				<p className="font-display text-2xl font-bold uppercase tracking-wide-premium text-on-surface">
					{winner.name}
				</p>
				<p className="font-hanken text-xs uppercase tracking-wide-premium text-on-surface-variant">
					{t('victory.winner')}
				</p>
			</div>

			<div className="flex flex-wrap justify-center gap-6 max-w-sm">
				{mode === 'ARCADE' && (
					<div className="flex flex-col items-center gap-2">
						<span className="font-display text-xl font-bold text-primary">
							{winner.arcadeScore ?? 0}
						</span>
						{isHighScore ? (
							<span className="rounded-sm bg-primary px-1.5 py-0.5 font-display text-[9px] font-bold uppercase tracking-widest-premium text-on-primary">
								{t('arcade.new_high_score')}
							</span>
						) : (
							<span className="h-4" />
						)}
						<span className="font-hanken text-[10px] uppercase tracking-wide-premium text-on-surface-variant">
							{t('arcade.score')}
						</span>
					</div>
				)}

				{mode === 'ARCADE' && (
					<div className="flex flex-col items-center gap-2">
						<span className="font-display text-xl font-bold text-tertiary">
							×{winner.arcadeMaxCombo ?? 0}
						</span>
						<span className="h-4" />
						<span className="font-hanken text-[10px] uppercase tracking-wide-premium text-on-surface-variant">
							{t('arcade.max_combo')}
						</span>
					</div>
				)}

				<div className="flex flex-col items-center gap-2">
					<span className="font-display text-xl font-bold text-on-surface">
						{winner.sparks.length}/{CATEGORIES.length}
					</span>
					<span className="flex gap-1">
						{CATEGORIES.map((category) => (
							<span
								key={category}
								className="h-2 w-2 rounded-full"
								style={{ backgroundColor: categoryColor(category) }}
							/>
						))}
					</span>
					<span className="font-hanken text-[10px] uppercase tracking-wide-premium text-on-surface-variant">
						{t('victory.sparks')}
					</span>
				</div>
				<div className="flex flex-col items-center gap-2">
					<span className="font-display text-xl font-bold text-on-surface">{turnCount}</span>
					<span className="h-2" />
					<span className="font-hanken text-[10px] uppercase tracking-wide-premium text-on-surface-variant">
						{t('victory.turns')}
					</span>
				</div>
			</div>

			<Button
				variant="primary"
				size="lg"
				className="uppercase"
				data-testid="play-again"
				onClick={() => {
					tap();
					resetGame();
				}}
			>
				{t('victory.play_again')}
			</Button>
		</div>
	);
};

export default VictoryScreen;
