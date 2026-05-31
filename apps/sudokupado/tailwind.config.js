/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				background: '#FFFFFF',
				'primary-text': '#0F172A',
				'dark-accent': '#0F172A',
				border: '#E2E8F0',
				'subtle-accent': '#E2E8F0',
				'subtle-bg': '#F1F5F9',
				// Material-like palette from DESIGN.md YAML
				surface: '#f6fafe',
				primary: '#000000',
				secondary: '#595f66',
				error: '#ba1a1a',
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				hanken: ['"Hanken Grotesk"', 'sans-serif'],
			},
			letterSpacing: {
				'widest-premium': '0.15em',
				'wide-premium': '0.1em',
			},
			borderRadius: {
				sm: '0.5rem',
				DEFAULT: '1rem',
				md: '1.5rem',
				lg: '2rem',
				xl: '3rem',
			},
			spacing: {
				'8px': '8px',
				'16px': '16px',
				'20px': '20px',
			},
			maxWidth: {
				container: '448px',
			},
			keyframes: {
				shake: {
					'0%, 100%': { transform: 'translateX(0)' },
					'25%': { transform: 'translateX(-4px)' },
					'75%': { transform: 'translateX(4px)' },
				},
			},
			animation: {
				shake: 'shake 0.2s ease-in-out 0s 2',
			},
		},
	},
	plugins: [],
};
