import { resolve } from 'node:path';
import { createPwaConfig, createVersionJsonPlugin } from '@pwarush/core/pwa';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const isE2E = process.env.VITE_E2E === '1';

export default defineConfig({
	base: '/pwarush/elfarsante/',
	plugins: [
		createVersionJsonPlugin(),
		tailwindcss(),
		react(),
		VitePWA(
			createPwaConfig({
				name: 'El Farsante',
				shortName: 'El Farsante',
				description: 'Un trepidante juego local de deducción social.',
				basePath: '/pwarush/elfarsante/',
				scope: '/pwarush/elfarsante/',
				startUrl: '/pwarush/elfarsante/',
				themeColor: '#00E5FF',
				backgroundColor: '#0a0a0a',
				devOptions: true,
				includeAssets: ['favicon.svg', 'icon-192x192.png', 'icon-512x512.png', 'icons.svg'],
				icons: [
					{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
					{ src: 'icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
					{ src: 'icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
				],
			}),
		),
	],
	define: {
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version),
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id: string) {
					if (id.includes('firebase')) return 'vendor-firebase';
					if (id.includes('react')) return 'vendor-react';
				},
			},
		},
	},
	resolve: {
		alias: {
			'@/firebase': resolve(__dirname, isE2E ? 'src/firebase.e2e.ts' : 'src/firebase.ts'),
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
