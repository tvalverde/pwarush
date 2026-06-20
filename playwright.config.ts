import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: '.',
	snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
	outputDir: 'test-results/',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01,
			threshold: 0.2,
			animations: 'disabled',
			caret: 'hide',
		},
	},
	projects: [
		{
			name: 'sudokupado-desktop',
			testDir: './apps/sudokupado/e2e/specs',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1280, height: 720 },
				baseURL: 'http://localhost:5173/pwarush/sudokupado/',
				trace: 'on-first-retry',
			},
		},
		{
			name: 'sudokupado-mobile',
			testDir: './apps/sudokupado/e2e/specs',
			use: {
				...devices['Pixel 5'],
				baseURL: 'http://localhost:5173/pwarush/sudokupado/',
				trace: 'on-first-retry',
			},
		},
		{
			name: 'murdokupado-desktop',
			testDir: './apps/murdokupado/e2e/specs',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1280, height: 720 },
				baseURL: 'http://localhost:5174/pwarush/murdokupado/',
				trace: 'on-first-retry',
			},
		},
		{
			name: 'murdokupado-mobile',
			testDir: './apps/murdokupado/e2e/specs',
			use: {
				...devices['Pixel 5'],
				baseURL: 'http://localhost:5174/pwarush/murdokupado/',
				trace: 'on-first-retry',
			},
		},
		{
			name: 'elfarsante-desktop',
			testDir: './apps/elfarsante/e2e/specs',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1280, height: 720 },
				baseURL: 'http://localhost:5175/pwarush/elfarsante/',
				trace: 'on-first-retry',
			},
		},
		{
			name: 'elfarsante-mobile',
			testDir: './apps/elfarsante/e2e/specs',
			use: {
				...devices['Pixel 5'],
				baseURL: 'http://localhost:5175/pwarush/elfarsante/',
				trace: 'on-first-retry',
			},
		},
		{
			name: 'neonquiz-desktop',
			testDir: './apps/neonquiz/e2e/specs',
			use: {
				...devices['Desktop Chrome'],
				viewport: { width: 1280, height: 720 },
				baseURL: 'http://localhost:5176/pwarush/neonquiz/',
				trace: 'on-first-retry',
			},
		},
		{
			name: 'neonquiz-mobile',
			testDir: './apps/neonquiz/e2e/specs',
			use: {
				...devices['Pixel 5'],
				baseURL: 'http://localhost:5176/pwarush/neonquiz/',
				trace: 'on-first-retry',
			},
		},
	],
	webServer: [
		{
			command:
				'npm run dev --workspace=@pwarush/sudokupado -- --host 0.0.0.0 --port 5173 --strictPort',
			url: 'http://localhost:5173/pwarush/sudokupado/',
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				VITE_E2E: '1',
			},
		},
		{
			command:
				'npm run dev --workspace=@pwarush/murdokupado -- --host 0.0.0.0 --port 5174 --strictPort',
			url: 'http://localhost:5174/pwarush/murdokupado/',
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				VITE_E2E: '1',
			},
		},
		{
			command:
				'npm run dev --workspace=@pwarush/elfarsante -- --host 0.0.0.0 --port 5175 --strictPort',
			url: 'http://localhost:5175/pwarush/elfarsante/',
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				VITE_E2E: '1',
			},
		},
		{
			command:
				'npm run dev --workspace=@pwarush/neonquiz -- --host 0.0.0.0 --port 5176 --strictPort',
			url: 'http://localhost:5176/pwarush/neonquiz/',
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			env: {
				VITE_E2E: '1',
			},
		},
	],
});
