import type React from 'react';
import type { Board, Player } from '../../types';
import { categoryColor } from '../../utils/categories';
import ShapeGlyph from './ShapeGlyph';

interface NeonBoardProps {
	board: Board;
	players: Player[];
	validMoves: number[];
	onMove: (nodeId: number) => void;
}

const tokenOffset = (index: number, total: number): { dx: number; dy: number } => {
	if (total <= 1) return { dx: 0, dy: 0 };
	const angle = (index * 2 * Math.PI) / total;
	return { dx: 7 * Math.cos(angle), dy: 7 * Math.sin(angle) };
};

/**
 * Static SVG board. The whole 43-node Familiar board fits the viewBox, so there is no
 * pan/zoom: every node is always visible and a tap on a highlighted tile moves there.
 * (Pan/zoom was removed in H1 because pointer capture stole the tile click; deferred.)
 */
const NeonBoard: React.FC<NeonBoardProps> = ({ board, players, validMoves, onMove }) => {
	const validSet = new Set(validMoves);

	const occupants = new Map<number, Player[]>();
	for (const player of players) {
		const list = occupants.get(player.position) ?? [];
		list.push(player);
		occupants.set(player.position, list);
	}

	return (
		<svg data-testid="neon-board" viewBox="-120 -120 240 240" className="h-full w-full">
			<title>Neon Quiz board</title>

			{board.nodes.map((node) =>
				node.connectedNodeIds
					.filter((other) => other > node.id)
					.map((other) => {
						const target = board.nodes[other];
						return (
							<line
								key={`${node.id}-${other}`}
								x1={node.x}
								y1={node.y}
								x2={target.x}
								y2={target.y}
								stroke="var(--color-outline)"
								strokeWidth={1.2}
								opacity={0.5}
							/>
						);
					}),
			)}

			{board.nodes.map((node) => {
				const isValid = validSet.has(node.id);
				const color = categoryColor(node.category);
				const radius = node.type === 'NEXUS' ? 13 : node.type === 'SPARK_NODE' ? 10 : 6.5;
				return (
					<g key={node.id}>
						{node.type === 'SPARK_NODE' && (
							<circle
								cx={node.x}
								cy={node.y}
								r={radius + 3}
								fill="none"
								stroke={color}
								strokeWidth={1.5}
								opacity={0.6}
							/>
						)}
						<circle
							cx={node.x}
							cy={node.y}
							r={isValid ? radius + 2 : radius}
							fill={node.type === 'NEXUS' ? 'var(--color-surface-container-highest)' : color}
							stroke={isValid ? 'var(--color-on-surface)' : color}
							strokeWidth={isValid ? 2.5 : 1}
							opacity={node.type === 'NORMAL' && !isValid ? 0.85 : 1}
							style={isValid ? { cursor: 'pointer' } : undefined}
							data-testid={isValid ? `move-${node.id}` : undefined}
							onClick={isValid ? () => onMove(node.id) : undefined}
						/>
						{node.type === 'NEXUS' && (
							<text
								x={node.x}
								y={node.y + 3}
								textAnchor="middle"
								fontSize={7}
								fill="var(--color-on-surface)"
								pointerEvents="none"
							>
								★
							</text>
						)}
					</g>
				);
			})}

			<g pointerEvents="none">
				{[...occupants.entries()].flatMap(([position, list]) => {
					const node = board.nodes[position];
					return list.map((player, index) => {
						const { dx, dy } = tokenOffset(index, list.length);
						return (
							<g key={player.id} transform={`translate(${node.x + dx} ${node.y + dy})`}>
								<foreignObject x={-8} y={-8} width={16} height={16}>
									<ShapeGlyph shape={player.shape} size={16} color="var(--color-on-surface)" />
								</foreignObject>
							</g>
						);
					});
				})}
			</g>
		</svg>
	);
};

export default NeonBoard;
