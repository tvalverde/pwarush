import type React from 'react';
import type { Board, Player } from '../../types';
import { playerColor } from '../../utils/players';
import BoardDefs from './BoardDefs';
import HexTile from './HexTile';
import PlayerToken from './PlayerToken';

interface NeonBoardProps {
	board: Board;
	players: Player[];
	validMoves: number[];
	onMove: (nodeId: number) => void;
	nexusActive: boolean;
}

const tokenOffset = (index: number, total: number): { dx: number; dy: number } => {
	if (total <= 1) return { dx: 0, dy: 0 };
	const angle = (index * 2 * Math.PI) / total;
	return { dx: 7 * Math.cos(angle), dy: 7 * Math.sin(angle) };
};

/**
 * Static SVG board: a flat-top hexagonal honeycomb of glass tiles over a deep-space
 * backdrop. The whole board fits the viewBox (no pan/zoom), and a tap on a highlighted
 * tile moves there. Light connectors trace the graph; those touching a legal destination
 * glow to guide the move.
 */
const NeonBoard: React.FC<NeonBoardProps> = ({
	board,
	players,
	validMoves,
	onMove,
	nexusActive,
}) => {
	const validSet = new Set(validMoves);
	const hasValidMoves = validSet.size > 0;

	const occupants = new Map<number, { player: Player; accent: string }[]>();
	players.forEach((player, index) => {
		const entry = { player, accent: playerColor(player, index) };
		const list = occupants.get(player.position) ?? [];
		list.push(entry);
		occupants.set(player.position, list);
	});

	return (
		<svg data-testid="neon-board" viewBox="-135 -135 270 270" className="relative h-full w-full">
			<title>Neon Quiz board</title>
			<BoardDefs />

			<g>
				{board.nodes.flatMap((node) =>
					node.connectedNodeIds
						.filter((other) => other > node.id)
						.map((other) => {
							const target = board.nodes[other];
							const active = validSet.has(node.id) || validSet.has(other);
							return (
								<line
									key={`${node.id}-${other}`}
									x1={node.x}
									y1={node.y}
									x2={target.x}
									y2={target.y}
									className={active ? 'nq-link nq-link-active' : 'nq-link'}
									stroke={active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'}
									strokeWidth={active ? 3 : 1.6}
									opacity={active ? 1 : 0.45}
									filter={active ? 'url(#nq-glow)' : undefined}
								/>
							);
						}),
				)}
			</g>

			{board.nodes.map((node) => (
				<HexTile
					key={node.id}
					node={node}
					isValid={validSet.has(node.id)}
					dimmed={hasValidMoves && !validSet.has(node.id)}
					nexusActive={nexusActive}
					onMove={onMove}
				/>
			))}

			<g pointerEvents="none">
				{[...occupants.entries()].flatMap(([position, list]) => {
					const node = board.nodes[position];
					return list.map((entry, index) => {
						const { dx, dy } = tokenOffset(index, list.length);
						return (
							<PlayerToken
								key={entry.player.id}
								player={entry.player}
								accent={entry.accent}
								x={node.x + dx}
								y={node.y + dy}
							/>
						);
					});
				})}
			</g>
		</svg>
	);
};

export default NeonBoard;
