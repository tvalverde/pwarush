import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-ext-400.css';
import '@fontsource/plus-jakarta-sans/latin-ext-500.css';
import '@fontsource/plus-jakarta-sans/latin-ext-600.css';
import '@fontsource/plus-jakarta-sans/latin-ext-700.css';
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/space-grotesk/latin-ext-400.css';
import '@fontsource/space-grotesk/latin-ext-500.css';
import '@fontsource/space-grotesk/latin-ext-600.css';
import '@fontsource/space-grotesk/latin-ext-700.css';
import './assets/fonts/material-symbols-outlined.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { GameStateProvider } from './context/GameStateContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';

import { I18nProvider } from './i18n/I18nContext.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<I18nProvider>
			<AuthProvider>
				<GameStateProvider>
					<ToastProvider>
						<App />
					</ToastProvider>
				</GameStateProvider>
			</AuthProvider>
		</I18nProvider>
	</StrictMode>,
);
