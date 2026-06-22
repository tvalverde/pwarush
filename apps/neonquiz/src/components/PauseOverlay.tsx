import { Button } from '@pwarush/core/ui';
import { LogOut, Play } from 'lucide-react';
import type React from 'react';
import { useTap } from '../hooks/useHaptics';
import { useGameStore } from '../store/gameStore';

/**
 * Full-screen pause veil shown while `isPaused`. Sits above the board, dice and question overlays.
 * Offers resuming in place or leaving to the lobby while keeping the saved game (to continue later).
 */
const PauseOverlay: React.FC = () => {
	const t = useGameStore((s) => s.t);
	const resumeGame = useGameStore((s) => s.resumeGame);
	const suspendToLobby = useGameStore((s) => s.suspendToLobby);
	const tap = useTap();

	return (
		<div
			data-testid="pause-overlay"
			className="absolute inset-0 z-[45] flex flex-col items-center justify-center gap-7 bg-surface/95 p-6 backdrop-blur-sm"
		>
			<span className="font-display text-2xl font-bold uppercase tracking-widest-premium text-primary">
				{t('pause.title')}
			</span>
			<div className="flex w-full max-w-xs flex-col gap-3">
				<Button
					variant="primary"
					size="lg"
					className="gap-2 uppercase"
					data-testid="pause-resume"
					onClick={() => {
						tap();
						resumeGame();
					}}
				>
					<Play className="h-5 w-5" />
					{t('pause.resume')}
				</Button>
				<Button
					variant="secondary"
					size="md"
					className="gap-2 uppercase"
					data-testid="pause-exit"
					onClick={() => {
						tap();
						suspendToLobby();
					}}
				>
					<LogOut className="h-4 w-4" />
					{t('pause.exit')}
				</Button>
			</div>
		</div>
	);
};

export default PauseOverlay;
