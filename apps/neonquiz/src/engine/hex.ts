// Flat-top hexagon math for the honeycomb board layout. Pure and deterministic.

export const HEX_SIZE = 15; // lattice circumradius (center-to-corner spacing unit)
export const TILE_RADIUS = 12.5; // normal tile circumradius (slightly < HEX_SIZE → visible gap)
export const SPARK_RADIUS = 16.5; // Spark vertices read as larger, special tiles
export const NEXUS_RADIUS = 18; // the central Nexus is the largest tile

export interface Axial {
	q: number;
	r: number;
}

export interface Point {
	x: number;
	y: number;
}

// The six axial neighbour directions, ordered clockwise from the +q axis. Spoke `c`
// of the board runs along direction `c`; a ring edge advances along direction `c + 2`.
export const HEX_DIRECTIONS: Axial[] = [
	{ q: 1, r: 0 },
	{ q: 1, r: -1 },
	{ q: 0, r: -1 },
	{ q: -1, r: 0 },
	{ q: -1, r: 1 },
	{ q: 0, r: 1 },
];

export const axialToPixel = ({ q, r }: Axial, size = HEX_SIZE): Point => ({
	x: size * (1.5 * q),
	y: size * Math.sqrt(3) * (r + q / 2),
});

export const scaleAxial = (dir: Axial, factor: number): Axial => ({
	q: dir.q * factor,
	r: dir.r * factor,
});

export const addAxial = (a: Axial, b: Axial): Axial => ({ q: a.q + b.q, r: a.r + b.r });

/** Polygon points for a flat-top hexagon centered at (cx, cy), as an SVG `points` string. */
export const hexPolygonPoints = (cx: number, cy: number, radius = TILE_RADIUS): string => {
	const corners: string[] = [];
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i; // flat-top: first corner on the +x axis
		corners.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
	}
	return corners.join(' ');
};
