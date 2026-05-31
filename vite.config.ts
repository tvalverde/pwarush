import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		{
			name: 'generate-version-json',
			closeBundle() {
				writeFileSync(
					resolve(__dirname, 'dist/version.json'),
					JSON.stringify({ version: process.env.npm_package_version ?? '0.0.0' }),
				);
			},
		},
		react(),
		VitePWA({
			registerType: 'prompt',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
			manifest: {
				name: 'SUDOKUPADO',
				short_name: 'Sudokupado',
				description: 'Premium Zen Sudoku Experience',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				icons: [
					{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{
						src: 'pwa-maskable-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				skipWaiting: false,
				navigateFallback: '/sudokupado/index.html',
				navigateFallbackDenylist: [/^\/sudokupado\/version\.json$/, /^\/sudokupado\/assets\//],
			},
		}),
	],
	base: '/sudokupado/',
	define: {
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version),
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/test/setup.ts',
		exclude: ['node_modules', 'dist', 'e2e/**'],
	},
});
