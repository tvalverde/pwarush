import type React from 'react';

interface DiceProps {
	value: number | null;
	size?: number;
}

const PIPS: Record<number, [number, number][]> = {
	1: [[1, 1]],
	2: [
		[0, 0],
		[2, 2],
	],
	3: [
		[0, 0],
		[1, 1],
		[2, 2],
	],
	4: [
		[0, 0],
		[0, 2],
		[2, 0],
		[2, 2],
	],
	5: [
		[0, 0],
		[0, 2],
		[1, 1],
		[2, 0],
		[2, 2],
	],
	6: [
		[0, 0],
		[0, 1],
		[0, 2],
		[2, 0],
		[2, 1],
		[2, 2],
	],
};

/** A neon die face. Shows pips for the rolled value, or a hollow prompt when null. */
const Dice: React.FC<DiceProps> = ({ value, size = 56 }) => {
	const pips = value ? PIPS[value] : [];
	return (
		<svg
			key={value ?? 'empty'}
			viewBox="0 0 3 3"
			width={size}
			height={size}
			role="img"
			aria-label={value ? `Dice showing ${value}` : 'Dice'}
			className="nq-dice"
		>
			<rect
				x={0.1}
				y={0.1}
				width={2.8}
				height={2.8}
				rx={0.18}
				fill="var(--color-surface-container-high)"
				stroke="var(--color-primary)"
				strokeWidth={0.12}
			/>
			{pips.map(([col, row]) => (
				<circle
					key={`${col}-${row}`}
					cx={col + 0.5}
					cy={row + 0.5}
					r={0.28}
					fill="var(--color-primary)"
				/>
			))}
		</svg>
	);
};

export default Dice;
