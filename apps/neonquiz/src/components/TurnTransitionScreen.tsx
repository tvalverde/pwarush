import { Button } from '@pwarush/core/ui';
import type React from 'react';
import { NEXUS_ID } from '../engine/boardFactory';
import { useTap } from '../hooks/useHaptics';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES } from '../types';
import { playerColor } from '../utils/players';
import ShapeGlyph from './board/ShapeGlyph';

/** Anti-cheat device-passing overlay shown between turns. */
const TurnTransitionScreen: React.FC = () => {
	const players = useGameStore((s) => s.players);
	const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
	const confirmTurnTransition = useGameStore((s) => s.confirmTurnTransition);
	const t = useGameStore((s) => s.t);
	const tap = useTap();
	const player = players[currentPlayerIndex];

	if (!player) return null;

	// With every Spark in hand but not yet on the central Nexus, remind the player where to go.
	const headToNexus = player.sparks.length === CATEGORIES.length && player.position !== NEXUS_ID;

	return (
		<div
			data-testid="turn-transition"
			className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-surface px-6 text-center"
		>
			<p className="font-display text-xs uppercase tracking-widest-premium text-on-surface-variant">
				{t('transition.pass_device')}
			</p>
			<div className="flex flex-col items-center gap-4">
				<ShapeGlyph
					shape={player.shape}
					size={72}
					color={playerColor(player, currentPlayerIndex)}
				/>
				<h2 className="font-display text-3xl font-bold uppercase tracking-wide-premium text-on-surface">
					{player.name}
				</h2>
			</div>
			{headToNexus && (
				<p
					data-testid="nexus-reminder"
					className="max-w-xs font-hanken text-sm font-bold uppercase tracking-wide-premium text-primary"
				>
					{t('conclave.reminder')}
				</p>
			)}
			<Button
				variant="primary"
				size="lg"
				className="uppercase"
				data-testid="confirm-transition"
				onClick={() => {
					tap();
					confirmTurnTransition();
				}}
			>
				{t('transition.ready')}
			</Button>
		</div>
	);
};

export default TurnTransitionScreen;
