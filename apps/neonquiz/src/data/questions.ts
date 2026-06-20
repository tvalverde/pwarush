import type { Question } from '../types';
import arte from './questions/arte.json';
import arteKids from './questions/arte_kids.json';
import ciencia from './questions/ciencia.json';
import cienciaKids from './questions/ciencia_kids.json';
import deportes from './questions/deportes.json';
import deportesKids from './questions/deportes_kids.json';
import entretenimiento from './questions/entretenimiento.json';
import entretenimientoKids from './questions/entretenimiento_kids.json';
import geografia from './questions/geografia.json';
import geografiaKids from './questions/geografia_kids.json';
import historia from './questions/historia.json';
import historiaKids from './questions/historia_kids.json';

// The 12 source files are concatenated at build time. Each object is validated by
// `isValidQuestion` (utils/schemas) before any Dexie write — see db/seed.ts (rule 17).
const RAW_QUESTIONS: readonly unknown[] = [
	...arte,
	...arteKids,
	...ciencia,
	...cienciaKids,
	...deportes,
	...deportesKids,
	...entretenimiento,
	...entretenimientoKids,
	...geografia,
	...geografiaKids,
	...historia,
	...historiaKids,
];

export const RAW_QUESTION_SEED = RAW_QUESTIONS as Question[];
