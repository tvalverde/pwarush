import { useGameState } from '../context/GameStateContext';
import { NeonButton } from './ui/NeonButton';

export function RestorePromptScreen() {
	const { dispatch } = useGameState();

	const handleContinue = () => {
		// Determine the original phase. It was saved in localStorage, but currently our state has currentPhase = 'RESTORE_PROMPT'.
		// Actually, to restore properly we need to know the original phase.
		// We can just read it from localStorage again or we could have saved it.
		const savedState = localStorage.getItem('elfarsante_state');
		if (savedState) {
			const parsed = JSON.parse(savedState);
			dispatch({ type: 'LOAD_STATE', payload: parsed });
		} else {
			dispatch({ type: 'NEXT_PHASE', payload: 'HOME' });
		}
	};

	const handleNewGame = () => {
		dispatch({ type: 'NEXT_PHASE', payload: 'HOME' });
	};

	return (
		<div className="flex flex-col items-center justify-center p-container-padding w-full max-w-md mx-auto gap-section-margin flex-grow mt-8">
			<h2 className="font-h1 text-[32px] text-primary-container tracking-wider uppercase text-center mb-4">
				Partida en Curso
			</h2>
			<p className="font-body-md text-body-md text-on-surface text-center mb-8">
				Se ha detectado una partida sin terminar. ¿Deseas continuarla o empezar una nueva?
			</p>
			<div className="flex flex-col gap-4 w-full">
				<NeonButton fullWidth onClick={handleContinue}>
					CONTINUAR PARTIDA
				</NeonButton>
				<NeonButton variant="ghost" fullWidth onClick={handleNewGame}>
					NUEVA PARTIDA
				</NeonButton>
			</div>
		</div>
	);
}
