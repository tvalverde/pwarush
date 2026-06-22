import '@testing-library/jest-dom';
import { vi } from 'vitest';
import 'fake-indexeddb/auto';

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
