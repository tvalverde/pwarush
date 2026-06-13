import type { Clue, Scene } from '../engine/types';
import type { Language } from '../types';

type Translate = (path: string) => string;

const ORDINALS: Record<Language, string[]> = {
	en: ['first', 'second', 'third', 'fourth', 'fifth'],
	es: ['primera', 'segunda', 'tercera', 'cuarta', 'quinta'],
};

const LAST_ORDINAL: Record<Language, string> = { en: 'last', es: 'última' };

const DIRECTIONS: Record<Language, { north: string; south: string; east: string; west: string }> = {
	en: { north: 'north', south: 'south', east: 'east', west: 'west' },
	es: { north: 'al norte', south: 'al sur', east: 'al este', west: 'al oeste' },
};

const UNITS: Record<
	Language,
	{ row: string; rows: string; column: string; columns: string; and: string }
> = {
	en: { row: 'row', rows: 'rows', column: 'column', columns: 'columns', and: 'and' },
	es: { row: 'fila', rows: 'filas', column: 'columna', columns: 'columnas', and: 'y' },
};

function ordinal(index: number, size: number, lang: Language): string {
	if (index === size - 1) {
		return LAST_ORDINAL[lang];
	}
	return ORDINALS[lang][index] ?? `${index + 1}`;
}

function interpolate(template: string, slots: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => slots[key] ?? `{${key}}`);
}

function offsetPhrase(dRow: number, dCol: number, lang: Language): string {
	const units = UNITS[lang];
	const directions = DIRECTIONS[lang];
	const rowCount = Math.abs(dRow);
	const colCount = Math.abs(dCol);
	const rowWord = rowCount === 1 ? units.row : units.rows;
	const colWord = colCount === 1 ? units.column : units.columns;
	const rowDir = dRow < 0 ? directions.north : directions.south;
	const colDir = dCol < 0 ? directions.west : directions.east;
	return `${rowCount} ${rowWord} ${rowDir} ${units.and} ${colCount} ${colWord} ${colDir}`;
}

export function renderClue(clue: Clue, scene: Scene, t: Translate, lang: Language): string {
	const personName = (id: string): string =>
		scene.cast.find((person) => person.id === id)?.name ?? id;
	const roomName = (roomId: string): string => {
		const nameKey = scene.rooms.find((room) => room.id === roomId)?.nameKey;
		return nameKey ? t(nameKey) : roomId;
	};
	const objectName = (kind: string): string => {
		const nameKey = scene.objects.find((object) => object.kind === kind)?.nameKey;
		return nameKey ? t(nameKey) : kind;
	};
	const template = t(`clue.${clue.type}`);

	switch (clue.type) {
		case 'in_row':
			return interpolate(template, {
				person: personName(clue.person),
				row: ordinal(clue.row, scene.size, lang),
			});
		case 'in_column':
			return interpolate(template, {
				person: personName(clue.person),
				col: ordinal(clue.col, scene.size, lang),
			});
		case 'in_room':
		case 'not_in_room':
			return interpolate(template, {
				person: personName(clue.person),
				room: roomName(clue.room),
			});
		case 'beside_object':
			return interpolate(template, {
				person: personName(clue.person),
				object: objectName(clue.object),
			});
		case 'adjacent_to_person':
		case 'same_room':
		case 'alone_with':
			return interpolate(template, {
				a: personName(clue.a),
				b: personName(clue.b),
			});
		case 'alone':
			return interpolate(template, { person: personName(clue.person) });
		case 'offset':
			return interpolate(template, {
				a: personName(clue.a),
				b: personName(clue.b),
				offset: offsetPhrase(clue.dRow, clue.dCol, lang),
			});
	}
}
