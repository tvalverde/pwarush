import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { DebateScreen } from './components/DebateScreen';
import { DistributionScreen } from './components/DistributionScreen';
import { HomeScreen } from './components/HomeScreen';
import { RestorePromptScreen } from './components/RestorePromptScreen';
import { ResultScreen } from './components/ResultScreen';
import { ScoreScreen } from './components/ScoreScreen';
import { SystemMenu } from './components/SystemMenu';
import { CyberToast } from './components/ui/CyberToast';
import { NeonButton } from './components/ui/NeonButton';
import { NeonModal } from './components/ui/NeonModal';
import { ReloadPrompt } from './components/ui/ReloadPrompt';
import { VotingScreen } from './components/VotingScreen';
import { useAuth } from './context/AuthContext';
import { useGameState } from './context/GameStateContext';
import { useWakeLock } from './hooks/useWakeLock';

function App() {
	const { state, dispatch } = useGameState();
	const { pendingLinkRequest, approveLinkRequest, rejectLinkRequest } = useAuth();
	const { currentPhase } = state;
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isReady, setIsReady] = useState(false);

	// Wait for external resources (fonts)
	useEffect(() => {
		document.fonts.ready.then(() => {
			setIsReady(true);
		});

		// Fallback security timeout
		const timeout = setTimeout(() => setIsReady(true), 3000);
		return () => clearTimeout(timeout);
	}, []);

	// Keep screen awake globally
	useWakeLock(true);

	// Scroll to top on phase change
	// biome-ignore lint/correctness/useExhaustiveDependencies: `currentPhase` is the trigger, not a value read by the effect
	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
	}, [currentPhase]);

	// Return to RESTORE_PROMPT when the app goes to background during an active game
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				if (
					currentPhase !== 'HOME' &&
					currentPhase !== 'PUNTUACIONES' &&
					currentPhase !== 'RESTORE_PROMPT'
				) {
					dispatch({ type: 'NEXT_PHASE', payload: 'RESTORE_PROMPT' });
				}
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [currentPhase, dispatch]);

	if (!isReady) {
		return (
			<div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-[100] p-6 text-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-16 h-16 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin mb-4" />
					<h2 className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-sm animate-pulse">
						Inicializando Sistema
					</h2>
					<span className="text-cyan-900 text-[10px] font-bold uppercase tracking-widest">
						Estableciendo conexión segura...
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col font-body-md text-body-md overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container bg-background">
			{/* TopAppBar */}
			<header className="docked full-width top-0 border-b border-neutral-800 flat no-shadows bg-neutral-950 flex justify-between items-center px-6 h-16 w-full z-40 sticky shrink-0">
				<div className="w-10"></div> {/* Spacer to keep title centered */}
				<div className="flex flex-col items-center">
					<h1 className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.5)] font-h1 uppercase tracking-widest pointer-events-none leading-none">
						EL FARSANTE
					</h1>
					<span className="text-[10px] text-cyan-800 font-bold tracking-tighter uppercase mt-0.5">
						v{__APP_VERSION__}
					</span>
				</div>
				<button
					onClick={() => setIsMenuOpen(true)}
					className="text-neutral-500 hover:text-cyan-300 transition-colors active:scale-95 duration-150 p-2 -mr-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-container"
				>
					<span className="material-symbols-outlined text-2xl">menu</span>
				</button>
			</header>

			{/* Main Content Canvas */}
			<main className="flex-grow flex flex-col items-center justify-start w-full relative z-0 h-full">
				<AnimatePresence mode="wait">
					<motion.div
						key={state.currentPhase}
						initial={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
						animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
						exit={{ opacity: 0, scale: 1.03, filter: 'blur(4px)' }}
						transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
						className="w-full flex flex-col items-center flex-grow"
					>
						{state.currentPhase === 'RESTORE_PROMPT' && <RestorePromptScreen />}
						{state.currentPhase === 'HOME' && <HomeScreen />}
						{state.currentPhase === 'REPARTO' && <DistributionScreen />}
						{state.currentPhase === 'DEBATE' && <DebateScreen />}
						{state.currentPhase === 'VOTACION' && <VotingScreen />}
						{state.currentPhase === 'RESULTADO' && <ResultScreen />}
						{state.currentPhase === 'PUNTUACIONES' && <ScoreScreen />}
					</motion.div>
				</AnimatePresence>
			</main>

			{/* Modals & Toasts */}
			<NeonModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} title="SISTEMA">
				<SystemMenu />
			</NeonModal>

			{/* Global Link Request Approval Modal */}
			<NeonModal
				isOpen={!!pendingLinkRequest}
				onClose={() => {}} // Force decision, no easy close
				hideCloseButton={true}
				title="⚠️ NUEVA VINCULACIÓN"
			>
				<div className="flex flex-col gap-6">
					<p className="text-on-surface-variant text-center">
						Un nuevo dispositivo está intentando vincularse a tu perfil.
					</p>
					<p className="text-sm border-l-2 border-primary-container pl-4 py-2 bg-primary-container/5 text-primary-container font-semibold italic">
						"Si permites el acceso, el otro dispositivo podrá ver y modificar tus partidas en tiempo
						real."
					</p>
					<div className="flex flex-col gap-3 mt-2">
						<NeonButton
							variant="primary"
							fullWidth
							onClick={() => pendingLinkRequest && approveLinkRequest(pendingLinkRequest.id)}
						>
							PERMITIR ACCESO
						</NeonButton>
						<NeonButton
							variant="ghost"
							fullWidth
							onClick={() => pendingLinkRequest && rejectLinkRequest(pendingLinkRequest.id)}
							className="!text-neon-red !border-neon-red/30 hover:!bg-neon-red/10"
						>
							RECHAZAR
						</NeonButton>
					</div>
				</div>
			</NeonModal>

			<CyberToast />
			<ReloadPrompt />
		</div>
	);
}

export default App;
