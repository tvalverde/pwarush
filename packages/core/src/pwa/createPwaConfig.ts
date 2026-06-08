import type { VitePWAOptions } from 'vite-plugin-pwa';

export interface PwaAppConfig {
	name: string;
	shortName: string;
	description: string;
	basePath: string;
	themeColor?: string;
	backgroundColor?: string;
	scope?: string;
	startUrl?: string;
	devOptions?: boolean;
}

const PWA_ICONS = [
	{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
	{ src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
	{ src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

export function createPwaConfig(config: PwaAppConfig): Partial<VitePWAOptions> {
	const {
		name,
		shortName,
		description,
		basePath,
		themeColor = '#ffffff',
		backgroundColor = '#ffffff',
		scope,
		startUrl,
		devOptions,
	} = config;

	const escapedBase = basePath.replace(/\//g, '\\/');

	return {
		registerType: 'prompt',
		...(devOptions !== undefined && { devOptions: { enabled: devOptions } }),
		includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
		manifest: {
			name,
			short_name: shortName,
			description,
			theme_color: themeColor,
			background_color: backgroundColor,
			display: 'standalone',
			orientation: 'portrait',
			...(scope !== undefined && { scope }),
			...(startUrl !== undefined && { start_url: startUrl }),
			icons: PWA_ICONS,
		},
		workbox: {
			globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
			cleanupOutdatedCaches: true,
			clientsClaim: true,
			skipWaiting: false,
			navigateFallback: `${basePath}index.html`,
			navigateFallbackDenylist: [
				new RegExp(`^${escapedBase}version\\.json$`),
				new RegExp(`^${escapedBase}assets\\/`),
			],
		},
	};
}
