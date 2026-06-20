import type React from 'react';
import { createRng } from '../../engine/rng';

const VIEW = 135;

// Deterministic faint starfield so the deep-space backdrop is stable across renders.
const PARTICLES = (() => {
	const rng = createRng(0xbeef);
	return Array.from({ length: 46 }, () => ({
		x: (rng() * 2 - 1) * VIEW,
		y: (rng() * 2 - 1) * VIEW,
		r: 0.4 + rng() * 1.1,
		o: 0.12 + rng() * 0.33,
		delay: rng() * 6,
	}));
})();

/** Deep-space backdrop: a radial vignette with a sparse, slowly drifting starfield. */
const BoardBackground: React.FC = () => (
	<g pointerEvents="none">
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
	</g>
);

export default BoardBackground;
