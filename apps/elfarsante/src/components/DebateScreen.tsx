import { useCallback, useEffect, useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { useToast } from '../context/ToastContext';
import { useTimer } from '../hooks/useTimer';
import { useTranslation } from '../i18n/I18nContext';

export function DebateScreen() {
	const { state, dispatch } = useGameState();
	const { showToast } = useToast();
	const { t } = useTranslation();
	// Capture initial state on mount to prevent instant hide on global state update
	const [shouldShowOverlay] = useState(!state.round.hasShownStartNotice);
	const [showStartNotice, setShowStartNotice] = useState(shouldShowOverlay);

	const handleTimeUp = useCallback(() => {
		showToast(t('debate.time_up'), 'error');
		dispatch({ type: 'FORCE_VOTING', payload: { remainingTime: 0 } });
	}, [dispatch, showToast, t]);

	const {
		play: playTimer,
		pause: pauseTimer,
		seconds: timerSeconds,
		formattedTime,
	} = useTimer(state.round.remainingTime, handleTimeUp, !shouldShowOverlay);

	// Auto-hide start notice after 2.5 seconds
	useEffect(() => {
		if (shouldShowOverlay) {
			const timerId = setTimeout(() => {
				setShowStartNotice(false);
				playTimer();
			}, 2500);
			return () => clearTimeout(timerId);
		} else {
			playTimer();
		}
	}, [shouldShowOverlay, playTimer]);

	// Mark notice as shown in global state as soon as it mounts, but only once
	useEffect(() => {
		if (!state.round.hasShownStartNotice) {
			dispatch({ type: 'UPDATE_ROUND', payload: { hasShownStartNotice: true } });
		}
	}, [dispatch, state.round.hasShownStartNotice]);

	const handleAcusar = () => {
		pauseTimer();
		dispatch({ type: 'END_DEBATE', payload: { remainingTime: timerSeconds } });
	};

	const isUrgent = timerSeconds <= 30;

	// Reorder players so the starting player is first, maintaining circular order
	const startingIndex = state.players.findIndex((p) => p.id === state.round.startingPlayerId);
	const orderedPlayers =
		startingIndex === -1
			? state.players
			: [...state.players.slice(startingIndex), ...state.players.slice(0, startingIndex)];

	const startingPlayer = state.players.find((p) => p.id === state.round.startingPlayerId);

	return (
		<div className="flex flex-col items-center justify-start p-container-padding w-full max-w-3xl mx-auto gap-section-margin flex-grow mt-8 pb-[120px]">
			{/* Starting Player Overlay */}
			{showStartNotice && shouldShowOverlay && startingPlayer && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-6">
					<div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-500"></div>
					<div className="relative bg-surface-container-high border-2 border-primary-container p-8 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.3)] text-center animate-in zoom-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-forwards">
						<p className="text-primary-container font-label-pill uppercase tracking-widest mb-2">
							{t('debate.debate_starts')}
						</p>
						<h2 className="font-h1 text-4xl text-white uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">
							{startingPlayer.name}
						</h2>
						<div className="mt-4 flex justify-center">
							<span className="material-symbols-outlined text-primary-container text-5xl animate-bounce">
								keyboard_double_arrow_down
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Category Header */}
			<section className="flex flex-col items-center gap-unit w-full">
				<p className="font-body-md text-body-md text-on-surface-variant">
					{t('debate.active_categories')}
				</p>
				<div className="flex flex-wrap justify-center gap-2">
					{state.config.selectedCategories.map((cat) => (
						<div
							key={cat}
							className="px-4 py-2 border border-primary-container rounded-full bg-primary-container/10 flex items-center gap-2 neon-glow-cyan"
						>
							<span className="font-label-pill text-label-pill text-on-background">
								{t(`categories.${cat}`)}
							</span>
						</div>
					))}
				</div>
			</section>

			{/* Giant Timer */}
			<section className="w-full flex justify-center items-center py-4">
				<div
					className={`font-h1 text-[80px] leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-colors duration-300 ${isUrgent ? 'text-neon-red drop-shadow-[0_0_20px_rgba(255,42,95,0.6)] animate-pulse' : 'text-on-background'}`}
				>
					{state.config.blindTimer && timerSeconds > 30 ? (
						<span className="animate-pulse">?:??</span>
					) : (
						formattedTime
					)}
				</div>
			</section>

			{/* Players List */}
			<section className="w-full bg-cyber-noir-surface rounded-xl border border-outline-variant p-element-gap flex flex-col gap-unit mb-8">
				{orderedPlayers.map((player) => {
					const isStarting = state.round.startingPlayerId === player.id && player.isAlive;
					return (
						<div
							key={player.id}
							className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
								!player.isAlive
									? 'bg-surface-container-low border-error-container/30 opacity-40 grayscale blur-[0.5px]'
									: isStarting
										? 'bg-primary-container/5 border-primary-container shadow-[0_0_15px_rgba(0,229,255,0.15)]'
										: 'bg-surface-container-low border-outline/20'
							}`}
						>
							<div className="flex items-center gap-3">
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center border ${
										player.isAlive
											? isStarting
												? 'bg-primary-container/20 border-primary-container'
												: 'bg-surface-container-high border-primary-container/30'
											: 'bg-surface-container-high border-outline/30'
									}`}
								>
									{player.isAlive ? (
										<span
											className={`material-symbols-outlined ${isStarting ? 'text-white' : 'text-primary-container'}`}
										>
											person
										</span>
									) : (
										<span className="material-symbols-outlined text-outline">skull</span>
									)}
								</div>
								<div className="flex flex-col">
									<span
										className={`font-body-lg text-body-lg leading-tight ${
											player.isAlive
												? isStarting
													? 'text-white font-bold'
													: 'text-on-background font-medium'
												: 'text-outline line-through'
										}`}
									>
										{player.name}
									</span>
									{isStarting && (
										<span className="text-[10px] text-primary-container font-label-pill uppercase tracking-widest animate-pulse">
											{t('debate.starts')}
										</span>
									)}
								</div>
							</div>
							<div
								className={`font-label-pill text-label-pill px-3 py-1 rounded-full ${
									player.isAlive
										? isStarting
											? 'text-on-primary-container bg-primary-container font-bold'
											: 'text-primary-container bg-primary-container/10'
										: 'text-outline border border-outline/30'
								}`}
							>
								{player.score} pts
							</div>
						</div>
					);
				})}
			</section>

			{/* Fixed bottom Action Button */}
			<div className="fixed bottom-0 left-0 w-full z-50 flex justify-center p-container-padding bg-gradient-to-t from-background via-background to-transparent pt-12 pointer-events-none">
				<div className="w-full max-w-3xl pointer-events-auto">
					<button
						onClick={handleAcusar}
						className="w-full bg-neon-red text-white font-h2 text-h2 py-6 rounded-full flex items-center justify-center gap-3 transition-all active:scale-[0.98] uppercase tracking-wide hover:shadow-[0_0_20px_rgba(255,42,95,0.4)] active:shadow-[0_0_30px_rgba(255,42,95,0.6)]"
					>
						<span>{t('debate.stop_and_accuse')}</span>
						<span
							className="material-symbols-outlined text-3xl"
							style={{ fontVariationSettings: "'FILL' 1" }}
						>
							front_hand
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
