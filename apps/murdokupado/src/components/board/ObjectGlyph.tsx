import type React from 'react';
import type { ReactNode } from 'react';
import type { ObjectKind } from '../../engine/types';

const STROKE = {
	stroke: 'var(--color-secondary)',
	fill: 'none',
	strokeWidth: 1.8,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
} as const;

const GLYPHS: Record<ObjectKind, ReactNode> = {
	desk: (
		<g {...STROKE}>
			<rect x={4} y={8} width={16} height={3} rx={0.5} />
			<line x1={6} y1={11} x2={6} y2={19} />
			<line x1={18} y1={11} x2={18} y2={19} />
		</g>
	),
	bench: (
		<g {...STROKE}>
			<rect x={5} y={11} width={14} height={3} rx={0.5} />
			<line x1={5} y1={8} x2={5} y2={14} />
			<line x1={19} y1={8} x2={19} y2={14} />
			<line x1={7} y1={14} x2={7} y2={18} />
			<line x1={17} y1={14} x2={17} y2={18} />
		</g>
	),
	flag: (
		<g {...STROKE}>
			<line x1={7} y1={4} x2={7} y2={20} />
			<path d="M7 5 L18 8 L7 11 Z" />
		</g>
	),
	register: (
		<g {...STROKE}>
			<rect x={5} y={9} width={14} height={9} rx={1} />
			<rect x={8} y={5} width={8} height={4} rx={0.5} />
			<line x1={8} y1={13} x2={16} y2={13} />
		</g>
	),
	shelf: (
		<g {...STROKE}>
			<rect x={6} y={4} width={12} height={16} rx={0.5} />
			<line x1={6} y1={10} x2={18} y2={10} />
			<line x1={6} y1={15} x2={18} y2={15} />
		</g>
	),
	plant: (
		<g {...STROKE}>
			<path d="M9 19 L10 13 L14 13 L15 19 Z" />
			<path d="M12 13 C12 8 9 6 8 6 C8 9 10 11 12 13 Z" />
			<path d="M12 13 C12 8 15 6 16 6 C16 9 14 11 12 13 Z" />
		</g>
	),
	puddle: (
		<g {...STROKE}>
			<path d="M5 13 C5 9 9 9 11 11 C13 8 18 9 18 13 C18 17 13 18 11 16 C9 18 5 17 5 13 Z" />
		</g>
	),
};

const ObjectGlyph: React.FC<{ kind: ObjectKind }> = ({ kind }) => <>{GLYPHS[kind]}</>;

export default ObjectGlyph;
