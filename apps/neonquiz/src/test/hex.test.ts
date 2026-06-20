import { describe, expect, it } from 'vitest';
import { axialToPixel, HEX_DIRECTIONS, HEX_SIZE, hexPolygonPoints } from '../engine/hex';

describe('hex math', () => {
	it('places the origin at (0, 0)', () => {
		expect(axialToPixel({ q: 0, r: 0 })).toEqual({ x: 0, y: 0 });
	});

	it('has six distinct, equidistant neighbour directions', () => {
		const pixels = HEX_DIRECTIONS.map((dir) => axialToPixel(dir));
		const distances = pixels.map((p) => Math.hypot(p.x, p.y));
		const unique = new Set(pixels.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`));
		expect(unique.size).toBe(6);
		for (const d of distances) {
			expect(d).toBeCloseTo(Math.sqrt(3) * HEX_SIZE, 5);
		}
	});

	it('builds a flat-top hexagon with six corners', () => {
		const points = hexPolygonPoints(0, 0, 10).split(' ');
		expect(points).toHaveLength(6);
		// flat-top: first corner sits on the +x axis at the radius.
		expect(points[0]).toBe('10,0');
	});
});
