import type React from 'react';
import type { ReactNode } from 'react';
import type { Gender } from '../../engine/types';

export interface PortraitProps {
	personId: string;
	gender?: Gender;
	className?: string;
}

// Inherit the container's color so the portrait can be inked, sepia or red
// (victim) depending on where it is used.
const INK = 'currentColor';

const STROKE = {
	stroke: INK,
	fill: 'none',
	strokeWidth: 1.4,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
} as const;

// Stable string hash (same convention as accentTokenForPerson in PersonToken).
// A per-layer offset is mixed in so every layer picks independently from the id.
function layerIndex(personId: string, offset: number, length: number): number {
	let hash = offset;
	for (let i = 0; i < personId.length; i++) {
		hash = (hash * 31 + personId.charCodeAt(i)) | 0;
	}
	return Math.abs(hash) % length;
}

// Head / face outlines, framed as a bust portrait centred on the viewBox.
const HEADS: ReactNode[] = [
	<path key="h0" d="M7 9 C7 5 17 5 17 9 C17 13.5 15 16 12 16 C9 16 7 13.5 7 9 Z" />,
	<path
		key="h1"
		d="M7.5 8 C7.5 5 16.5 5 16.5 8 L16.5 11.5 C16.5 15 14 16 12 16 C10 16 7.5 15 7.5 11.5 Z"
	/>,
	<path
		key="h2"
		d="M12 4.5 C16.5 4.5 17 9 16 12 C15.2 14.5 13.5 16 12 16 C10.5 16 8.8 14.5 8 12 C7 9 7.5 4.5 12 4.5 Z"
	/>,
	<path
		key="h3"
		d="M8 7 C8 4.8 16 4.8 16 7 C17 8 17 12 15.5 14 C14.5 15.4 13.3 16 12 16 C10.7 16 9.5 15.4 8.5 14 C7 12 7 8 8 7 Z"
	/>,
	<path
		key="h4"
		d="M7 10 C7 5.5 17 5.5 17 10 C17 13 14.8 16 12 16 C9.2 16 7 13 7 10 Z M9 13.5 C9.8 15 14.2 15 15 13.5"
	/>,
];

// Hairstyles. The gender bias selects from a slice of this list.
const HAIRS: ReactNode[] = [
	<path key="r0" d="M6.5 9 C6.5 4.5 17.5 4.5 17.5 9 C16.5 7 15 6.5 12 6.5 C9 6.5 7.5 7 6.5 9 Z" />,
	<path
		key="r1"
		d="M6.8 10 C6 5 18 5 17.2 10 C16.5 6.5 14 5.8 12 5.8 C10 5.8 7.5 6.5 6.8 10 Z M6.8 10 L6 13 M17.2 10 L18 13"
	/>,
	<path
		key="r2"
		d="M7 8.5 C7 4 17 4 17 8.5 L17 12 C16.2 11 16 8.5 16 8.5 C14 6.5 10 6.5 8 8.5 C8 8.5 7.8 11 7 12 Z"
	/>,
	<path
		key="r3"
		d="M6.5 9.5 C6.5 4 17.5 4 17.5 9.5 C17 14 17 15 17 15.5 C16.2 12 16 8 12 7 C8 8 7.8 12 7 15.5 C7 15 7 14 6.5 9.5 Z"
	/>,
	<path key="r4" d="M7 7.5 C8.5 5 15.5 5 17 7.5 C15 6.5 13.5 8 12 8 C10.5 8 9 6.5 7 7.5 Z" />,
	<path
		key="r5"
		d="M6.5 8 C6.5 4.2 17.5 4.2 17.5 8 C17.5 9.5 17 10.5 17 10.5 C16 8 14 7 12 7 C10 7 8 8 7 10.5 C7 10.5 6.5 9.5 6.5 8 Z M6.5 8 L5.5 12 M17.5 8 L18.5 12"
	/>,
];

// Eyebrows + eyes. Some variants add spectacles.
const EYES: ReactNode[] = [
	<g key="e0">
		<circle cx={10} cy={10.5} r={0.7} fill={INK} stroke="none" />
		<circle cx={14} cy={10.5} r={0.7} fill={INK} stroke="none" />
	</g>,
	<g key="e1">
		<line x1={9} y1={9.5} x2={11} y2={9.4} />
		<line x1={13} y1={9.4} x2={15} y2={9.5} />
		<circle cx={10} cy={10.7} r={0.7} fill={INK} stroke="none" />
		<circle cx={14} cy={10.7} r={0.7} fill={INK} stroke="none" />
	</g>,
	<g key="e2">
		<circle cx={10} cy={10.5} r={1.6} />
		<circle cx={14} cy={10.5} r={1.6} />
		<line x1={11.6} y1={10.5} x2={12.4} y2={10.5} />
		<line x1={8.4} y1={10.5} x2={7.5} y2={10} />
		<line x1={15.6} y1={10.5} x2={16.5} y2={10} />
	</g>,
	<g key="e3">
		<path d="M9 10.5 C9.5 9.7 10.5 9.7 11 10.5" />
		<path d="M13 10.5 C13.5 9.7 14.5 9.7 15 10.5" />
	</g>,
	<g key="e4">
		<line x1={9} y1={9.2} x2={11} y2={9.6} />
		<line x1={13} y1={9.6} x2={15} y2={9.2} />
		<circle cx={10} cy={10.8} r={0.7} fill={INK} stroke="none" />
		<circle cx={14} cy={10.8} r={0.7} fill={INK} stroke="none" />
	</g>,
];

