import type React from 'react';
import type { CellRef, PersonId, Scene } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { personAt } from '../utils/caseState';
import FloorPlan from './board/FloorPlan';
import PersonToken from './board/PersonToken';

interface CaseBoardProps {
	scene: Scene;
	onCellTap: (cell: CellRef) => void;
	targetCell?: CellRef | null;
	onTokenPointerDown?: (personId: PersonId, e: React.PointerEvent) => void;
}

const CaseBoard: React.FC<CaseBoardProps> = ({
	scene,
	onCellTap,
	targetCell = null,
	onTokenPointerDown,
}) => {
	const activeCase = useGameStore((s) => s.activeCase);
	const placement = useGameStore((s) => s.placement);
	const selectedPersonId = useGameStore((s) => s.selectedPersonId);
	const revealedMurderer = useGameStore((s) => s.revealedMurderer);

	const isBlocked = (r: number, c: number): boolean =>
		scene.blockedCells.some((cell) => cell.r === r && cell.c === c);

	const personName = (id: string): string =>
		activeCase?.people.find((person) => person.id === id)?.name ?? id;

	const rows = Array.from({ length: scene.size }, (_, r) => r);
	const cols = Array.from({ length: scene.size }, (_, c) => c);

	return (
		<div className="relative w-full shrink-0 select-none overflow-hidden rounded-DEFAULT border-2 border-primary bg-surface">
			<FloorPlan scene={scene} />
			<div
				className="grid aspect-square w-full"
				style={{
					gridTemplateColumns: `repeat(${scene.size}, minmax(0, 1fr))`,
					gridTemplateRows: `repeat(${scene.size}, minmax(0, 1fr))`,
				}}
				data-testid="case-board"
			>
				{rows.map((r) =>
					cols.map((c) => {
						const blocked = isBlocked(r, c);
						const occupant = personAt(placement, r, c);
						const isTarget = targetCell?.r === r && targetCell?.c === c;

						return (
							<button
								type="button"
								key={`${r}-${c}`}
								data-testid={`cell-${r}-${c}`}
								disabled={blocked}
								onClick={() => !blocked && onCellTap({ r, c })}
								className={`relative flex items-center justify-center ${
									blocked ? 'cursor-not-allowed' : 'cursor-pointer'
								} ${isTarget ? 'outline outline-2 -outline-offset-2 outline-[var(--color-tertiary)]' : ''}`}
							>
								{occupant && (
									<span
										data-testid={`token-${occupant}`}
										onPointerDown={(e) => onTokenPointerDown?.(occupant, e)}
										className="flex h-3/4 w-3/4 items-center justify-center"
									>
										<PersonToken
											name={personName(occupant)}
											personId={occupant}
											variant={occupant === activeCase?.victimId ? 'victim' : 'suspect'}
											selected={occupant === selectedPersonId}
											murderer={occupant === revealedMurderer}
										/>
									</span>
								)}
							</button>
						);
					}),
				)}
			</div>
		</div>
	);
};

export default CaseBoard;
