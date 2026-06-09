import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGameState } from '../context/GameStateContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n/I18nContext';
import { NeonButton } from './ui/NeonButton';
import { NeonModal } from './ui/NeonModal';

type SystemView = 'menu' | 'instructions' | 'sync';

export function SystemMenu() {
	const { state, dispatch, syncStatus } = useGameState();
	const { showToast } = useToast();
	const { syncCode, linkDevice, unlinkDevice, syncUid } = useAuth();
	const { language, setLanguage, t } = useTranslation();

	const [activeView, setActiveView] = useState<SystemView>('menu');
	const [syncInput, setSyncCodeInput] = useState('');
	const [isLinking, setIsLinking] = useState(false);
	const [showHardResetModal, setShowHardResetModal] = useState(false);
	const [showAbortModal, setShowAbortModal] = useState(false);
	const [showLinkModal, setShowLinkModal] = useState(false);

	const isTournamentActive = state.config.scoreLimit !== null;

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

	const handleLinkDevice = async () => {
		if (!syncInput) return;
		setIsLinking(true);
		const result = await linkDevice(syncInput);
		setIsLinking(false);

		if (result === 'success') {
			showToast(t('system_menu.device_linked_success'), 'success');
			setSyncCodeInput('');
			setShowLinkModal(false);
		} else if (result === 'invalid_code') {
			showToast(t('system_menu.invalid_code'), 'error');
		} else if (result === 'rejected') {
			showToast(t('system_menu.connection_rejected'), 'error');
		} else if (result === 'timeout') {
			showToast(t('system_menu.timeout_retry'), 'error');
		}
	};

	const renderBackButton = (title: string) => (
		<div className="flex items-center gap-3 mb-6 border-b border-outline-variant/30 pb-4">
			<button
				onClick={() => setActiveView('menu')}
				className="flex items-center justify-center p-2 -ml-2 rounded-full text-outline hover:bg-surface-container hover:text-cyan-300 transition-colors active:scale-95"
			>
				<span className="material-symbols-outlined">arrow_back</span>
			</button>
			<h2 className="text-primary-container font-black uppercase tracking-[0.2em] text-xs m-0 mt-0.5">
				{title}
			</h2>
		</div>
	);

	if (activeView === 'instructions') {
		return (
			<div className="flex flex-col pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
				{renderBackButton(t('system_menu.instructions'))}

				<div className="flex flex-col gap-6">
					<section>
						<h3 className="text-primary-container font-bold uppercase tracking-wider mb-2 text-sm">
							{t('system_menu.objective')}
						</h3>
						<ul className="list-disc list-inside space-y-1 opacity-90 text-sm">
							<li>
								<span className="text-white font-semibold">{t('system_menu.innocents')}</span>{' '}
								{t('system_menu.innocents_desc')}
							</li>
							<li>
								<span className="text-white font-semibold">{t('system_menu.farsante')}</span>{' '}
								{t('system_menu.farsante_desc')}
							</li>
						</ul>
					</section>

					<section>
						<h3 className="text-primary-container font-bold uppercase tracking-wider mb-2 text-sm">
							{t('system_menu.rules')}
						</h3>
						<ol className="list-decimal list-inside space-y-2 opacity-90 text-sm">
							<li>{t('system_menu.rule_1')}</li>
							<li>
								{t('system_menu.rule_2_p1')}
								<span className="text-white font-semibold underline decoration-primary-container">
									{t('system_menu.rule_2_bold')}
								</span>{' '}
								{t('system_menu.rule_2_p2')}
							</li>
							<li>{t('system_menu.rule_3')}</li>
						</ol>
					</section>

					<section>
						<h3 className="text-primary-container font-bold uppercase tracking-wider mb-2 text-sm">
							{t('system_menu.points_system')}
						</h3>
						<div className="grid grid-cols-1 gap-2 text-sm">
							<div className="flex gap-2">
								<span className="text-primary-container">✅</span>
								<p>
									<span className="text-white font-semibold">{t('system_menu.innocents')}</span>{' '}
									{t('system_menu.pt_innocents')}
								</p>
							</div>
							<div className="flex gap-2">
								<span className="text-neon-red">💔</span>
								<p>
									<span className="text-white font-semibold">{t('system_menu.error')}</span>{' '}
									{t('system_menu.pt_error')}
								</p>
							</div>
							<div className="flex gap-2">
								<span className="text-primary-container">🎭</span>
								<p>
									<span className="text-white font-semibold">
										{t('system_menu.farsante_audacious')}
									</span>{' '}
									{t('system_menu.pt_farsante_audacious')}
								</p>
							</div>
							<div className="flex gap-2">
								<span className="text-primary-container">🏆</span>
								<p>
									<span className="text-white font-semibold">
										{t('system_menu.farsante_victory')}
									</span>{' '}
									{t('system_menu.pt_farsante_victory')}
								</p>
							</div>
						</div>
					</section>
				</div>
			</div>
		);
	}

	if (activeView === 'sync') {
		return (
			<div className="flex flex-col pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
				{renderBackButton(t('system_menu.sync_title'))}

				<div className="bg-surface-container-high p-4 rounded-lg border border-outline-variant flex flex-col gap-4">
					<div className="flex flex-col gap-1 text-left border-b border-outline-variant/30 pb-3">
						<span className="text-[10px] text-outline uppercase font-bold tracking-tighter leading-tight">
							{t('system_menu.your_code')}
						</span>
						<div className="flex items-center gap-2">
							<span className="font-h1 text-2xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] whitespace-nowrap tracking-widest">
								{syncCode || '...'}
							</span>
							{syncStatus === 'synced' && (
								<span className="material-symbols-outlined text-primary-container text-xl animate-in fade-in zoom-in duration-300">
									cloud_done
								</span>
							)}
							{syncStatus === 'pending' && (
								<span className="material-symbols-outlined text-orange-400 text-xl animate-pulse">
									cloud_sync
								</span>
							)}
							{syncStatus === 'error' && (
								<span className="material-symbols-outlined text-neon-red text-xl animate-bounce">
									cloud_off
								</span>
							)}
						</div>
					</div>

					{syncUid ? (
						<div className="flex flex-col gap-3 pt-2">
							<div className="flex items-center gap-2 bg-primary-container/10 p-3 rounded text-primary-container border border-primary-container/20">
								<span className="material-symbols-outlined text-sm">check_circle</span>
								<span className="text-xs font-bold uppercase tracking-wide">
									{t('system_menu.device_linked')}
								</span>
							</div>
							<button
								onClick={unlinkDevice}
								className="text-[10px] text-neon-red hover:text-white hover:bg-neon-red/20 transition-colors p-2 rounded text-center uppercase font-black tracking-widest border border-transparent hover:border-neon-red/50"
							>
								{t('system_menu.unlink_profile')}
							</button>
						</div>
					) : (
						<div className="flex flex-col gap-3 pt-2">
							<p className="text-xs text-on-surface-variant leading-relaxed">
								{t('system_menu.sync_desc')}
							</p>
							<div className="flex gap-2">
								<input
									type="text"
									value={syncInput}
									onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
									placeholder={t('system_menu.sync_placeholder')}
									className="bg-background border border-outline-variant text-white text-sm p-3 rounded-lg flex-grow outline-none focus:border-primary-container min-w-0 font-mono text-center tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
									maxLength={7}
								/>
							</div>
							<NeonButton
								variant="primary"
								fullWidth
								onClick={() => setShowLinkModal(true)}
								disabled={isLinking || syncInput.length < 3}
								className="py-3 text-sm mt-1"
							>
								{isLinking ? t('system_menu.waiting_approval') : t('system_menu.link_now')}
							</NeonButton>
						</div>
					)}
				</div>

				<NeonModal
					isOpen={showLinkModal}
					onClose={() => setShowLinkModal(false)}
					title={t('system_menu.link_device_title')}
				>
					<div className="flex flex-col gap-6">
						<p className="text-on-surface-variant">
							{t('system_menu.link_warning_p1')}
							<span className="text-primary-container font-bold">
								{t('system_menu.link_warning_bold')}
							</span>
							{t('system_menu.link_warning_p2')}
						</p>
						<p className="text-on-surface-variant text-sm border-l-2 border-primary-container pl-3 py-1 bg-primary-container/5">
							{t('system_menu.link_note_p1')}
							<span className="text-white font-bold">{syncCode}</span>
							{t('system_menu.link_note_p2')}
						</p>
						<div className="flex flex-col gap-3">
							<NeonButton
								variant="primary"
								fullWidth
								onClick={handleLinkDevice}
								disabled={isLinking}
							>
								{isLinking ? t('system_menu.linking') : t('system_menu.yes_link')}
							</NeonButton>
							<NeonButton variant="ghost" fullWidth onClick={() => setShowLinkModal(false)}>
								{t('system_menu.cancel')}
							</NeonButton>
						</div>
					</div>
				</NeonModal>
			</div>
		);
	}

	// Main Menu View
	return (
		<div className="flex flex-col gap-2 pb-6 animate-in fade-in slide-in-from-left-4 duration-300">
			<div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container border border-outline-variant/30 mb-2">
				<div className="flex items-center gap-3 mb-2">
					<span className="material-symbols-outlined text-primary-container">language</span>
					<span className="font-bold text-sm tracking-wider uppercase text-white">
						{t('system_menu.language')}
					</span>
				</div>
				<div className="flex gap-2">
					{(['es', 'en', 'ca'] as const).map((lang) => (
						<button
							key={lang}
							onClick={() => setLanguage(lang)}
							className={`flex-1 py-2 rounded uppercase font-bold text-xs tracking-wider transition-colors border border-transparent ${language === lang ? 'bg-primary-container text-background font-black' : 'bg-surface-container-high text-outline hover:text-white hover:border-outline-variant/50'}`}
						>
							{lang}
						</button>
					))}
				</div>
			</div>

			<button
				onClick={() => setActiveView('instructions')}
				className="flex items-center justify-between w-full p-4 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary-container/50 hover:bg-surface-container-high transition-all group"
			>
				<div className="flex items-center gap-3">
					<span className="material-symbols-outlined text-primary-container">menu_book</span>
					<span className="font-bold text-sm tracking-wider uppercase text-white group-hover:text-primary-container transition-colors">
						{t('system_menu.instructions')}
					</span>
				</div>
				<span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors">
					chevron_right
				</span>
			</button>

			<button
				onClick={() => setActiveView('sync')}
				className="flex items-center justify-between w-full p-4 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary-container/50 hover:bg-surface-container-high transition-all group"
			>
				<div className="flex items-center gap-3">
					<span className="material-symbols-outlined text-primary-container">cloud_sync</span>
					<span className="font-bold text-sm tracking-wider uppercase text-white group-hover:text-primary-container transition-colors">
						{t('system_menu.cloud_sync')}
					</span>
				</div>
				<span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors">
					chevron_right
				</span>
			</button>

			{isTournamentActive && (
				<button
					onClick={() => setShowAbortModal(true)}
					className="flex items-center justify-between w-full p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 hover:border-orange-500/60 hover:bg-orange-500/10 transition-all group mt-6"
				>
					<div className="flex items-center gap-3">
						<span className="material-symbols-outlined text-orange-400">cancel</span>
						<span className="font-bold text-sm tracking-wider uppercase text-orange-400 group-hover:text-orange-300 transition-colors">
							{t('system_menu.abort_tournament')}
						</span>
					</div>
				</button>
			)}

			<button
				onClick={() => setShowHardResetModal(true)}
				className={`flex items-center justify-between w-full p-4 rounded-xl bg-neon-red/5 border border-neon-red/20 hover:border-neon-red/60 hover:bg-neon-red/10 transition-all group ${isTournamentActive ? 'mt-2' : 'mt-6'}`}
			>
				<div className="flex items-center gap-3">
					<span className="material-symbols-outlined text-neon-red">delete_forever</span>
					<span className="font-bold text-sm tracking-wider uppercase text-neon-red group-hover:text-red-400 transition-colors">
						{t('system_menu.delete_all_data')}
					</span>
				</div>
			</button>

			<div className="mt-8 text-center flex flex-col gap-1">
				<p className="text-[10px] text-outline uppercase tracking-[0.3em]">
					EL FARSANTE v{__APP_VERSION__}
				</p>
				<p className="text-[10px] text-outline/50 uppercase tracking-widest">
					{t('system_menu.designed_for_infamy')}
				</p>
			</div>

			<NeonModal
				isOpen={showHardResetModal}
				onClose={() => setShowHardResetModal(false)}
				title={t('system_menu.delete_all_title')}
			>
				<div className="flex flex-col gap-6">
					<p className="text-on-surface-variant">
						{t('system_menu.delete_warning_p1')}
						<span className="text-neon-red font-bold">{t('system_menu.delete_warning_bold')}</span>
						{t('system_menu.delete_warning_p2')}
					</p>
					<div className="flex flex-col gap-3">
						<NeonButton
							variant="primary"
							fullWidth
							onClick={() => {
								dispatch({ type: 'HARD_RESET' });
								window.location.reload();
							}}
							className="!bg-neon-red/20 !border-neon-red !text-neon-red hover:!bg-neon-red hover:!text-white"
						>
							{t('system_menu.yes_delete_all')}
						</NeonButton>
						<NeonButton variant="ghost" fullWidth onClick={() => setShowHardResetModal(false)}>
							{t('system_menu.cancel')}
						</NeonButton>
					</div>
				</div>
			</NeonModal>

			<NeonModal
				isOpen={showAbortModal}
				onClose={() => setShowAbortModal(false)}
				title={t('system_menu.abort_tournament_title')}
			>
				<div className="flex flex-col gap-6">
					<p className="text-on-surface-variant">{t('system_menu.abort_tournament_desc')}</p>
					<div className="flex flex-col gap-3">
						<NeonButton variant="danger" fullWidth onClick={handleAbortTournament}>
							{t('system_menu.yes_abort')}
						</NeonButton>
						<NeonButton variant="ghost" fullWidth onClick={() => setShowAbortModal(false)}>
							{t('system_menu.cancel')}
						</NeonButton>
					</div>
				</div>
			</NeonModal>
		</div>
	);
}
