import { resolve } from 'node:path';
import { createPwaConfig, createVersionJsonPlugin } from '@pwarush/core/pwa';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		createVersionJsonPlugin(),
		tailwindcss(),
		react(),
		VitePWA(
			createPwaConfig({
				name: 'SUDOKUPADO',
				shortName: 'Sudokupado',
				description: 'Premium Zen Sudoku Experience',
				basePath: '/pwarush/sudokupado/',
			}),
		),
	],
	base: '/pwarush/sudokupado/',
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
