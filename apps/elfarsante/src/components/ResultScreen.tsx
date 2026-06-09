import { useEffect, useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { useSFX } from '../hooks/useSFX';
import { useTranslation } from '../i18n/I18nContext';

export function ResultScreen() {
	const { state, dispatch } = useGameState();
	const { playSuccess, playFail } = useSFX();
	const { t } = useTranslation();
	const [isProcessing, setIsProcessing] = useState(true);

	const accused = state.players.find((p) => p.id === state.round.accusedId);
	const isFarsante = state.round.farsanteIds.includes(accused?.id || '');

	// Sound effect when revealing result
	// biome-ignore lint/correctness/useExhaustiveDependencies: SFX callbacks are intentionally omitted; the sound must fire only when the reveal completes
	useEffect(() => {
		if (!isProcessing) {
			if (isFarsante) {
				playSuccess();
			} else {
				playFail();
			}
		}
	}, [isProcessing, isFarsante]);

	// Calculate if the farsantes win by numbers on this screen
	const aliveInnocentsCount = state.players.filter(
		(p) => p.id !== accused?.id && p.isAlive && p.role !== 'farsante',
	).length;
	const aliveFarsantesCount = state.players.filter(
		(p) => p.id !== accused?.id && p.isAlive && p.role === 'farsante',
	).length;
	const isGameOverByNumber = !isFarsante && aliveFarsantesCount >= aliveInnocentsCount;

	// biome-ignore lint/correctness/useExhaustiveDependencies: the scoring pass must run exactly once per reveal, against the values captured when processing started
	useEffect(() => {
		if (!isProcessing) return;

		const timer = setTimeout(() => {
			const updatedPlayers = state.players.map((p) => {
				const newPlayer = { ...p };

				if (isFarsante) {
					if (newPlayer.id === accused?.id) {
						newPlayer.isAlive = false;
					}
					if (newPlayer.role !== 'farsante' && newPlayer.isAlive) {
						newPlayer.score += 1;
					}
				} else {
					if (newPlayer.id === accused?.id) {
						newPlayer.isAlive = false;
						newPlayer.score += 1;
						// Register unfair elimination (Guilty Face)
						newPlayer.wronglyEliminatedCount += 1;
					}
					if (isGameOverByNumber && newPlayer.role === 'farsante') {
						newPlayer.score += 2;
						// Register farsante win (Master of Deceit)
						newPlayer.farsanteWinsCount += 1;
					}
				}

				// Increment survival count only for farsantes if they win the game (deceiving the innocents)
				if (isGameOverByNumber && newPlayer.role === 'farsante' && newPlayer.isAlive) {
					newPlayer.roundsSurvivedCount += 1;
				}

				return newPlayer;
			});

			dispatch({ type: 'UPDATE_PLAYERS', payload: updatedPlayers });

			if (!isFarsante && state.config.penaltyOnFail && !isGameOverByNumber) {
				dispatch({
					type: 'UPDATE_ROUND',
					payload: { remainingTime: Math.max(0, state.round.remainingTime - 60) },
				});
			}

			setIsProcessing(false);
		}, 3000);

		return () => clearTimeout(timer);
	}, [isProcessing]);

	const handleFinishRound = (farsanteGuessed: boolean) => {
		if (farsanteGuessed) {
			const updatedPlayers = state.players.map((p) =>
				p.id === accused?.id ? { ...p, score: p.score + 1 } : p,
			);
			dispatch({ type: 'UPDATE_PLAYERS', payload: updatedPlayers });
		}
		dispatch({ type: 'NEXT_PHASE', payload: 'PUNTUACIONES' });
	};

	const handleNext = () => {
		if (isFarsante) {
			// Handled by handleFinishRound
		} else {
			if (isGameOverByNumber) {
				dispatch({ type: 'NEXT_PHASE', payload: 'PUNTUACIONES' });
			} else {
				dispatch({ type: 'NEXT_PHASE', payload: 'DEBATE' });
			}
		}
	};

	if (isProcessing) {
		return (
			<div className="flex flex-col items-center justify-center flex-grow w-full">
				<h2 className="font-h1 text-[40px] animate-pulse text-primary-container drop-shadow-[0_0_15px_rgba(0,229,255,0.6)] uppercase tracking-widest text-center px-4">
					{t('result.analyzing')}
				</h2>
			</div>
		);
	}

	const textColor = isFarsante ? 'text-[#00FF88]' : 'text-neon-red';
	const glowClass = isFarsante
		? 'drop-shadow-[0_0_20px_rgba(0,255,136,0.6)]'
		: 'drop-shadow-[0_0_20px_rgba(255,42,95,0.6)]';
	const icon = isFarsante ? 'check_circle' : 'cancel';

	const resultMessage = isFarsante
		? t('result.farsante_caught_wait')
		: isGameOverByNumber
			? t('result.farsante_win_numbers')
			: t('result.innocent_eliminated');

	const trueFarsantesNames = state.players
		.filter((p) => state.round.farsanteIds.includes(p.id))
		.map((p) => p.name)
		.join(', ');

	return (
		<div className="flex flex-col items-center justify-center flex-grow p-container-padding max-w-2xl mx-auto text-center w-full relative z-10">
			<div className="mb-element-gap relative">
				<div
					className={`absolute inset-0 rounded-full blur-xl opacity-40 animate-pulse ${isFarsante ? 'bg-[#00FF88]' : 'bg-neon-red'}`}
				></div>
				<span
					className={`material-symbols-outlined text-[100px] relative z-10 ${textColor} ${glowClass}`}
					style={{ fontVariationSettings: "'FILL' 1" }}
				>
					{icon}
				</span>
			</div>

			<h2
				className={`font-h1 text-[36px] mb-unit uppercase leading-tight ${textColor} ${glowClass}`}
			>
				{isFarsante
					? t('result.was_farsante', { name: accused?.name ?? '' })
					: t('result.was_innocent', { name: accused?.name ?? '' })}
			</h2>

			<p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mt-4">
				{resultMessage}
			</p>

			{!isFarsante && isGameOverByNumber && (
				<p className="font-bold text-lg mt-6 animate-in fade-in zoom-in duration-500 text-on-surface">
					{state.round.farsanteIds.length > 1
						? t('result.true_farsantes_plural')
						: t('result.true_farsantes_singular')}
					<span className="text-neon-red">{trueFarsantesNames}</span>
				</p>
			)}

			{isFarsante ? (
				<div className="w-full max-w-sm mt-12 flex flex-col gap-4">
					<p className="text-primary-container font-bold uppercase tracking-widest text-sm mb-2">
						{t('result.guessed_secret_word')}
					</p>
					<button
						onClick={() => handleFinishRound(true)}
						className="w-full py-4 bg-primary-container/10 border-2 border-primary-container text-primary-container font-bold rounded-full hover:bg-primary-container hover:text-background transition-all uppercase tracking-wider active:scale-[0.98] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]"
					>
						{t('result.yes_guessed')}
					</button>
					<button
						onClick={() => handleFinishRound(false)}
						className="w-full py-4 border border-outline-variant text-outline rounded-full hover:text-on-surface hover:border-on-surface transition-all uppercase tracking-wider active:scale-[0.98]"
					>
						{t('result.no_failed')}
					</button>
				</div>
			) : (
				<button
					onClick={handleNext}
					className="w-full max-w-sm mt-12 py-4 border border-outline-variant text-on-surface font-label-pill text-label-pill rounded-full hover:border-primary-container hover:text-primary-container hover:bg-primary-container/5 transition-all uppercase tracking-wider active:scale-[0.98]"
				>
					{isGameOverByNumber ? t('result.view_scores') : t('result.continue')}
				</button>
			)}
		</div>
	);
}
