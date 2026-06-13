import { resolve } from 'node:path';
import { createPwaConfig, createVersionJsonPlugin } from '@pwarush/core/pwa';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	base: '/pwarush/murdokupado/',
	plugins: [
		createVersionJsonPlugin(),
		tailwindcss(),
		react(),
		VitePWA(
			createPwaConfig({
				name: 'MURDOKUPADO',
				shortName: 'Murdokupado',
				description: 'A Latin-square detective puzzle — coming soon',
				basePath: '/pwarush/murdokupado/',
				scope: '/pwarush/murdokupado/',
				startUrl: '/pwarush/murdokupado/',
				devOptions: true,
			}),
		),
	],
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
