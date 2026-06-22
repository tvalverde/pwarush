import { describe, expect, it } from 'vitest';
import { categoryColor } from '../utils/categories';

describe('category colours follow the Trivial Pursuit convention', () => {
	it('maps each category to its classic colour', () => {
		expect(categoryColor('EMERALD_GEO')).toBe('var(--color-cat-cyan)'); // Geography → blue
		expect(categoryColor('CRIMSON_HIST')).toBe('var(--color-cat-gold)'); // History → yellow
		expect(categoryColor('CYAN_SCI')).toBe('var(--color-cat-emerald)'); // Science → green
		expect(categoryColor('GOLD_ENT')).toBe('var(--color-cat-crimson)'); // Entertainment → pink
		expect(categoryColor('VIOLET_ART')).toBe('var(--color-cat-violet)'); // Art → purple
		expect(categoryColor('ORANGE_SPORT')).toBe('var(--color-cat-orange)'); // Sports → orange
	});

	it('falls back to the outline colour for no category', () => {
		expect(categoryColor(null)).toBe('var(--color-outline)');
	});
});
