import '@testing-library/jest-dom';
import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		clear: () => {
			store = {};
		},
		removeItem: (key: string) => {
			delete store[key];
		},
	};
})();

// Mock Worker for jsdom
const WorkerMock = vi.fn().mockImplementation(function (this: any) {
	this.onmessage = null;
	this.terminate = vi.fn();
	this.postMessage = vi.fn();
	this.addEventListener = vi.fn();
	this.removeEventListener = vi.fn();
	return this;
});

vi.stubGlobal('Worker', WorkerMock);

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
});

// Replace window.location with a mockable object (jsdom's Location.reload is non-configurable)
Object.defineProperty(window, 'location', {
	value: {
		reload: vi.fn(),
		href: 'http://localhost/',
		hostname: 'localhost',
		origin: 'http://localhost',
		pathname: '/',
		search: '',
		hash: '',
		assign: vi.fn(),
		replace: vi.fn(),
		toString: () => 'http://localhost/',
	},
	configurable: true,
	writable: true,
});
