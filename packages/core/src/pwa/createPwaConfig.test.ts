import { describe, expect, it } from 'vitest';
import { createPwaConfig } from './createPwaConfig';

const manifestOf = (config: ReturnType<typeof createPwaConfig>) => {
	const { manifest } = config;
	if (!manifest) throw new Error('manifest should be an object');
	return manifest;
};

describe('createPwaConfig', () => {
	const minimal = createPwaConfig({
		name: 'SUDOKUPADO',
		shortName: 'Sudokupado',
		description: 'Premium Zen Sudoku Experience',
		basePath: '/pwarush/sudokupado/',
	});

	it('builds the shared fixed configuration', () => {
		expect(minimal.registerType).toBe('prompt');
		expect(minimal.includeAssets).toEqual(['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg']);
		expect(manifestOf(minimal)).toMatchObject({
			name: 'SUDOKUPADO',
			short_name: 'Sudokupado',
			description: 'Premium Zen Sudoku Experience',
			theme_color: '#ffffff',
			background_color: '#ffffff',
			display: 'standalone',
			orientation: 'portrait',
		});
		expect(manifestOf(minimal).icons).toHaveLength(3);
	});

	it('derives workbox navigation from basePath', () => {
		expect(minimal.workbox).toMatchObject({
			globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
			cleanupOutdatedCaches: true,
			clientsClaim: true,
			skipWaiting: false,
			navigateFallback: '/pwarush/sudokupado/index.html',
		});
		const denylist = minimal.workbox?.navigateFallbackDenylist ?? [];
		expect(denylist.map(String)).toEqual([
			String(/^\/pwarush\/sudokupado\/version\.json$/),
			String(/^\/pwarush\/sudokupado\/assets\//),
		]);
	});

	it('omits scope, start_url and devOptions when not provided', () => {
		expect('scope' in manifestOf(minimal)).toBe(false);
		expect('start_url' in manifestOf(minimal)).toBe(false);
		expect('devOptions' in minimal).toBe(false);
	});

	it('emits scope, start_url and devOptions when provided', () => {
		const full = createPwaConfig({
			name: 'MURDOKUPADO',
			shortName: 'Murdokupado',
			description: 'A Latin-square detective puzzle — coming soon',
			basePath: '/pwarush/murdokupado/',
			scope: '/pwarush/murdokupado/',
			startUrl: '/pwarush/murdokupado/',
			devOptions: true,
		});

		expect(manifestOf(full)).toMatchObject({
			scope: '/pwarush/murdokupado/',
			start_url: '/pwarush/murdokupado/',
		});
		expect(full.devOptions).toEqual({ enabled: true });
		expect(full.workbox?.navigateFallback).toBe('/pwarush/murdokupado/index.html');
	});
});

describe('createPwaConfig asset overrides', () => {
	const customIcons = [
		{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
		{ src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
	];
	const fontsCaching = [
		{
			urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
			handler: 'CacheFirst' as const,
			options: { cacheName: 'google-fonts-cache' },
		},
	];
	const overridden = createPwaConfig({
		name: 'EL FARSANTE',
		shortName: 'El Farsante',
		description: 'A social deduction party game',
		basePath: '/pwarush/elfarsante/',
		includeAssets: ['favicon.svg', 'sfx/*.mp3'],
		icons: customIcons,
		extraGlobPatterns: ['**/*.mp3'],
		runtimeCaching: fontsCaching,
	});

	it('replaces includeAssets and manifest icons when provided', () => {
		expect(overridden.includeAssets).toEqual(['favicon.svg', 'sfx/*.mp3']);
		expect(manifestOf(overridden).icons).toEqual(customIcons);
	});

	it('appends extraGlobPatterns after the shared base pattern', () => {
		expect(overridden.workbox?.globPatterns).toEqual([
			'**/*.{js,css,html,ico,png,svg,woff2}',
			'**/*.mp3',
		]);
	});

	it('emits runtimeCaching only when provided', () => {
		expect(overridden.workbox?.runtimeCaching).toEqual(fontsCaching);
		const minimal = createPwaConfig({
			name: 'SUDOKUPADO',
			shortName: 'Sudokupado',
			description: 'Premium Zen Sudoku Experience',
			basePath: '/pwarush/sudokupado/',
		});
		expect(minimal.workbox && 'runtimeCaching' in minimal.workbox).toBe(false);
	});

	it('keeps shared defaults untouched for existing consumers', () => {
		const minimal = createPwaConfig({
			name: 'SUDOKUPADO',
			shortName: 'Sudokupado',
			description: 'Premium Zen Sudoku Experience',
			basePath: '/pwarush/sudokupado/',
		});
		expect(minimal.includeAssets).toEqual(['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg']);
		expect(minimal.workbox?.globPatterns).toEqual(['**/*.{js,css,html,ico,png,svg,woff2}']);
		expect(manifestOf(minimal).icons).toHaveLength(3);
	});
});
