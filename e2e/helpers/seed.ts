import type { Page } from '@playwright/test';
import type { GameState, HistoryEntry, Player, Preferences } from '../../src/types';
import {
	DEFAULT_PLAYER_ID,
	DEXIE_DB_NAME,
	defaultPlayer,
	defaultPreferences,
	defaultZustandPersist,
	ZUSTAND_STORAGE_KEY,
	type ZustandPersistedState,
} from '../fixtures/state';

export interface SeedOptions {
	zustand?: Partial<ZustandPersistedState>;
	gameState?: Omit<GameState, 'id' | 'playerId'>;
	history?: Omit<HistoryEntry, 'id' | 'playerId'>[];
	extraPlayers?: (Player & { id: number })[];
	extraPreferences?: Preferences[];
	skipPlayer?: boolean;
}

interface DexieSeedPayload {
	dbName: string;
	dexieVersion: number;
	defaultPlayerId: number;
	player: ReturnType<typeof defaultPlayer> | null;
	preferences: ReturnType<typeof defaultPreferences> | null;
	gameState: (Omit<GameState, 'id' | 'playerId'> & { playerId: number }) | null;
	history: (Omit<HistoryEntry, 'id' | 'playerId'> & { playerId: number })[] | null;
	extraPlayers: (Player & { id: number })[] | null;
	extraPreferences: Preferences[] | null;
}

const DEXIE_INTERNAL_VERSION = 20;

const BOOTSTRAP_PATH = '/sudokupado/__e2e_bootstrap__';
const BOOTSTRAP_URL_PATTERN = '**/sudokupado/__e2e_bootstrap__';
const BOOTSTRAP_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>E2E Bootstrap</title></head>
<body>e2e bootstrap</body>
</html>`;

const seedDexieFromBootstrap = (payload: DexieSeedPayload): Promise<void> => {
	const {
		dbName,
		dexieVersion,
		defaultPlayerId,
		player,
		preferences,
		gameState,
		history,
		extraPlayers,
		extraPreferences,
	} = payload;

	return new Promise<void>((resolve, reject) => {
		const deleteRequest = indexedDB.deleteDatabase(dbName);
		deleteRequest.onerror = () => reject(deleteRequest.error);
		deleteRequest.onblocked = () => reject(new Error(`deleteDatabase blocked for ${dbName}`));
		deleteRequest.onsuccess = () => {
			const openRequest = indexedDB.open(dbName, dexieVersion);
			openRequest.onerror = () => reject(openRequest.error);
			openRequest.onblocked = () => reject(new Error(`open blocked for ${dbName}`));

			openRequest.onupgradeneeded = () => {
				const db = openRequest.result;

				const playersStore = db.createObjectStore('players', {
					keyPath: 'id',
					autoIncrement: true,
				});
				playersStore.createIndex('name', 'name');
				playersStore.createIndex('createdAt', 'createdAt');
				playersStore.createIndex('isDeleted', 'isDeleted');

				const prefsStore = db.createObjectStore('preferences', {
					keyPath: 'id',
					autoIncrement: true,
				});
				prefsStore.createIndex('playerId', 'playerId');
				prefsStore.createIndex('difficulty', 'difficulty');

				const historyStore = db.createObjectStore('history', {
					keyPath: 'id',
					autoIncrement: true,
				});
				historyStore.createIndex('playerId', 'playerId');
				historyStore.createIndex('difficulty', 'difficulty');
				historyStore.createIndex('score', 'score');
				historyStore.createIndex('date', 'date');

				const gameStateStore = db.createObjectStore('gameState', {
					keyPath: 'id',
					autoIncrement: true,
				});
				gameStateStore.createIndex('playerId', 'playerId');
			};

			openRequest.onsuccess = () => {
				const db = openRequest.result;
				const stores = ['players', 'preferences', 'gameState', 'history'];
				const tx = db.transaction(stores, 'readwrite');
				tx.onerror = () => reject(tx.error);
				tx.oncomplete = () => {
					db.close();
					resolve();
				};

				if (player) {
					tx.objectStore('players').put({ ...player, id: defaultPlayerId });
				}
				if (preferences) {
					tx.objectStore('preferences').put(preferences);
				}
				if (gameState) {
					tx.objectStore('gameState').put(gameState);
				}
				if (history) {
					const historyStore = tx.objectStore('history');
					for (const entry of history) {
						historyStore.put(entry);
					}
				}
				if (extraPlayers) {
					const playersStore = tx.objectStore('players');
					for (const extraPlayer of extraPlayers) {
						playersStore.put(extraPlayer);
					}
				}
				if (extraPreferences) {
					const prefsStore = tx.objectStore('preferences');
					for (const extraPref of extraPreferences) {
						prefsStore.put(extraPref);
					}
				}
			};
		};
	});
};

export const seedAndNavigate = async (
	page: Page,
	path: string,
	options: SeedOptions = {},
): Promise<void> => {
	const playerId = DEFAULT_PLAYER_ID;
	const zustand = defaultZustandPersist(options.zustand);
	const dexiePayload: DexieSeedPayload = {
		dbName: DEXIE_DB_NAME,
		dexieVersion: DEXIE_INTERNAL_VERSION,
		defaultPlayerId: playerId,
		player: options.skipPlayer ? null : defaultPlayer(),
		preferences: options.skipPlayer
			? null
			: defaultPreferences({
					playerId,
					difficulty: zustand.state.selectedDifficulty,
					allowNotes: zustand.state.allowNotes,
					maxMistakes: zustand.state.maxMistakes,
					maxHints: zustand.state.maxHints,
				}),
		gameState: options.gameState ? { ...options.gameState, playerId } : null,
		history: options.history ? options.history.map((entry) => ({ ...entry, playerId })) : null,
		extraPlayers: options.extraPlayers ?? null,
		extraPreferences: options.extraPreferences ?? null,
	};

	await page.route(BOOTSTRAP_URL_PATTERN, (route) =>
		route.fulfill({
			status: 200,
			contentType: 'text/html',
			body: BOOTSTRAP_HTML,
		}),
	);

	await page.goto(BOOTSTRAP_PATH);

	await page.evaluate(
		({ zustandKey, zustandValue }) => {
			localStorage.clear();
			localStorage.setItem(zustandKey, zustandValue);
		},
		{
			zustandKey: ZUSTAND_STORAGE_KEY,
			zustandValue: JSON.stringify(zustand),
		},
	);

	await page.evaluate(seedDexieFromBootstrap, dexiePayload);

	await page.unroute(BOOTSTRAP_URL_PATTERN);

	await page.goto(path);
};
