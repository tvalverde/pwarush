import { describe, expect, it } from 'vitest';
import { courtroom } from '../data/scenes';
import type { Clue } from '../engine/types';
import type { Language } from '../types';
import { renderClue } from '../utils/renderClue';
import { translations } from '../utils/translations';

function makeT(lang: Language) {
	return (path: string): string => {
		const keys = path.split('.');
		let value: unknown = translations[lang];
		for (const key of keys) {
			if (typeof value === 'object' && value !== null && key in value) {
				value = (value as Record<string, unknown>)[key];
			} else {
				return path;
			}
		}
		return typeof value === 'string' ? value : path;
	};
}

const cases: { clue: Clue; en: string; es: string }[] = [
	{
		clue: { type: 'in_row', person: 'mara', row: 1 },
		en: 'Mara was in the second row',
		es: 'Mara estaba en la segunda fila',
	},
	{
		clue: { type: 'in_column', person: 'bo', col: 3 },
		en: 'Bo was in the last column',
		es: 'Bo estaba en la última columna',
	},
	{
		clue: { type: 'in_room', person: 'gemma', room: 'office' },
		en: 'Gemma was in the office',
		es: 'Gemma estaba en el despacho',
	},
	{
		clue: { type: 'not_in_room', person: 'dee', room: 'courtroom' },
		en: 'Dee was not in the courtroom',
		es: 'Dee no estaba en la sala del tribunal',
	},
	{
		clue: { type: 'beside_object', person: 'mara', object: 'desk' },
		en: 'Mara was beside the desk',
		es: 'Mara estaba junto a el escritorio',
	},
	{
		clue: { type: 'adjacent_to_person', a: 'bo', b: 'gemma' },
		en: 'Bo stood next to Gemma',
		es: 'Bo estaba al lado de Gemma',
	},
	{
		clue: { type: 'alone', person: 'dee' },
		en: 'Dee was alone',
		es: 'Dee estaba solo',
	},
	{
		clue: { type: 'alone_with', a: 'mara', b: 'bo' },
		en: 'Mara was alone with Bo',
		es: 'Mara estaba a solas con Bo',
	},
	{
		clue: { type: 'same_room', a: 'gemma', b: 'dee' },
		en: 'Gemma was in the same room as Dee',
		es: 'Gemma estaba en la misma sala que Dee',
	},
	{
		clue: { type: 'offset', a: 'mara', b: 'bo', dRow: -1, dCol: 2 },
		en: 'Mara was 1 row north and 2 columns east of Bo',
		es: 'Mara estaba 1 fila al norte y 2 columnas al este de Bo',
	},
];

describe('renderClue', () => {
	for (const { clue, en, es } of cases) {
		it(`renders ${clue.type} in English`, () => {
			expect(renderClue(clue, courtroom, makeT('en'), 'en')).toBe(en);
		});
		it(`renders ${clue.type} in Spanish`, () => {
			expect(renderClue(clue, courtroom, makeT('es'), 'es')).toBe(es);
		});
	}

	it('uses singular and plural units in the offset phrase', () => {
		const south: Clue = { type: 'offset', a: 'mara', b: 'bo', dRow: 2, dCol: -1 };
		expect(renderClue(south, courtroom, makeT('en'), 'en')).toBe(
			'Mara was 2 rows south and 1 column west of Bo',
		);
	});
});
