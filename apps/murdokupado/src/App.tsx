import { Layout } from '@pwarush/core/ui';
import { lazy, Suspense } from 'react';
import AppConfirmDialog from './components/AppConfirmDialog';
import { useAutoSave } from './hooks/useAutoSave';
import { useGameStore } from './store/gameStore';

const MainMenuScreen = lazy(() => import('./components/MainMenuScreen'));
const GameScreen = lazy(() => import('./components/GameScreen'));
const ResultScreen = lazy(() => import('./components/ResultScreen'));

export default function App() {
	const activeScreen = useGameStore((s) => s.activeScreen);
	const t = useGameStore((s) => s.t);

	useAutoSave();

	const renderScreen = () => {
		switch (activeScreen) {
			case 'game':
				return <GameScreen />;
			case 'result':
				return <ResultScreen />;
			default:
				return <MainMenuScreen />;
		}
	};

	return (
		<Layout>
			<Suspense
				fallback={
					<div className="flex h-full items-center justify-center font-hanken text-xs uppercase tracking-widest-premium text-secondary animate-pulse">
						{t('app.loading')}
					</div>
				}
			>
				{renderScreen()}
			</Suspense>
			<AppConfirmDialog />
		</Layout>
	);
}
