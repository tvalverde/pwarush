import { exitAppFullscreen, requestAppFullscreen } from '@pwarush/core/utils';
import { ArrowLeft, Eraser, RotateCcw } from 'lucide-react';
import type React from 'react';
import { useEffect } from 'react';
import type { CellRef } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { personAt, sceneOf } from '../utils/caseState';
import CaseBoard from './CaseBoard';
import CluePanel from './CluePanel';

const formatTime = (seconds: number): string => {
	const mins = Math.floor(seconds / 60)
		.toString()
		.padStart(2, '0');
	const secs = (seconds % 60).toString().padStart(2, '0');
	return `${mins}:${secs}`;
};

const GameScreen: React.FC = () => {
	const activeCase = useGameStore((s) => s.activeCase);
	const placement = useGameStore((s) => s.placement);
	const selectedPersonId = useGameStore((s) => s.selectedPersonId);
	const mistakes = useGameStore((s) => s.mistakes);
	const timeElapsed = useGameStore((s) => s.timeElapsed);
	const lastResult = useGameStore((s) => s.lastResult);
	const selectedDifficulty = useGameStore((s) => s.selectedDifficulty);
	const selectPerson = useGameStore((s) => s.selectPerson);
	const placePerson = useGameStore((s) => s.placePerson);
	const erasePerson = useGameStore((s) => s.erasePerson);
	const incrementTime = useGameStore((s) => s.incrementTime);
	const setScreen = useGameStore((s) => s.setScreen);
	const restartGame = useGameStore((s) => s.restartGame);
	const showDialog = useGameStore((s) => s.showDialog);
	const t = useGameStore((s) => s.t);

	useEffect(() => {
		const id = setInterval(() => incrementTime(), 1000);
		return () => clearInterval(id);
	}, [incrementTime]);

	// The board mounts already in fullscreen (requested during the Play gesture);
	// this re-request is idempotent and only matters when the screen is reached by
	// other means. Leaving the screen exits fullscreen.
	useEffect(() => {
		requestAppFullscreen();
		return () => {
			exitAppFullscreen();
		};
	}, []);

	useEffect(() => {
		if (lastResult) {
			setScreen('result');
		}
	}, [lastResult, setScreen]);

	if (!activeCase) return null;
	const scene = sceneOf(activeCase);

	const unplaced = activeCase.people.filter((person) => !placement[person.id]);

	const handleCellTap = (cell: CellRef) => {
		if (selectedPersonId) {
			placePerson(selectedPersonId, cell);
			return;
		}
		const occupant = personAt(placement, cell.r, cell.c);
		if (occupant) {
			selectPerson(occupant);
		}
	};

	const handleTrayTap = (personId: string) => {
		selectPerson(selectedPersonId === personId ? null : personId);
	};

	const handleErase = () => {
		if (selectedPersonId && placement[selectedPersonId]) {
			erasePerson(selectedPersonId);
			selectPerson(null);
		}
	};

	const handleRestart = () => {
		showDialog({
			title: t('game.restart_prompt_title'),
			message: t('game.restart_prompt_msg'),
			confirmText: t('game.restart_prompt_confirm'),
			cancelText: t('game.restart_prompt_cancel'),
			type: 'danger',
			onConfirm: restartGame,
		});
	};

	return (
		<div className="flex h-full flex-col">
			<header className="flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4">
				<button
					type="button"
					data-testid="back-to-menu"
					onClick={() => setScreen('main')}
					className="rounded-full p-2 transition-colors hover:bg-surface-container"
				>
					<ArrowLeft className="h-6 w-6 text-secondary" />
				</button>
				<div className="flex items-center gap-5 font-hanken text-on-surface">
					<span data-testid="game-timer" className="text-sm font-bold tabular-nums">
						{formatTime(timeElapsed)}
					</span>
					<span className="text-xs font-bold uppercase tracking-wide-premium text-secondary">
						{t(`main_menu.difficulties.${selectedDifficulty}`)}
					</span>
					<span data-testid="game-mistakes" className="text-sm font-bold">
						{t('game.mistakes')}: {mistakes}
					</span>
				</div>
				<button
					type="button"
					data-testid="restart-case"
					onClick={handleRestart}
					className="rounded-full p-2 transition-colors hover:bg-surface-container"
				>
					<RotateCcw className="h-6 w-6 text-secondary" />
				</button>
			</header>

			<main className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
				<CaseBoard scene={scene} onCellTap={handleCellTap} />

				<section className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h3 className="font-display text-xs font-bold uppercase tracking-widest-premium text-secondary">
							{t('game.suspects')}
						</h3>
						<button
							type="button"
							data-testid="erase-button"
							onClick={handleErase}
							disabled={!selectedPersonId || !placement[selectedPersonId]}
							className="flex items-center gap-1 rounded-full px-3 py-1 font-hanken text-xs font-bold uppercase text-secondary transition-colors hover:bg-surface-container disabled:opacity-40"
						>
							<Eraser className="h-4 w-4" />
							{t('game.erase')}
						</button>
					</div>
					<div className="flex flex-wrap gap-2">
						{unplaced.map((person) => (
							<button
								type="button"
								key={person.id}
								data-testid={`suspect-${person.id}`}
								onClick={() => handleTrayTap(person.id)}
								className={`flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-sm transition-colors ${
									selectedPersonId === person.id
										? 'border-transparent bg-primary text-on-primary'
										: 'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container'
								}`}
							>
								<span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container font-hanken text-xs font-black uppercase text-on-secondary-container">
									{person.name.charAt(0)}
								</span>
								{person.name}
							</button>
						))}
					</div>
				</section>

				<CluePanel scene={scene} />
			</main>
		</div>
	);
};

export default GameScreen;
