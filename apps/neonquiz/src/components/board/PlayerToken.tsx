import type React from 'react';
import type { Player } from '../../types';
import ShapeGlyph from './ShapeGlyph';

interface PlayerTokenProps {
	player: Player;
	accent: string;
	x: number;
	y: number;
}

/**
 * A player token: a glass disc carrying the player's shape glyph, haloed in their accent
 * colour. The wrapping group glides between tile centres via a CSS transform transition.
 */
const PlayerToken: React.FC<PlayerTokenProps> = ({ player, accent, x, y }) => (
	<g className="nq-token" style={{ transform: `translate(${x}px, ${y}px)` }}>
		<circle r={8.5} fill="#0a0a0fcc" stroke={accent} strokeWidth={1.4} filter="url(#nq-glow)" />
		<foreignObject x={-7} y={-7} width={14} height={14}>
			<ShapeGlyph shape={player.shape} size={14} color={accent} />
		</foreignObject>
	</g>
);

export default PlayerToken;
