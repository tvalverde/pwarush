import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/inter';
import { installSWUpdateListener } from '@pwarush/core/utils';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useGameStore } from './store/gameStore';

window.addEventListener('beforeinstallprompt', (e) => {
	// Prevent Chrome 67 and earlier from automatically showing the prompt
	e.preventDefault();
	// Stash the event so it can be triggered later.
	useGameStore.getState().setDeferredPrompt(e);
});

installSWUpdateListener();

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
