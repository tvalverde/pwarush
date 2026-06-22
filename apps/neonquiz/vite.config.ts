import { resolve } from 'node:path';
import { createPwaConfig, createVersionJsonPlugin } from '@pwarush/core/pwa';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	base: '/pwarush/neonquiz/',
	plugins: [
		createVersionJsonPlugin(),
		tailwindcss(),
		react(),
		VitePWA(
			createPwaConfig({
				name: 'NEON QUIZ',
				shortName: 'Neon Quiz',
				description: 'A neon pass-and-play trivia arena',
				themeColor: '#0a0a0f',
				backgroundColor: '#0a0a0f',
				basePath: '/pwarush/neonquiz/',
				scope: '/pwarush/neonquiz/',
				startUrl: '/pwarush/neonquiz/',
				devOptions: true,
			}),
		),
	],
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
