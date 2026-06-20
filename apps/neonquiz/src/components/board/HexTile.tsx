import type React from 'react';
import { hexPolygonPoints, NEXUS_RADIUS, SPARK_RADIUS, TILE_RADIUS } from '../../engine/hex';
import type { BoardNode } from '../../types';
import { categoryColor } from '../../utils/categories';

interface HexTileProps {
	node: BoardNode;
	isValid: boolean;
	dimmed: boolean;
	nexusActive: boolean;
	onMove: (nodeId: number) => void;
}

// A four-pointed sparkle, drawn as eight alternating-radius vertices.
const sparkle = (cx: number, cy: number, outer: number): string => {
	const inner = outer * 0.38;
	const pts: string[] = [];
	for (let i = 0; i < 8; i++) {
		const angle = (Math.PI / 4) * i - Math.PI / 2;
		const radius = i % 2 === 0 ? outer : inner;
		pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
	}
	return pts.join(' ');
};

const HexTile: React.FC<HexTileProps> = ({ node, isValid, dimmed, nexusActive, onMove }) => {
	const { x, y } = node;

	if (node.type === 'NEXUS') {
		const points = hexPolygonPoints(x, y, NEXUS_RADIUS);
		const nexusClass = [
			nexusActive ? 'nq-nexus nq-nexus-active' : 'nq-nexus',
			isValid ? 'nq-valid' : '',
			dimmed ? 'nq-dim' : '',
		]
			.join(' ')
			.trim();
		return (
			<g className={nexusClass || undefined}>
				{/* glass hex — clickable when entering the Nexus is a legal move */}
				<polygon
					points={points}
					fill="url(#nq-glass)"
					stroke={isValid ? 'var(--color-on-surface)' : '#9cf6ff'}
					strokeWidth={isValid ? 2.6 : 1.6}
					opacity={nexusActive ? 1 : 0.55}
					filter={nexusActive ? 'url(#nq-glow)' : undefined}
					style={isValid ? { cursor: 'pointer' } : undefined}
					data-testid={isValid ? `move-${node.id}` : undefined}
					onClick={isValid ? () => onMove(node.id) : undefined}
				/>
				<circle
					cx={x}
					cy={y}
					r={NEXUS_RADIUS * 0.5}
					fill="url(#nq-core)"
					opacity={nexusActive ? 1 : 0.5}
					filter={nexusActive ? 'url(#nq-glow)' : undefined}
					pointerEvents="none"
				/>
				<polygon
					points={sparkle(x, y, NEXUS_RADIUS * 0.42)}
					fill="#ffffff"
					opacity={0.92}
					pointerEvents="none"
				/>
			</g>
		);
	}

	const color = categoryColor(node.category);
	const isSpark = node.type === 'SPARK_NODE';
	const radius = isSpark ? SPARK_RADIUS : TILE_RADIUS;
	const points = hexPolygonPoints(x, y, radius);
	const innerPoints = hexPolygonPoints(x, y, radius * 0.7);
	const emphasized = isSpark || isValid;
	const tileClass = [isSpark ? 'nq-spark' : '', isValid ? 'nq-valid' : '', dimmed ? 'nq-dim' : '']
		.join(' ')
		.trim();

	return (
		<g className={tileClass || undefined}>
			{/* soft outer rim — a cheap glow; much stronger on a legal destination */}
			<polygon
				points={points}
				fill="none"
				stroke={color}
				strokeWidth={isValid ? 5 : 3}
				opacity={isValid ? 0.7 : 0.18}
				pointerEvents="none"
			/>
			{/* glass body + crisp neon rim — this is the clickable hit area when legal */}
			<polygon
				points={points}
				fill="url(#nq-glass)"
				stroke={color}
				strokeWidth={isValid ? 2.4 : isSpark ? 1.7 : 1.2}
				opacity={emphasized ? 1 : 0.9}
				filter={emphasized ? 'url(#nq-glow)' : undefined}
				style={isValid ? { cursor: 'pointer' } : undefined}
				data-testid={isValid ? `move-${node.id}` : undefined}
				onClick={isValid ? () => onMove(node.id) : undefined}
			/>
			{/* interior light — fills the tile in its own colour so an available move is obvious */}
			<polygon
				points={innerPoints}
				fill={color}
				opacity={isValid ? 0.4 : isSpark ? 0.18 : 0.1}
				pointerEvents="none"
			/>
			{isSpark && (
				<polygon
					points={sparkle(x, y, radius * 0.5)}
					fill={isValid ? '#ffffff' : color}
					opacity={0.95}
					pointerEvents="none"
				/>
			)}
		</g>
	);
};

export default HexTile;
