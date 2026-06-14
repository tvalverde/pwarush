import { exitAppFullscreen, requestAppFullscreen } from '@pwarush/core/utils';
import { ArrowLeft, Eraser, Lightbulb, RotateCcw } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect } from 'react';
import type { CellRef } from '../engine/types';
import { useBoardDnd } from '../hooks/useBoardDnd';
import { useGameStore } from '../store/gameStore';
import { personAt, sceneOf } from '../utils/caseState';
import PersonToken from './board/PersonToken';
import Portrait from './board/Portrait';
import CaseBoard from './CaseBoard';
import CaseSolvedOverlay from './CaseSolvedOverlay';
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
	const revealedMurderer = useGameStore((s) => s.revealedMurderer);
	const selectedDifficulty = useGameStore((s) => s.selectedDifficulty);
	const currentHint = useGameStore((s) => s.currentHint);
	const selectPerson = useGameStore((s) => s.selectPerson);
	const placePerson = useGameStore((s) => s.placePerson);
	const erasePerson = useGameStore((s) => s.erasePerson);
	const requestHint = useGameStore((s) => s.requestHint);
	const applyHint = useGameStore((s) => s.applyHint);
	const clearHint = useGameStore((s) => s.clearHint);
	const incrementTime = useGameStore((s) => s.incrementTime);
	const setScreen = useGameStore((s) => s.setScreen);
	const restartGame = useGameStore((s) => s.restartGame);
	const showDialog = useGameStore((s) => s.showDialog);
	const t = useGameStore((s) => s.t);

	const scene = activeCase ? sceneOf(activeCase) : null;

	const isDroppable = useCallback(
		(cell: CellRef): boolean =>
			scene
				? !scene.blockedCells.some((blocked) => blocked.r === cell.r && blocked.c === cell.c)
				: false,
		[scene],
	);

	const { dragState, startDrag, didDragRef } = useBoardDnd({ isDroppable });

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

	if (!activeCase || !scene) return null;

	const unplaced = activeCase.people.filter((person) => !placement[person.id]);
	const nameOf = (id: string): string =>
		activeCase.people.find((person) => person.id === id)?.name ?? id;

	const consumeDragClick = (): boolean => {
		if (didDragRef.current) {
			didDragRef.current = false;
			return true;
		}
		return false;
	};

	const handleCellTap = (cell: CellRef) => {
		if (consumeDragClick()) return;
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
		if (consumeDragClick()) return;
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
				<div className="relative">
					<CaseBoard
						scene={scene}
						onCellTap={handleCellTap}
						targetCell={dragState?.targetCell ?? currentHint?.cell ?? null}
						onTokenPointerDown={startDrag}
					/>
					{revealedMurderer && (
						<CaseSolvedOverlay
							title={t('result.solved_title')}
							murdererLabel={t('result.murderer_label')}
							murdererName={nameOf(revealedMurderer)}
							victimLabel={t('result.victim_label')}
							victimName={nameOf(activeCase.victimId)}
							continueLabel={t('result.reveal_continue')}
							onContinue={() => setScreen('result')}
						/>
					)}
				</div>

				<section className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<h3 className="font-display text-xs font-bold uppercase tracking-widest-premium text-secondary">
							{t('game.suspects')}
						</h3>
						<div className="flex items-center gap-1">
							<button
								type="button"
								data-testid="hint-button"
								onClick={() => requestHint()}
								className="flex items-center gap-1 rounded-full px-3 py-1 font-hanken text-xs font-bold uppercase text-secondary transition-colors hover:bg-surface-container"
							>
								<Lightbulb className="h-4 w-4" />
								{t('game.hint')}
							</button>
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
					</div>

					{currentHint && (
						<div
							data-testid="hint-controls"
							className="flex items-center justify-end gap-2 rounded-DEFAULT border border-[var(--color-tertiary)] bg-surface-container-lowest px-3 py-2"
						>
							<button
								type="button"
								data-testid="hint-apply"
								onClick={() => applyHint()}
								className="rounded-full bg-primary px-4 py-1 font-hanken text-xs font-bold uppercase text-on-primary transition-colors hover:opacity-90"
							>
								{t('game.hint_place')}
							</button>
							<button
								type="button"
								data-testid="hint-dismiss"
								onClick={() => clearHint()}
								className="rounded-full px-4 py-1 font-hanken text-xs font-bold uppercase text-secondary transition-colors hover:bg-surface-container"
							>
								{t('game.hint_dismiss')}
							</button>
						</div>
					)}
					<div className="flex flex-wrap gap-2">
						{unplaced.map((person) => {
							const isSelected = selectedPersonId === person.id;
							const isVictim = person.id === activeCase.victimId;
							const isHinted = currentHint?.personId === person.id;
							const borderClass = isVictim
								? 'border-dashed border-error'
								: isSelected
									? 'border-transparent'
									: 'border-outline-variant';
							const hintClass = isHinted ? 'ring-2 ring-offset-1 ring-[var(--color-tertiary)]' : '';
							return (
								<button
									type="button"
									key={person.id}
									data-testid={`suspect-${person.id}`}
									data-victim={isVictim ? 'true' : undefined}
									data-hinted={isHinted ? 'true' : undefined}
									onPointerDown={(e) => startDrag(person.id, e)}
									onClick={() => handleTrayTap(person.id)}
									className={`flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-sm transition-colors ${borderClass} ${hintClass} ${
										isSelected
											? 'bg-primary text-on-primary'
											: 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
									}`}
								>
									<span
										className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full ${
											isVictim
												? 'bg-error-container text-error'
												: 'bg-secondary-container text-on-secondary-container'
										}`}
									>
										<Portrait
											personId={person.id}
											gender={person.gender}
											className="h-full w-full"
										/>
									</span>
									{person.name}
								</button>
							);
						})}
					</div>
				</section>

				<CluePanel scene={scene} />
			</main>

			{dragState &&
				(() => {
					const dragged = activeCase.people.find((person) => person.id === dragState.personId);
					if (!dragged) return null;
					return (
						<div
							data-testid="drag-ghost"
							className="pointer-events-none fixed z-50 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-90"
							style={{ left: dragState.x, top: dragState.y }}
						>
							<PersonToken
								name={dragged.name}
								personId={dragged.id}
								variant={dragged.id === activeCase.victimId ? 'victim' : 'suspect'}
							/>
						</div>
					);
				})()}
		</div>
	);
};

export default GameScreen;
