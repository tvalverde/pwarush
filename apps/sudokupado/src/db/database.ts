import Dexie, { type Table } from 'dexie';
import type { GameState, HistoryEntry, Player, Preferences } from '../types';

export class SudokupadoDB extends Dexie {
	players!: Table<Player>;
	preferences!: Table<Preferences>;
	history!: Table<HistoryEntry>;
	gameState!: Table<GameState>;

	constructor() {
		super('SudokupadoDB');

		// Schema definition
		// ++id for auto-incrementing primary keys
		// Other fields are indexed for fast searching/filtering
		this.version(1).stores({
			players: '++id, name, createdAt, isDeleted',
			preferences: '++id, playerId, difficulty',
			history: '++id, playerId, difficulty, score, date',
			gameState: '++id, playerId',
		});

		this.version(2)
			.stores({
				players: '++id, name, createdAt, isDeleted',
				preferences: '++id, playerId, difficulty',
				history: '++id, playerId, difficulty, score, date',
				gameState: '++id, playerId',
			})
			.upgrade((tx) =>
				tx
					.table<Preferences>('preferences')
					.toCollection()
					.modify((p) => {
						if (typeof p.maxHints !== 'number') p.maxHints = 3;
					}),
			);
	}
}

// Singleton instance for the whole app
export const db = new SudokupadoDB();

if (import.meta.env.VITE_E2E === '1' && typeof window !== 'undefined') {
	(window as unknown as { __db: typeof db }).__db = db;
}
