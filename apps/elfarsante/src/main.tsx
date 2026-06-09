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
