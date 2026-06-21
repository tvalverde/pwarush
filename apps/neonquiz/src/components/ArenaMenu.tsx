import { Button } from '@pwarush/core/ui';
import { LogOut, RotateCcw, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { playerColor } from '../utils/players';
import ShapeGlyph from './board/ShapeGlyph';
import ConfirmOverlay from './ConfirmOverlay';

interface ArenaMenuProps {
	onClose: () => void;
}

type Pending = { kind: 'leave'; playerId: string } | { kind: 'restart' } | { kind: 'abandon' };

/** In-game menu: retire a single player, restart, or abandon the whole game. */
const ArenaMenu: React.FC<ArenaMenuProps> = ({ onClose }) => {
	const players = useGameStore((s) => s.players);
	const removePlayer = useGameStore((s) => s.removePlayer);
	const restartGame = useGameStore((s) => s.restartGame);
	const abandonGame = useGameStore((s) => s.abandonGame);
	const t = useGameStore((s) => s.t);
	const [pending, setPending] = useState<Pending | null>(null);

	const confirmTexts: Record<Pending['kind'], string> = {
		leave: t('menu.leave_confirm'),
		restart: t('menu.restart_confirm'),
		abandon: t('menu.abandon_confirm'),
	};

	const runPending = () => {
		if (!pending) return;
		if (pending.kind === 'leave') removePlayer(pending.playerId);
		else if (pending.kind === 'restart') restartGame();
		else abandonGame();
		setPending(null);
		onClose();
	};

	if (pending) {
		return (
			<ConfirmOverlay
				title={t('menu.title')}
				message={confirmTexts[pending.kind]}
				confirmText={t('common.confirm')}
				cancelText={t('common.cancel')}
				danger={pending.kind !== 'restart'}
				onConfirm={runPending}
				onCancel={() => setPending(null)}
			/>
		);
	}

	return (
		<div
			data-testid="arena-menu"
			className="absolute inset-0 z-40 flex flex-col bg-surface/90 p-6 backdrop-blur-sm"
		>
			<div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-5">
				<div className="flex items-center justify-between">
					<h2 className="font-display text-lg font-bold uppercase tracking-widest-premium text-primary">
						{t('menu.title')}
					</h2>
					<button
						type="button"
						aria-label={t('menu.close')}
						data-testid="menu-close"
						onClick={onClose}
						className="text-on-surface-variant hover:text-on-surface"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex flex-col gap-2">
					<span className="font-hanken text-[10px] uppercase tracking-wide-premium text-on-surface-variant">
						{t('menu.players')}
					</span>
					{players.map((player, index) => (
						<div
							key={player.id}
							className="flex items-center justify-between rounded-full border border-outline-variant bg-surface-container px-4 py-2.5"
						>
							<span className="flex items-center gap-3">
								<ShapeGlyph shape={player.shape} size={20} color={playerColor(player, index)} />
								<span className="font-hanken text-sm font-bold text-on-surface">{player.name}</span>
							</span>
							<button
								type="button"
								data-testid={`leave-${index}`}
								onClick={() => setPending({ kind: 'leave', playerId: player.id })}
								className="flex items-center gap-1 font-hanken text-[11px] font-bold uppercase tracking-wide-premium text-on-surface-variant hover:text-error"
							>
								<LogOut className="h-3.5 w-3.5" />
								{t('menu.leave')}
							</button>
						</div>
					))}
				</div>

				<div className="mt-auto flex flex-col gap-2">
					<Button
						variant="secondary"
						size="md"
						className="gap-2 uppercase"
						data-testid="menu-restart"
						onClick={() => setPending({ kind: 'restart' })}
					>
						<RotateCcw className="h-4 w-4" />
						{t('menu.restart')}
					</Button>
					<Button
						variant="ghost"
						size="md"
						className="uppercase text-error"
						data-testid="menu-abandon"
						onClick={() => setPending({ kind: 'abandon' })}
					>
						{t('menu.abandon')}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default ArenaMenu;
