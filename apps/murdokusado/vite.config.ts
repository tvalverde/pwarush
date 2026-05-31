import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	base: '/pwarush/murdokusado/',
	plugins: [
		react(),
		VitePWA({
			registerType: 'prompt',
			devOptions: { enabled: true },
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
			manifest: {
				name: 'MURDOKUSADO',
				short_name: 'Murdokusado',
				description: 'A Latin-square detective puzzle — coming soon',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/pwarush/murdokusado/',
				start_url: '/pwarush/murdokusado/',
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
				navigateFallback: '/pwarush/murdokusado/index.html',
				navigateFallbackDenylist: [/^\/pwarush\/murdokusado\/assets\//],
			},
		}),
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
});
