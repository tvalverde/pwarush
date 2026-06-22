import type React from 'react';
import { createRng } from '../../engine/rng';

const VIEW = 135;

// Deterministic faint starfield so the deep-space backdrop is stable across renders.
const PARTICLES = (() => {
	const rng = createRng(0xbeef);
	return Array.from({ length: 70 }, () => ({
		x: (rng() * 2 - 1) * VIEW,
		y: (rng() * 2 - 1) * VIEW,
		r: 0.4 + rng() * 1.1,
		o: 0.12 + rng() * 0.33,
		delay: rng() * 6,
	}));
})();

/**
 * Full-bleed deep-space backdrop behind the board: a radial vignette with a sparse, slowly
 * drifting starfield. Uses `slice` so the square artwork covers the whole arena area (between the
 * top and bottom bars) on any aspect ratio, instead of being letterboxed like the board itself.
 */
const BoardBackdrop: React.FC = () => (
	<svg
		aria-hidden="true"
		className="pointer-events-none absolute inset-0 h-full w-full"
		viewBox="-135 -135 270 270"
		preserveAspectRatio="xMidYMid slice"
	>
		<defs>
			<radialGradient id="nq-space" cx="50%" cy="44%" r="80%">
				<stop offset="0%" stopColor="#11111e" />
				<stop offset="58%" stopColor="#0a0a12" />
				<stop offset="100%" stopColor="#050509" />
			</radialGradient>
		</defs>
		<rect x={-VIEW} y={-VIEW} width={VIEW * 2} height={VIEW * 2} fill="url(#nq-space)" />
		<g className="nq-starfield">
			{PARTICLES.map((p) => (
				<circle
					key={`${p.x}-${p.y}`}
					cx={p.x}
					cy={p.y}
					r={p.r}
					fill="#cfe9ff"
					opacity={p.o}
					style={{ animationDelay: `${p.delay}s` }}
				/>
			))}
		</g>
	</svg>
);

export default BoardBackdrop;
