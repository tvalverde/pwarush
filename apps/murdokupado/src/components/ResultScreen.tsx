import { Button } from '@pwarush/core/ui';
import { Home, Repeat, ShieldAlert } from 'lucide-react';
import type React from 'react';
import { useGameStore } from '../store/gameStore';

const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60)
		.toString()
		.padStart(2, '0');
	const secs = (seconds % 60).toString().padStart(2, '0');
	return `${mins}:${secs}`;
};

const ResultScreen: React.FC = () => {
	const activeCase = useGameStore((s) => s.activeCase);
	const lastResult = useGameStore((s) => s.lastResult);
	const clearActiveGame = useGameStore((s) => s.clearActiveGame);
	const setScreen = useGameStore((s) => s.setScreen);
	const t = useGameStore((s) => s.t);

	if (!lastResult) {
		return null;
	}

	const nameOf = (id: string): string =>
		activeCase?.people.find((person) => person.id === id)?.name ?? id;

	const goHome = () => {
		clearActiveGame();
		setScreen('main');
	};

	return (
		<div
			className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center"
			data-testid="result-screen"
		>
			<div className="flex flex-col items-center gap-3">
				<ShieldAlert className="h-14 w-14 text-primary" />
				<h1 className="font-hanken text-3xl font-black uppercase tracking-widest-premium text-on-surface">
					{t('result.solved_title')}
				</h1>
			</div>

			<div className="flex w-full max-w-xs flex-col gap-4 rounded-DEFAULT border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
				<div className="flex flex-col gap-1">
					<span className="font-hanken text-xs font-bold uppercase tracking-wide-premium text-secondary">
						{t('result.murderer_label')}
					</span>
					<span data-testid="murderer-name" className="font-hanken text-2xl font-black text-error">
						{nameOf(lastResult.murdererId)}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="font-hanken text-xs font-bold uppercase tracking-wide-premium text-secondary">
						{t('result.victim_label')}
					</span>
					<span className="font-hanken text-lg font-bold text-on-surface">
						{nameOf(lastResult.victimId)}
					</span>
				</div>
				<div className="flex justify-between border-t border-outline-variant pt-4 font-hanken text-sm text-on-surface">
					<span>
						{t('result.time_label')}:{' '}
						<strong data-testid="result-time" className="tabular-nums">
							{formatTime(lastResult.timeElapsed)}
						</strong>
					</span>
					<span>
						{t('result.mistakes_label')}: <strong>{lastResult.mistakes}</strong>
					</span>
				</div>
			</div>

			<div className="flex w-full max-w-xs flex-col gap-3">
				<Button
					variant="primary"
					size="lg"
					className="w-full gap-2 uppercase"
					data-testid="result-new-case"
					onClick={goHome}
				>
					<Repeat className="h-5 w-5" />
					{t('result.new_case')}
				</Button>
				<Button
					variant="secondary"
					size="lg"
					className="w-full gap-2 uppercase"
					data-testid="result-home"
					onClick={goHome}
				>
					<Home className="h-5 w-5" />
					{t('result.home')}
				</Button>
			</div>
		</div>
	);
};

export default ResultScreen;
