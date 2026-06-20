import type React from 'react';
import type { PlayerShape } from '../../types';

interface ShapeGlyphProps {
	shape: PlayerShape;
	size?: number;
	color?: string;
	className?: string;
}

const polygonPoints = (sides: number, radius: number, rotation: number): string => {
	const points: string[] = [];
	for (let i = 0; i < sides; i++) {
		const angle = rotation + (i * 2 * Math.PI) / sides;
		points.push(`${radius * Math.cos(angle)},${radius * Math.sin(angle)}`);
	}
	return points.join(' ');
};

/** Renders one of the six player token shapes as a neon-stroked SVG glyph. */
const ShapeGlyph: React.FC<ShapeGlyphProps> = ({
	shape,
	size = 24,
	color = 'currentColor',
	className,
}) => {
	const r = 9;
	const common = {
		fill: color,
		stroke: color,
		strokeWidth: 1,
		strokeLinejoin: 'round' as const,
	};

	return (
		<svg
			viewBox="-12 -12 24 24"
			width={size}
			height={size}
			className={className}
			role="img"
			aria-label={shape}
		>
			{shape === 'CIRCLE' && <circle cx="0" cy="0" r={r} {...common} />}
			{shape === 'TRIANGLE' && <polygon points={polygonPoints(3, r, -Math.PI / 2)} {...common} />}
			{shape === 'SQUARE' && <polygon points={polygonPoints(4, r, Math.PI / 4)} {...common} />}
			{shape === 'RHOMBUS' && <polygon points={polygonPoints(4, r, 0)} {...common} />}
			{shape === 'PENTAGON' && <polygon points={polygonPoints(5, r, -Math.PI / 2)} {...common} />}
			{shape === 'HEXAGON' && <polygon points={polygonPoints(6, r, 0)} {...common} />}
		</svg>
	);
};

export default ShapeGlyph;
