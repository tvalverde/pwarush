import type React from 'react';

export type PersonTokenVariant = 'suspect' | 'victim';

// Subdued accent tones harmonised with the aged-paper palette. Used only as a
// case-file label band so the token body can stay ink-dark for contrast over
// the light room floors.
const ACCENT_TOKENS = [
	'--color-secondary',
	'--color-outline',
	'--color-tertiary',
	'--color-warning',
	'--color-info',
] as const;

export function accentTokenForPerson(personId: string): string {
	let hash = 0;
	for (let i = 0; i < personId.length; i++) {
		hash = (hash * 31 + personId.charCodeAt(i)) | 0;
	}
	const index = Math.abs(hash) % ACCENT_TOKENS.length;
	return ACCENT_TOKENS[index];
}

interface PersonTokenProps {
	name: string;
	personId: string;
	variant: PersonTokenVariant;
	selected?: boolean;
	murderer?: boolean;
}

const PORTRAIT_PATH = 'M12 7 a3 3 0 1 1 0 6 a3 3 0 0 1 0 -6 M6 20 c0 -4 3 -6 6 -6 c3 0 6 2 6 6';

const PersonToken: React.FC<PersonTokenProps> = ({
	name,
	personId,
	variant,
	selected = false,
	murderer = false,
}) => {
	const initial = name.charAt(0).toUpperCase();
	const isVictim = variant === 'victim';
	const accent = `var(${accentTokenForPerson(personId)})`;
	const ringWidth = murderer ? 1.6 : selected ? 1.1 : 0;
	const portraitColor = isVictim ? 'var(--color-error)' : 'var(--color-on-primary)';

	return (
		<svg
			className="h-full w-full"
			viewBox="0 0 24 24"
			preserveAspectRatio="xMidYMid meet"
			role="img"
			aria-label={name}
			data-variant={variant}
			data-selected={selected ? 'true' : 'false'}
			data-murderer={murderer ? 'true' : 'false'}
		>
			<rect
				x={2}
				y={2}
				width={20}
				height={20}
				rx={3}
				fill={isVictim ? 'var(--color-surface)' : 'var(--color-primary)'}
				stroke={isVictim ? 'var(--color-error)' : 'none'}
				strokeWidth={isVictim ? 1.2 : 0}
				strokeDasharray={isVictim ? '2 1.5' : undefined}
			/>
			<rect x={2} y={2} width={20} height={4} rx={2} fill={accent} />
			<path
				d={PORTRAIT_PATH}
				fill={isVictim ? 'none' : portraitColor}
				stroke={portraitColor}
				strokeWidth={isVictim ? 1.1 : 0}
				strokeLinejoin="round"
				opacity={0.55}
			/>
			<text
				x={12}
				y={16}
				textAnchor="middle"
				fontFamily="var(--font-display)"
				fontSize={10}
				fontWeight="bold"
				fill={isVictim ? 'var(--color-error)' : 'var(--color-on-primary)'}
			>
				{initial}
			</text>
			{ringWidth > 0 && (
				<rect
					x={1.5}
					y={1.5}
					width={21}
					height={21}
					rx={3.5}
					fill="none"
					stroke="var(--color-tertiary)"
					strokeWidth={ringWidth}
				/>
			)}
		</svg>
	);
};

export default PersonToken;
