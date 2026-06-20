import { Button } from '@pwarush/core/ui';
import type React from 'react';
import { useGameStore } from '../store/gameStore';
import { playerAccent } from '../utils/players';
import ShapeGlyph from './board/ShapeGlyph';

/** Conclave step 2: hand the device back to the challenger before the final question. */
const ConclaveHandoffScreen: React.FC = () => {
	const players = useGameStore((s) => s.players);
	const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
	const confirmConclaveHandoff = useGameStore((s) => s.confirmConclaveHandoff);
	const t = useGameStore((s) => s.t);
	const player = players[currentPlayerIndex];

	if (!player) return null;

	return (
		<div
			data-testid="conclave-handoff"
			className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-surface px-6 text-center"
		>
			<p className="font-display text-xs uppercase tracking-widest-premium text-on-surface-variant">
				{t('conclave.handoff')}
			</p>
			<div className="flex flex-col items-center gap-4">
				<ShapeGlyph shape={player.shape} size={72} color={playerAccent(currentPlayerIndex)} />
				<h2 className="font-display text-3xl font-bold uppercase tracking-wide-premium text-on-surface">
					{player.name}
				</h2>
			</div>
			<Button
				variant="primary"
				size="lg"
				className="uppercase"
				data-testid="confirm-handoff"
				onClick={confirmConclaveHandoff}
			>
				{t('conclave.ready')}
			</Button>
		</div>
	);
};

export default ConclaveHandoffScreen;
