import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/inter';
import '@fontsource/orbitron/500.css';
import '@fontsource/orbitron/700.css';
import { installSWUpdateListener } from '@pwarush/core/utils';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

installSWUpdateListener();

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
