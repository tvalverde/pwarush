import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	base: '/pwarush/murdokupado/',
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
			devOptions: { enabled: true },
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
			manifest: {
				name: 'MURDOKUPADO',
				short_name: 'Murdokupado',
				description: 'A Latin-square detective puzzle — coming soon',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/pwarush/murdokupado/',
				start_url: '/pwarush/murdokupado/',
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
				navigateFallback: '/pwarush/murdokupado/index.html',
				navigateFallbackDenylist: [
					/^\/pwarush\/murdokupado\/version\.json$/,
					/^\/pwarush\/murdokupado\/assets\//,
				],
			},
		}),
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
});
