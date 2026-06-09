import { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n/I18nContext';
import { generateNewRound } from '../utils/gameLogic';
import { NeonButton } from './ui/NeonButton';
import { NeonModal } from './ui/NeonModal';

export function ScoreScreen() {
	const { state, dispatch } = useGameState();
	const { showToast } = useToast();
	const { t } = useTranslation();
	const [showResetModal, setShowResetModal] = useState(false);
	const [showVictoryModal, setShowVictoryModal] = useState(false);
	const [showAbortModal, setShowAbortModal] = useState(false);

	const sortedPlayers = [...state.players].sort((a, b) => b.score - a.score);
	const highestScore = sortedPlayers[0]?.score || 0;
	const isTournamentOver =
		state.config.scoreLimit !== null && highestScore >= state.config.scoreLimit;

	const handleNextRound = async () => {
		if (isTournamentOver) {
			setShowVictoryModal(true);
		} else if (state.config.scoreLimit !== null) {
			// In tournament mode, skip HOME and jump directly to REPARTO
			const { newPlayers, newRound, exhaustedCategory } = await generateNewRound({
				currentPlayers: state.players,
				validPlayerNames: [],
				config: state.config,
				usedWords: state.usedWords,
				forceResetScores: false,
			});

			if (exhaustedCategory) {
				dispatch({ type: 'CLEAR_CATEGORY_WORDS', payload: exhaustedCategory });
				showToast(
					t('home.toast_words_exhausted', { category: t(`categories.${exhaustedCategory}`) }),
					'info',
				);
			}

			dispatch({
				type: 'NEW_ROUND',
				payload: { players: newPlayers, round: newRound },
			});
		} else {
			dispatch({ type: 'NEXT_PHASE', payload: 'HOME' });
		}
	};

	const handleKeepScoresAndFreeMode = () => {
		const saved = localStorage.getItem('elfarsante_draft_config');
		let config: Record<string, unknown> = {};
		if (saved) {
			try {
				config = JSON.parse(saved);
			} catch {
				// ignore
			}
		}
		config.scoreLimit = null;
		localStorage.setItem('elfarsante_draft_config', JSON.stringify(config));
		dispatch({ type: 'UPDATE_CONFIG', payload: { scoreLimit: null } });
		dispatch({ type: 'NEXT_PHASE', payload: 'HOME' });
	};

	const handleAbortTournament = () => {
		const saved = localStorage.getItem('elfarsante_draft_config');
		let config: Record<string, unknown> = {};
		if (saved) {
			try {
				config = JSON.parse(saved);
			} catch {
				// ignore
			}
		}
		config.scoreLimit = null;
		localStorage.setItem('elfarsante_draft_config', JSON.stringify(config));
		dispatch({ type: 'UPDATE_CONFIG', payload: { scoreLimit: null } });
		dispatch({ type: 'NEXT_PHASE', payload: 'HOME' });
	};

	// Helper to find leaders in a category
	const getLeaders = (key: keyof (typeof state.players)[0]) => {
		const maxVal = Math.max(...state.players.map((p) => Number(p[key])));
		if (maxVal === 0) return null;
		const leaders = state.players.filter((p) => Number(p[key]) === maxVal).map((p) => p.name);
		return { names: leaders.join(', '), value: maxVal };
	};

	const suspicious = getLeaders('farsanteCount');
	const master = getLeaders('farsanteWinsCount');
	const scapegoat = getLeaders('wronglyEliminatedCount');
	const immortal = getLeaders('roundsSurvivedCount');

	return (
		<div className="flex flex-col items-center justify-start p-container-padding w-full max-w-md mx-auto gap-section-margin flex-grow mt-8 pb-[180px]">
			<section className="flex flex-col items-center justify-center mb-4 w-full text-center">
				<div className="flex items-center gap-3">
					<span
						className="material-symbols-outlined text-4xl text-primary-container drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]"
						style={{ fontVariationSettings: "'FILL' 1" }}
					>
						emoji_events
					</span>
					<h2 className="font-h1 text-[32px] text-primary-container tracking-wider uppercase drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">
						{isTournamentOver ? t('score.champion') : t('score.scores_title')}
					</h2>
				</div>
				<p className="font-body-md text-body-md text-outline mt-2 text-center">
					{isTournamentOver ? t('score.game_over') : t('score.current_ranking')}
				</p>
			</section>

			<section className="w-full bg-surface-container-high rounded-xl border border-outline-variant p-2 flex flex-col gap-2 relative overflow-hidden">
				{/* Glow */}
				<div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-container rounded-full blur-[60px] opacity-10 pointer-events-none"></div>

				{sortedPlayers.map((player, index) => (
					<div
						key={player.id}
						className="flex justify-between items-center bg-surface-container p-4 rounded-lg border border-outline-variant z-10"
					>
						<div className="flex items-center gap-4">
							<div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/30 text-primary-container font-label-pill">
								{index + 1}
							</div>
							<span className="font-body-lg text-body-lg text-on-surface font-semibold">
								{player.name}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-label-pill text-label-pill text-primary-container text-lg">
								{player.score} pts
							</span>
							{index === 0 && (
								<span
									className="material-symbols-outlined text-primary-container text-sm"
									style={{ fontVariationSettings: "'FILL' 1" }}
								>
									star
								</span>
							)}
						</div>
					</div>
				))}
			</section>

			{/* History Section */}
			<div className="w-full flex flex-col items-center gap-4">
				<div className="flex items-center gap-2 text-outline text-xs font-bold uppercase tracking-[0.2em] py-2">
					<span className="material-symbols-outlined text-sm">history_edu</span>
					{t('score.history_infamy')}
				</div>

				<div className="grid grid-cols-2 gap-3 w-full">
					{/* Card 1: Farsante */}
					<div className="bg-surface-container p-4 rounded-lg border border-outline-variant flex flex-col gap-1">
						<span className="text-[10px] font-black text-primary-container uppercase tracking-widest">
							{t('score.usual_suspect')}
						</span>
						<span className="text-sm font-bold text-on-surface truncate">
							{suspicious?.names || '---'}
						</span>
						<span className="text-[10px] text-outline">
							{suspicious
								? t('score.times', { count: suspicious.value.toString() })
								: t('score.no_data')}
						</span>
					</div>
					{/* Card 2: Maestro */}
					<div className="bg-surface-container p-4 rounded-lg border border-outline-variant flex flex-col gap-1">
						<span className="text-[10px] font-black text-primary-container uppercase tracking-widest">
							{t('score.master_deceit')}
						</span>
						<span className="text-sm font-bold text-on-surface truncate">
							{master?.names || '---'}
						</span>
						<span className="text-[10px] text-outline">
							{master
								? t('score.victories', { count: master.value.toString() })
								: t('score.no_data')}
						</span>
					</div>
					{/* Card 3: Guilty Face */}
					<div className="bg-surface-container p-4 rounded-lg border border-outline-variant flex flex-col gap-1">
						<span className="text-[10px] font-black text-neon-red uppercase tracking-widest">
							{t('score.guilty_face')}
						</span>
						<span className="text-sm font-bold text-on-surface truncate">
							{scapegoat?.names || '---'}
						</span>
						<span className="text-[10px] text-outline">
							{scapegoat
								? t('score.errors', { count: scapegoat.value.toString() })
								: t('score.no_data')}
						</span>
					</div>
					{/* Card 4: Immortal */}
					<div className="bg-surface-container p-4 rounded-lg border border-outline-variant flex flex-col gap-1">
						<span className="text-[10px] font-black text-primary-container uppercase tracking-widest">
							{t('score.immortal')}
						</span>
						<span className="text-sm font-bold text-on-surface truncate">
							{immortal?.names || '---'}
						</span>
						<span className="text-[10px] text-outline">
							{immortal
								? t('score.rounds', { count: immortal.value.toString() })
								: t('score.no_data')}
						</span>
					</div>
				</div>
			</div>

			{/* Fixed bottom Action Buttons */}
			<div className="fixed bottom-0 left-0 w-full z-50 flex justify-center p-container-padding bg-gradient-to-t from-background via-background to-transparent pt-12 pointer-events-none">
				<div className="w-full max-w-md pointer-events-auto flex flex-col gap-3">
					<NeonButton fullWidth onClick={handleNextRound}>
						{isTournamentOver ? t('score.finish_game') : t('score.next_round')}
					</NeonButton>
					{!isTournamentOver && state.config.scoreLimit !== null && (
						<NeonButton variant="ghost" fullWidth onClick={() => setShowAbortModal(true)}>
							{t('score.abort_tournament')}
						</NeonButton>
					)}
					{!isTournamentOver && state.config.scoreLimit === null && (
						<button
							onClick={() => setShowResetModal(true)}
							className="text-outline-variant hover:text-error text-sm font-medium transition-colors py-2 uppercase tracking-tighter opacity-70 hover:opacity-100"
						>
							{t('score.reset_scores_button')}
						</button>
					)}
				</div>

				<NeonModal
					isOpen={showResetModal}
					onClose={() => setShowResetModal(false)}
					title={t('score.reset_modal_title')}
				>
					<div className="flex flex-col gap-6">
						<p className="text-on-surface-variant">
							{t('score.reset_modal_p1')}
							<span className="text-primary-container font-bold">
								{t('score.reset_modal_p2_bold')}
							</span>
							{t('score.reset_modal_p3')}
						</p>
						<div className="flex flex-col gap-3">
							<NeonButton
								variant="primary"
								fullWidth
								onClick={() => {
									dispatch({ type: 'RESET_SCORES' });
									setShowResetModal(false);
								}}
							>
								{t('score.yes_reset')}
							</NeonButton>
							<NeonButton variant="ghost" fullWidth onClick={() => setShowResetModal(false)}>
								{t('score.cancel')}
							</NeonButton>
						</div>
					</div>
				</NeonModal>

				<NeonModal
					isOpen={showAbortModal}
					onClose={() => setShowAbortModal(false)}
					title={t('score.abort_modal_title')}
				>
					<div className="flex flex-col gap-6">
						<p className="text-on-surface-variant">{t('score.abort_modal_desc')}</p>
						<div className="flex flex-col gap-3">
							<NeonButton variant="danger" fullWidth onClick={handleAbortTournament}>
								{t('score.yes_abort')}
							</NeonButton>
							<NeonButton variant="ghost" fullWidth onClick={() => setShowAbortModal(false)}>
								{t('score.cancel')}
							</NeonButton>
						</div>
					</div>
				</NeonModal>

				<NeonModal
					isOpen={showVictoryModal}
					onClose={() => setShowVictoryModal(false)}
					title={t('score.end_tournament_title')}
				>
					<div className="flex flex-col gap-6">
						<div className="flex flex-col items-center gap-2">
							<span className="material-symbols-outlined text-5xl text-primary-container animate-bounce">
								military_tech
							</span>
							<p className="text-on-surface-variant text-center">
								{t('score.end_tournament_desc')}
							</p>
						</div>
						<div className="flex flex-col gap-3">
							<NeonButton
								variant="primary"
								fullWidth
								onClick={() => {
									dispatch({ type: 'RESET_SCORES' });
									setShowVictoryModal(false);
								}}
							>
								{t('score.reset_to_zero')}
							</NeonButton>
							<NeonButton variant="ghost" fullWidth onClick={handleKeepScoresAndFreeMode}>
								{t('score.keep_points_free_mode')}
							</NeonButton>
						</div>
					</div>
				</NeonModal>
			</div>
		</div>
	);
}
