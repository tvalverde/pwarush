/*
  In-memory replacement of the firebase facade for Playwright runs.
  vite.config.ts aliases '@/firebase' to this module when VITE_E2E=1, so the
  real SDK is never bundled and specs can drive sync flows through
  window.__e2eFirestore without network access.
*/

type DocData = Record<string, unknown>;

interface DocRef {
	kind: 'doc';
	path: string;
	id: string;
}

interface CollectionRef {
	kind: 'collection';
	path: string;
}

interface WhereFilter {
	field: string;
	value: unknown;
}

interface QueryRef {
	kind: 'query';
	path: string;
	filters: WhereFilter[];
}

const store = new Map<string, DocData>();
const listeners = new Set<() => void>();

const SERVER_TIMESTAMP = Symbol('serverTimestamp');
const DELETE_FIELD = Symbol('deleteField');
const ARRAY_UNION = Symbol('arrayUnion');

interface ArrayUnionMarker {
	marker: typeof ARRAY_UNION;
	values: unknown[];
}

const isArrayUnion = (value: unknown): value is ArrayUnionMarker =>
	typeof value === 'object' && value !== null && (value as ArrayUnionMarker).marker === ARRAY_UNION;

function materialize(existing: DocData, incoming: DocData): DocData {
	const next: DocData = { ...existing };
	for (const [key, value] of Object.entries(incoming)) {
		if (value === DELETE_FIELD) {
			delete next[key];
		} else if (value === SERVER_TIMESTAMP) {
			next[key] = new Date();
		} else if (isArrayUnion(value)) {
			const current = Array.isArray(next[key]) ? (next[key] as unknown[]) : [];
			next[key] = [...current, ...value.values.filter((v) => !current.includes(v))];
		} else {
			next[key] = value;
		}
	}
	return next;
}

function notify() {
	for (const listener of [...listeners]) {
		try {
			listener();
		} catch (error) {
			// Firestore isolates listener exceptions from writers; mirror that
			console.error('[firebase.e2e] snapshot listener failed:', error);
		}
	}
}

const SNAPSHOT_METADATA = { hasPendingWrites: false, fromCache: false };

function docSnapshot(path: string) {
	const data = store.get(path);
	return {
		id: path.split('/').pop() as string,
		exists: () => data !== undefined,
		data: () => data,
		metadata: SNAPSHOT_METADATA,
	};
}

function queryDocs(target: CollectionRef | QueryRef) {
	const prefix = `${target.path}/`;
	const depth = target.path.split('/').length + 1;
	const filters = target.kind === 'query' ? target.filters : [];
	const docs = [...store.entries()]
		.filter(([path]) => path.startsWith(prefix) && path.split('/').length === depth)
		.filter(([, data]) => filters.every((filter) => data[filter.field] === filter.value))
		.map(([path]) => docSnapshot(path));
	return { empty: docs.length === 0, docs, metadata: SNAPSHOT_METADATA };
}

export type User = { uid: string };

export const auth = { currentUser: { uid: 'e2e-user' } };
export const db = {};

export const initAuth = () => Promise.resolve({ user: auth.currentUser });

export function onAuthStateChanged(_auth: unknown, callback: (user: User) => void) {
	const timer = setTimeout(() => callback(auth.currentUser), 0);
	return () => clearTimeout(timer);
}

export function doc(_db: unknown, ...segments: string[]): DocRef {
	const path = segments.join('/');
	return { kind: 'doc', path, id: segments[segments.length - 1] };
}

export function collection(_db: unknown, ...segments: string[]): CollectionRef {
	return { kind: 'collection', path: segments.join('/') };
}

export function where(field: string, _op: string, value: unknown): WhereFilter {
	return { field, value };
}

export function query(target: CollectionRef, ...filters: WhereFilter[]): QueryRef {
	return { kind: 'query', path: target.path, filters };
}

export const getDoc = (ref: DocRef) => Promise.resolve(docSnapshot(ref.path));

export const getDocs = (target: CollectionRef | QueryRef) => Promise.resolve(queryDocs(target));

export function setDoc(ref: DocRef, data: DocData, options?: { merge?: boolean }) {
	const base = options?.merge ? (store.get(ref.path) ?? {}) : {};
	store.set(ref.path, materialize(base, data));
	notify();
	return Promise.resolve();
}

export function updateDoc(ref: DocRef, data: DocData) {
	store.set(ref.path, materialize(store.get(ref.path) ?? {}, data));
	notify();
	return Promise.resolve();
}

export function onSnapshot(
	target: DocRef | CollectionRef | QueryRef,
	callback: (snapshot: never) => void,
) {
	const emit = () => {
		const snapshot = target.kind === 'doc' ? docSnapshot(target.path) : queryDocs(target);
		callback(snapshot as never);
	};
	listeners.add(emit);
	queueMicrotask(emit);
	return () => {
		listeners.delete(emit);
	};
}

export const serverTimestamp = () => SERVER_TIMESTAMP;

export const arrayUnion = (...values: unknown[]): ArrayUnionMarker => ({
	marker: ARRAY_UNION,
	values,
});

export const deleteField = () => DELETE_FIELD;

declare global {
	interface Window {
		__e2eFirestore?: {
			seed: (path: string, data: DocData) => void;
			read: (path: string) => DocData | undefined;
		};
	}
}

if (typeof window !== 'undefined') {
	window.__e2eFirestore = {
		seed: (path, data) => {
			store.set(path, materialize(store.get(path) ?? {}, data));
			notify();
		},
		read: (path) => store.get(path),
	};
}
