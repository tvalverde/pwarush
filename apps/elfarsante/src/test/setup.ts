import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@/firebase', () => ({
	auth: {},
	db: {},
	initAuth: vi.fn(() => Promise.resolve({})),
	onAuthStateChanged: vi.fn(() => vi.fn()),
	doc: vi.fn(),
	getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
	getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
	setDoc: vi.fn(() => Promise.resolve()),
	updateDoc: vi.fn(() => Promise.resolve()),
	collection: vi.fn(),
	query: vi.fn(),
	where: vi.fn(),
	onSnapshot: vi.fn(() => vi.fn()),
	serverTimestamp: vi.fn(() => new Date()),
	arrayUnion: vi.fn((...values: unknown[]) => values),
	deleteField: vi.fn(),
}));