const NOSES: ReactNode[] = [
	<path key="n0" d="M12 11 L12 12.5 L13 12.7" />,
	<path key="n1" d="M11.6 11 L11.4 12.6 C11.4 13.1 12.6 13.1 12.6 12.6" />,
	<path key="n2" d="M12 11.2 L11.3 12.8 L12.7 12.8 Z" />,
	<path key="n3" d="M12 11 L12 12.8 M11.4 12.8 C11.7 13.2 12.3 13.2 12.6 12.8" />,
	<path key="n4" d="M12.2 11 C12.6 11.8 12.6 12.6 12 12.8" />,
];

const MOUTHS: ReactNode[] = [
	<path key="m0" d="M10.5 14 C11.2 14.8 12.8 14.8 13.5 14" />,
	<path key="m1" d="M10.5 14.2 L13.5 14.2" />,
	<path key="m2" d="M10.5 14.6 C11.2 13.8 12.8 13.8 13.5 14.6" />,
	<path key="m3" d="M10.8 14 C11.4 14.6 12.6 14.6 13.2 14 M10.8 14 L13.2 14" />,
	<path
		key="m4"
		d="M11 14 C11.5 14.5 12.5 14.5 13 14 M11.7 13.6 L11.7 14.4 M12.3 13.6 L12.3 14.4"
	/>,
];

// Optional facial hair / headwear accessory. Index 0 = none.
const ACCESSORIES: ReactNode[] = [
	<g key="a0" />,
	<path key="a1" d="M10 13.4 C11 13 13 13 14 13.4" />,
	<path key="a2" d="M9 13.5 C9 16 15 16 15 13.5 C14 14.5 10 14.5 9 13.5 Z" />,
	<path key="a3" d="M6 6.5 C9 4.5 15 4.5 18 6.5 L17 7 L7 7 Z M5.5 7 L18.5 7" />,
	<path key="a4" d="M10.3 13.2 L10.3 14.6 M13.7 13.2 L13.7 14.6 M10.3 13.6 L13.7 13.6" />,
	<path
		key="a5"
		d="M9.2 13 C9.5 17 14.5 17 14.8 13 C14 13.6 13 14 12 14 C11 14 10 13.6 9.2 13 Z M11.4 14 L11.4 12.8 M12.6 14 L12.6 12.8"
	/>,
];

const FEMININE_BIASED_HAIR = [1, 3, 5] as const;
const MASCULINE_BIASED_HAIR = [0, 2, 4] as const;

function pickHair(personId: string, gender?: Gender): ReactNode {
	if (gender === undefined) {
		return HAIRS[layerIndex(personId, 11, HAIRS.length)];
	}
	const pool = gender === 'feminine' ? FEMININE_BIASED_HAIR : MASCULINE_BIASED_HAIR;
	return HAIRS[pool[layerIndex(personId, 11, pool.length)]];
}

const SHOULDERS = <path d="M4.5 23 C4.5 18.5 7.5 16 12 16 C16.5 16 19.5 18.5 19.5 23" />;

export const Portrait: React.FC<PortraitProps> = ({ personId, gender, className }) => {
	const head = HEADS[layerIndex(personId, 3, HEADS.length)];
	const hair = pickHair(personId, gender);
	const eyes = EYES[layerIndex(personId, 17, EYES.length)];
	const nose = NOSES[layerIndex(personId, 23, NOSES.length)];
	const mouth = MOUTHS[layerIndex(personId, 29, MOUTHS.length)];
	const accessory = ACCESSORIES[layerIndex(personId, 37, ACCESSORIES.length)];

	return (
		<svg
			viewBox="0 0 24 24"
			className={className}
			preserveAspectRatio="xMidYMid meet"
			aria-hidden="true"
			data-person-id={personId}
		>
			<g {...STROKE}>
				{SHOULDERS}
				{head}
				{hair}
				{eyes}
				{nose}
				{mouth}
				{accessory}
			</g>
		</svg>
	);
};

export default Portrait;
