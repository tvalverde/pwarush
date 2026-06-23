import { describe, expect, it } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { type Language, translations } from '../utils/translations';

const leafPaths = (node: unknown, prefix = ''): string[] => {
	if (typeof node !== 'object' || node === null) return [prefix];
	return Object.entries(node).flatMap(([key, value]) =>
		leafPaths(value, prefix ? `${prefix}.${key}` : key),
	);
};

describe('translations key parity', () => {
	const locales = Object.keys(translations) as Language[];

	it('defines the exact same key set in every locale', () => {
		const reference = leafPaths(translations.en).sort();
		for (const locale of locales) {
			expect(leafPaths(translations[locale]).sort()).toEqual(reference);
		}
	});

	it('resolves the conclave completion prompts in Spanish instead of echoing the raw path', () => {
		useGameStore.getState().setLanguage('es');
		const t = useGameStore.getState().t;

		for (const path of ['conclave.complete', 'conclave.reminder']) {
			expect(t(path)).not.toBe(path);
			expect(t(path).length).toBeGreaterThan(0);
		}
	});
});
