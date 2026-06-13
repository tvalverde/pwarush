import {
	Armchair,
	Droplets,
	Flag,
	type LucideIcon,
	Package,
	ShoppingCart,
	Sprout,
	Table,
} from 'lucide-react';
import type React from 'react';
import type { CellRef, ObjectKind, Scene } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { personAt } from '../utils/caseState';

const OBJECT_ICONS: Record<ObjectKind, LucideIcon> = {
	desk: Table,
	bench: Armchair,
	flag: Flag,
	register: ShoppingCart,
	shelf: Package,
	plant: Sprout,
	puddle: Droplets,
};

// Distinct neutral tints so adjacent rooms read as separate regions. Rooms are
// mapped by their order in the scene; semantic surface roles only (rule 4).
const ROOM_TINTS = [
	'bg-surface-container-lowest',
	'bg-surface-container-low',
	'bg-surface-container-high',
	'bg-surface-container-highest',
];

const HATCH_STYLE: React.CSSProperties = {
	backgroundImage:
		'repeating-linear-gradient(45deg, var(--color-surface-dim) 0, var(--color-surface-dim) 4px, transparent 4px, transparent 8px)',
};

interface CaseBoardProps {
	scene: Scene;
	onCellTap: (cell: CellRef) => void;
}

const CaseBoard: React.FC<CaseBoardProps> = ({ scene, onCellTap }) => {
	const activeCase = useGameStore((s) => s.activeCase);
	const placement = useGameStore((s) => s.placement);
	const selectedPersonId = useGameStore((s) => s.selectedPersonId);

	const roomTintOf = (r: number, c: number): string => {
		const index = scene.rooms.findIndex((room) =>
			room.cells.some((cell) => cell.r === r && cell.c === c),
		);
		return ROOM_TINTS[index % ROOM_TINTS.length] ?? ROOM_TINTS[0];
	};

	const objectAt = (r: number, c: number): ObjectKind | null =>
		scene.objects.find((o) => o.cell.r === r && o.cell.c === c)?.kind ?? null;

	const isBlocked = (r: number, c: number): boolean =>
		scene.blockedCells.some((cell) => cell.r === r && cell.c === c);

	const personName = (id: string): string =>
		activeCase?.people.find((person) => person.id === id)?.name ?? id;

	const rows = Array.from({ length: scene.size }, (_, r) => r);
	const cols = Array.from({ length: scene.size }, (_, c) => c);

	return (
		<div
			className="grid w-full aspect-square gap-1 rounded-DEFAULT border-2 border-primary bg-primary p-1 select-none"
			style={{
				gridTemplateColumns: `repeat(${scene.size}, minmax(0, 1fr))`,
				gridTemplateRows: `repeat(${scene.size}, minmax(0, 1fr))`,
			}}
			data-testid="case-board"
		>
			{rows.map((r) =>
				cols.map((c) => {
					const blocked = isBlocked(r, c);
					const object = objectAt(r, c);
					const occupant = personAt(placement, r, c);
					const isSelectedOccupant = occupant !== null && occupant === selectedPersonId;
					const ObjectIcon = object ? OBJECT_ICONS[object] : null;

					return (
						<button
							type="button"
							key={`${r}-${c}`}
							data-testid={`cell-${r}-${c}`}
							disabled={blocked}
							onClick={() => !blocked && onCellTap({ r, c })}
							className={`relative flex items-center justify-center rounded-sm transition-colors ${
								blocked ? 'cursor-not-allowed' : 'cursor-pointer'
							} ${roomTintOf(r, c)}`}
							style={blocked ? HATCH_STYLE : undefined}
						>
							{ObjectIcon && !occupant && (
								<ObjectIcon className="w-1/2 h-1/2 text-secondary" aria-hidden />
							)}
							{occupant && (
								<span
									data-testid={`token-${occupant}`}
									className={`flex items-center justify-center w-3/4 h-3/4 rounded-full bg-primary font-hanken text-base font-black uppercase text-on-primary ${
										isSelectedOccupant ? 'ring-4 ring-tertiary-fixed' : ''
									}`}
								>
									{personName(occupant).charAt(0)}
								</span>
							)}
						</button>
					);
				}),
			)}
		</div>
	);
};

export default CaseBoard;
