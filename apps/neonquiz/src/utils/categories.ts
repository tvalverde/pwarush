import type { TriviaCategory } from '../types';

// Colours follow the classic Trivial Pursuit convention (Geography=blue, History=yellow,
// Science=green, Entertainment=pink, Sports=orange, Art≈purple as the closest to brown). The
// category KEYS keep their legacy colour-prefixed names — they are the question data identifiers,
// so only the displayed colour is remapped here.
export const CATEGORY_COLOR: Record<TriviaCategory, string> = {
	EMERALD_GEO: 'var(--color-cat-cyan)', // Geography → blue
	CRIMSON_HIST: 'var(--color-cat-gold)', // History → yellow
	VIOLET_ART: 'var(--color-cat-violet)', // Art & Literature → purple (≈ brown)
	CYAN_SCI: 'var(--color-cat-emerald)', // Science → green
	GOLD_ENT: 'var(--color-cat-crimson)', // Entertainment → pink
	ORANGE_SPORT: 'var(--color-cat-orange)', // Sports → orange
};

export const categoryColor = (category: TriviaCategory | null): string =>
	category ? CATEGORY_COLOR[category] : 'var(--color-outline)';
