import type React from 'react';

/** Shared SVG gradients and the single reusable neon-glow filter (declared once per board). */
const BoardDefs: React.FC = () => (
	<defs>
		<radialGradient id="nq-glass" cx="50%" cy="36%" r="78%">
			<stop offset="0%" stopColor="#23233a" />
			<stop offset="100%" stopColor="#0c0c14" />
		</radialGradient>

		<radialGradient id="nq-space" cx="50%" cy="44%" r="80%">
			<stop offset="0%" stopColor="#11111e" />
			<stop offset="58%" stopColor="#0a0a12" />
			<stop offset="100%" stopColor="#050509" />
		</radialGradient>

		<radialGradient id="nq-core" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stopColor="#ffffff" />
			<stop offset="42%" stopColor="#9cf6ff" />
			<stop offset="100%" stopColor="#00343d" />
		</radialGradient>

		<filter id="nq-glow" x="-60%" y="-60%" width="220%" height="220%">
			<feGaussianBlur stdDeviation="2.2" result="blur" />
			<feMerge>
				<feMergeNode in="blur" />
				<feMergeNode in="SourceGraphic" />
			</feMerge>
		</filter>

		{/* Cast shadow that lifts a player token off the board so it reads as placed on top. */}
		<filter id="nq-token-shadow" x="-70%" y="-70%" width="240%" height="260%">
			<feDropShadow dx="0" dy="2.4" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.65" />
		</filter>
	</defs>
);

export default BoardDefs;
