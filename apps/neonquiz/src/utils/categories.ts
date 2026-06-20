import type { TriviaCategory } from '../types';

export const CATEGORY_COLOR: Record<TriviaCategory, string> = {
	EMERALD_GEO: 'var(--color-cat-emerald)',
	CRIMSON_HIST: 'var(--color-cat-crimson)',
	VIOLET_ART: 'var(--color-cat-violet)',
	CYAN_SCI: 'var(--color-cat-cyan)',
	GOLD_ENT: 'var(--color-cat-gold)',
	ORANGE_SPORT: 'var(--color-cat-orange)',
};

export const categoryColor = (category: TriviaCategory | null): string =>
	category ? CATEGORY_COLOR[category] : 'var(--color-outline)';
