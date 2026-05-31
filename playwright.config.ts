import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e/specs',
	snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
	outputDir: 'test-results/',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
	use: {
		baseURL: 'http://localhost:5173/pwarush/sudokupado/',
		trace: 'on-first-retry',
	},
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
			name: 'chromium-desktop',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
		},
		{
			name: 'chromium-mobile',
			use: { ...devices['Pixel 5'] },
		},
	],
	webServer: {
		command: 'npm run dev -- --host 0.0.0.0 --port 5173 --strictPort',
		url: 'http://localhost:5173/pwarush/sudokupado/',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			VITE_E2E: '1',
		},
	},
});
