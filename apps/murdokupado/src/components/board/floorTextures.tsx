import type React from 'react';
import type { FloorMaterial } from '../../engine/types';

// Subtle ink textures drawn over a room's flat tint. Each pattern is transparent
// (the tint shows through) and uses faint ink strokes, matching the floor-plan ink
// identity (same primary stroke as the walls and the rubble hatch). Coordinates are
// in board cell units (1 cell = 1 unit); the overlay opacity keeps them legible.
const PATTERN_PREFIX = 'floor-texture';
const INK = 'var(--color-primary)';

export function floorPatternId(material: FloorMaterial): string {
	return `${PATTERN_PREFIX}-${material}`;
}

interface PatternProps {
	id: string;
	width: number;
	height: number;
	children: React.ReactNode;
}

const Pattern: React.FC<PatternProps> = ({ id, width, height, children }) => (
	<pattern id={id} patternUnits="userSpaceOnUse" width={width} height={height}>
		{children}
	</pattern>
);

// Defs block: one <pattern> per material. Mount inside an <svg><defs>.
const FloorTextureDefs: React.FC = () => (
	<>
		{/* Wood: horizontal plank seams with a faint grain dash. */}
		<Pattern id={floorPatternId('wood')} width={1} height={0.34}>
			<line x1={0} y1={0} x2={1} y2={0} stroke={INK} strokeWidth={0.012} />
			<line x1={0.15} y1={0.17} x2={0.55} y2={0.17} stroke={INK} strokeWidth={0.008} />
		</Pattern>

		{/* Tile: a square grid (right + bottom edges of each cell). */}
		<Pattern id={floorPatternId('tile')} width={0.34} height={0.34}>
			<path d="M0.34 0 L0.34 0.34 L0 0.34" fill="none" stroke={INK} strokeWidth={0.012} />
		</Pattern>

		{/* Carpet: a fine diagonal cross-hatch weave. */}
		<Pattern id={floorPatternId('carpet')} width={0.16} height={0.16}>
			<line x1={0} y1={0.16} x2={0.16} y2={0} stroke={INK} strokeWidth={0.01} />
			<line x1={0} y1={0} x2={0.16} y2={0.16} stroke={INK} strokeWidth={0.01} />
		</Pattern>

		{/* Stone: running-bond ashlar (offset brick rows). */}
		<Pattern id={floorPatternId('stone')} width={0.5} height={0.68}>
			<line x1={0} y1={0} x2={0.5} y2={0} stroke={INK} strokeWidth={0.012} />
			<line x1={0} y1={0.34} x2={0.5} y2={0.34} stroke={INK} strokeWidth={0.012} />
			<line x1={0} y1={0} x2={0} y2={0.34} stroke={INK} strokeWidth={0.012} />
			<line x1={0.25} y1={0.34} x2={0.25} y2={0.68} stroke={INK} strokeWidth={0.012} />
		</Pattern>

		{/* Marble: sparse curved veins across a large tile. */}
		<Pattern id={floorPatternId('marble')} width={1} height={1}>
			<path
				d="M0 0.7 Q0.3 0.5 0.55 0.75 T1 0.65"
				fill="none"
				stroke={INK}
				strokeWidth={0.01}
				opacity={0.8}
			/>
			<path d="M0.2 0.1 Q0.45 0.3 0.8 0.2" fill="none" stroke={INK} strokeWidth={0.008} />
		</Pattern>

		{/* Grass: scattered short tufts. */}
		<Pattern id={floorPatternId('grass')} width={0.25} height={0.25}>
			<path d="M0.08 0.2 L0.1 0.12 M0.12 0.2 L0.1 0.12" stroke={INK} strokeWidth={0.01} />
			<path d="M0.2 0.1 L0.22 0.02 M0.24 0.1 L0.22 0.02" stroke={INK} strokeWidth={0.01} />
		</Pattern>

		{/* Water: shallow horizontal ripples. */}
		<Pattern id={floorPatternId('water')} width={0.5} height={0.25}>
			<path
				d="M0 0.12 Q0.125 0.04 0.25 0.12 T0.5 0.12"
				fill="none"
				stroke={INK}
				strokeWidth={0.01}
			/>
		</Pattern>
	</>
);

export default FloorTextureDefs;
