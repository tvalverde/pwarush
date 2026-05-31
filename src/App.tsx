import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import BottomNavBar from './components/BottomNavBar';
import ConfirmDialog from './components/ConfirmDialog';
import Layout from './components/Layout';
import OrientationOverlay from './components/OrientationOverlay';
import ReloadPrompt from './components/ReloadPrompt';
import { useAutoSave } from './hooks/useAutoSave';
import { useGameStore } from './store/gameStore';

// Lazy loading screens
const MainMenuScreen = lazy(() => import('./components/MainMenuScreen'));
const GameScreen = lazy(() => import('./components/GameScreen'));
const TrophiesScreen = lazy(() => import('./components/TrophiesScreen'));
const ResultScreen = lazy(() => import('./components/ResultScreen'));
const RulesScreen = lazy(() => import('./components/RulesScreen'));

function App() {
	const activeScreen = useGameStore((s) => s.activeScreen);
	const t = useGameStore((s) => s.t);

	useAutoSave();

	const isNavScreen = ['main', 'trophies', 'rules'].includes(activeScreen);

	const renderScreen = () => {
		switch (activeScreen) {
			case 'main':
				return <MainMenuScreen key="main" />;
			case 'game':
				return <GameScreen key="game" />;
			case 'trophies':
				return <TrophiesScreen key="trophies" />;
			case 'result':
				return <ResultScreen key="result" />;
			case 'rules':
				return <RulesScreen key="rules" />;
			default:
				return <MainMenuScreen key="main" />;
		}
	};

	return (
		<Layout>
			<Suspense
				fallback={
					<div className="flex items-center justify-center h-full font-hanken uppercase tracking-widest-premium text-xs text-secondary animate-pulse">
						{t('pwa.loading')}
					</div>
				}
			>
				<AnimatePresence mode="wait">{renderScreen()}</AnimatePresence>
			</Suspense>
			{isNavScreen && <BottomNavBar />}
			<ReloadPrompt />
			<OrientationOverlay />
			<ConfirmDialog />
		</Layout>
	);
}

export default App;
