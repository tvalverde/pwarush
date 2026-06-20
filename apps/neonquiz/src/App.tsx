import { Layout } from '@pwarush/core/ui';
import { lazy, Suspense } from 'react';
import { useAutoSave } from './hooks/useAutoSave';
import { useBootstrap } from './hooks/useBootstrap';
import { useFailedQuestionLog } from './hooks/useFailedQuestionLog';
import { useQuestionUsagePersistence } from './hooks/useQuestionUsagePersistence';
import { useGameStore } from './store/gameStore';

const SetupLobbyScreen = lazy(() => import('./components/SetupLobbyScreen'));
const ArenaScreen = lazy(() => import('./components/ArenaScreen'));

export default function App() {
	const phase = useGameStore((s) => s.phase);
	const t = useGameStore((s) => s.t);
	const ready = useBootstrap();

	useAutoSave();
	useFailedQuestionLog();
	useQuestionUsagePersistence();

	const loading = (
		<div className="flex h-full items-center justify-center font-display text-xs uppercase tracking-widest-premium text-primary animate-pulse">
			{t('app.loading')}
		</div>
	);

	return (
		<Layout>
			<Suspense fallback={loading}>
				{!ready ? loading : phase === 'LOBBY' ? <SetupLobbyScreen /> : <ArenaScreen />}
			</Suspense>
		</Layout>
	);
}
