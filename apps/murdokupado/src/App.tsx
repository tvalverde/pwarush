import { Layout } from '@pwarush/core/ui';
import AppConfirmDialog from './components/AppConfirmDialog';
import GameScreen from './components/GameScreen';
import MainMenuScreen from './components/MainMenuScreen';
import ResultScreen from './components/ResultScreen';
import { useAutoSave } from './hooks/useAutoSave';
import { useGameStore } from './store/gameStore';

export default function App() {
	const activeScreen = useGameStore((s) => s.activeScreen);

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
			{renderScreen()}
			<AppConfirmDialog />
		</Layout>
	);
}
