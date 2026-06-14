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
		es: 'Dee estaba sola',
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
		clue: { type: 'not_alone_with', a: 'mara', b: 'bo' },
		en: 'Mara was not alone with Bo',
		es: 'Mara no estaba a solas con Bo',
	},
	{
		clue: { type: 'offset', a: 'mara', b: 'bo', dRow: -1, dCol: 2 },
		en: 'Mara was 1 cell north and 2 cells east of Bo',
		es: 'Mara estaba 1 casilla al norte y 2 casillas al este de Bo',
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

	it('uses singular and plural cell units in the offset phrase', () => {
		const south: Clue = { type: 'offset', a: 'mara', b: 'bo', dRow: 2, dCol: -1 };
		expect(renderClue(south, courtroom, makeT('en'), 'en')).toBe(
			'Mara was 2 cells south and 1 cell west of Bo',
		);
	});

	it('agrees gender in the Spanish alone clue', () => {
		// Dee is feminine, Bo is masculine in the courtroom cast.
		expect(renderClue({ type: 'alone', person: 'dee' }, courtroom, makeT('es'), 'es')).toBe(
			'Dee estaba sola',
		);
		expect(renderClue({ type: 'alone', person: 'bo' }, courtroom, makeT('es'), 'es')).toBe(
			'Bo estaba solo',
		);
	});

	it('never phrases clues in terms of absolute rows or columns', () => {
		for (const { clue } of cases) {
			const en = renderClue(clue, courtroom, makeT('en'), 'en');
			const es = renderClue(clue, courtroom, makeT('es'), 'es');
			expect(en).not.toMatch(/\brow\b|\bcolumn\b/);
			expect(es).not.toMatch(/\bfila\b|\bcolumna\b/);
		}
	});
});
