import type React from 'react';
import { useMemo } from 'react';
import { computeFloorPlan } from '../../engine/floorplan';
import type { Scene } from '../../engine/types';
import { useGameStore } from '../../store/gameStore';
import ObjectGlyph from './ObjectGlyph';

const RUBBLE_PATTERN_ID = 'floorplan-rubble-hatch';

function roomFillToken(roomIndex: number): string {
	return `var(--color-room-${(roomIndex % 4) + 1})`;
}

const FloorPlan: React.FC<{ scene: Scene }> = ({ scene }) => {
	const plan = useMemo(() => computeFloorPlan(scene), [scene]);
	const { size, floors, walls, objects, blocked, rooms } = plan;
	const t = useGameStore((s) => s.t);
	// Subscribe to language so labels re-render when it changes.
	useGameStore((s) => s.language);

	return (
		<svg
			viewBox={`0 0 ${size} ${size}`}
			className="absolute inset-0 h-full w-full"
			preserveAspectRatio="xMidYMid meet"
			aria-hidden="true"
		>
			<defs>
				<pattern
					id={RUBBLE_PATTERN_ID}
					patternUnits="userSpaceOnUse"
					width={0.2}
					height={0.2}
					patternTransform="rotate(45)"
				>
					<rect width={0.2} height={0.2} fill="var(--color-surface-dim)" />
					<line x1={0} y1={0} x2={0} y2={0.2} stroke="var(--color-primary)" strokeWidth={0.04} />
				</pattern>
			</defs>

			{floors.map((tile) => (
				<rect
					key={`floor-${tile.r}-${tile.c}`}
					x={tile.c}
					y={tile.r}
					width={1}
					height={1}
					fill={roomFillToken(tile.roomIndex)}
				/>
			))}

			{Array.from({ length: Math.max(0, size - 1) }, (_, i) => i + 1).map((line) => (
				<g key={`grid-${line}`}>
					<line
						data-grid=""
						x1={line}
						y1={0}
						x2={line}
						y2={size}
						stroke="var(--color-outline-variant)"
						strokeWidth={0.02}
					/>
					<line
						data-grid=""
						x1={0}
						y1={line}
						x2={size}
						y2={line}
						stroke="var(--color-outline-variant)"
						strokeWidth={0.02}
					/>
				</g>
			))}

			{blocked.map((cell) => (
				<rect
					key={`blocked-${cell.r}-${cell.c}`}
					x={cell.c}
					y={cell.r}
					width={1}
					height={1}
					fill={`url(#${RUBBLE_PATTERN_ID})`}
				/>
			))}

			{rooms.map((room) => (
				<text
					key={`label-${room.roomIndex}`}
					x={room.cx}
					y={room.cy}
					textAnchor="middle"
					dominantBaseline="central"
					fontFamily="var(--font-display)"
					fontSize={0.26}
					fill="var(--color-on-surface-variant)"
					opacity={0.5}
					style={{ textTransform: 'uppercase', letterSpacing: '0.03px' }}
				>
					{t(`room_label.${scene.rooms[room.roomIndex].id}`)}
				</text>
			))}

			{walls.map((wall) => (
				<line
					key={`wall-${wall.x1}-${wall.y1}-${wall.x2}-${wall.y2}`}
					data-wall=""
					x1={wall.x1}
					y1={wall.y1}
					x2={wall.x2}
					y2={wall.y2}
					stroke="var(--color-primary)"
					strokeWidth={0.06}
					strokeLinecap="round"
				/>
			))}

			{objects.map((object) => (
				<g
					key={`object-${object.r}-${object.c}`}
					transform={`translate(${object.c} ${object.r}) scale(${1 / 24})`}
				>
					<ObjectGlyph kind={object.kind} />
				</g>
			))}
		</svg>
	);
};

export default FloorPlan;
