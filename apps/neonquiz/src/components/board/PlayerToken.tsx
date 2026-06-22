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
 * colour and lifted off the board by a cast shadow so it reads as a piece placed on top. A
 * dark separation rim keeps the token from merging into a tile that shares its accent colour.
 * The wrapping group glides between tile centres via a CSS transform transition.
 */
const PlayerToken: React.FC<PlayerTokenProps> = ({ player, accent, x, y }) => (
	<g className="nq-token" style={{ transform: `translate(${x}px, ${y}px)` }}>
		<g filter="url(#nq-token-shadow)">
			{/* dark rim → a constant separation from the board, whatever the tile colour */}
			<circle r={9.3} fill="#05050a" />
			{/* opaque glass disc haloed in the player's accent */}
			<circle r={8.4} fill="#0b0b14" stroke={accent} strokeWidth={1.8} filter="url(#nq-glow)" />
			{/* faint glassy highlight, brighter than any accent → keeps the rim crisp */}
			<circle r={6.6} fill="none" stroke="#eaf7ff" strokeWidth={0.5} opacity={0.3} />
		</g>
		<foreignObject x={-7} y={-7} width={14} height={14}>
			<ShapeGlyph shape={player.shape} size={14} color={accent} />
		</foreignObject>
	</g>
);

export default PlayerToken;
